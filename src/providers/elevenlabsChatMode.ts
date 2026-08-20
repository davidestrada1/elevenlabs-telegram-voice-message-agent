import WebSocket from "ws";
import type { Config } from "../core/config.js";
import type { AgentReply } from "../core/types.js";
import type { AgentProvider } from "./contracts.js";

interface Session {
  socket: WebSocket;
  conversationId?: string;
  ready: Promise<void>;
  pending?: {
    resolve: (reply: AgentReply) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  };
}

export class ElevenLabsChatModeProvider implements AgentProvider {
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly config: Config) {}

  async reply(input: { chatId: string; text: string; languageHint?: string }): Promise<AgentReply> {
    const session = await this.getOrCreateSession(input.chatId, input.languageHint);
    if (session.pending) throw new Error("A previous message in this Telegram conversation is still being processed.");

    return new Promise<AgentReply>((resolve, reject) => {
      const timer = setTimeout(() => {
        session.pending = undefined;
        reject(new Error("ElevenLabs Agent Chat Mode response timed out."));
      }, this.config.CHAT_MODE_RESPONSE_TIMEOUT_MS);
      session.pending = { resolve, reject, timer };
      session.socket.send(JSON.stringify({ type: "user_message", text: input.text }));
    });
  }

  private async getOrCreateSession(chatId: string, languageHint?: string): Promise<Session> {
    const existing = this.sessions.get(chatId);
    if (existing && existing.socket.readyState === WebSocket.OPEN) return existing;

    const signedUrl = await this.getSignedUrl();
    const socket = new WebSocket(signedUrl);
    let readyResolve!: () => void;
    let readyReject!: (error: Error) => void;
    const ready = new Promise<void>((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
    });
    const session: Session = { socket, ready };

    socket.on("open", () => {
      socket.send(JSON.stringify({
        type: "conversation_initiation_client_data",
        dynamic_variables: {
          telegram_chat_id: chatId,
          channel: "telegram",
          language_hint: languageHint ?? "auto"
        }
      }));
      readyResolve();
    });

    socket.on("message", (raw) => {
      const event = this.parseEvent(raw.toString());
      if (!event) return;
      if (event.type === "conversation_initiation_metadata") {
        session.conversationId = event.conversation_initiation_metadata_event?.conversation_id;
        return;
      }
      if (event.type === "agent_response" && event.agent_response_event?.agent_response && session.pending) {
        const pending = session.pending;
        session.pending = undefined;
        clearTimeout(pending.timer);
        pending.resolve({
          text: event.agent_response_event.agent_response.trim(),
          languageCode: languageHint,
          conversationId: session.conversationId,
          shouldGenerateVoice: this.config.AUDIO_REPLY_MODE === "always"
        });
      }
    });

    socket.on("error", (error) => {
      if (session.pending) {
        const pending = session.pending;
        session.pending = undefined;
        clearTimeout(pending.timer);
        pending.reject(error instanceof Error ? error : new Error(String(error)));
      }
      readyReject(error instanceof Error ? error : new Error(String(error)));
    });

    socket.on("close", () => {
      this.sessions.delete(chatId);
      if (session.pending) {
        const pending = session.pending;
        session.pending = undefined;
        clearTimeout(pending.timer);
        pending.reject(new Error("ElevenLabs Agent Chat Mode session closed."));
      }
    });

    this.sessions.set(chatId, session);
    await ready;
    return session;
  }

  private async getSignedUrl(): Promise<string> {
    const url = new URL(`${this.config.ELEVENLABS_API_BASE_URL}/v1/convai/conversation/get-signed-url`);
    url.searchParams.set("agent_id", this.config.ELEVENLABS_AGENT_ID);
    const response = await fetch(url, { headers: { "xi-api-key": this.config.ELEVENLABS_API_KEY } });
    if (!response.ok) throw new Error(`ElevenLabs signed URL request failed with ${response.status}.`);
    const body = (await response.json()) as { signed_url?: string };
    if (!body.signed_url) throw new Error("ElevenLabs did not return a signed Agent session URL.");
    return body.signed_url;
  }

  private parseEvent(value: string): {
    type?: string;
    agent_response_event?: { agent_response?: string };
    conversation_initiation_metadata_event?: { conversation_id?: string };
  } | undefined {
    try {
      return JSON.parse(value) as {
        type?: string;
        agent_response_event?: { agent_response?: string };
        conversation_initiation_metadata_event?: { conversation_id?: string };
      };
    } catch {
      return undefined;
    }
  }
}
