import type { Config } from "../core/config.js";
import type { IdempotencyStore } from "../core/stores.js";
import type { TelegramInboundEvent } from "../core/types.js";
import { TelegramAdapter } from "../channels/telegram.js";
import type { AgentProvider, SpeechProvider, TranscriptionProvider } from "../providers/contracts.js";

const HIGH_VOLUME_MESSAGE = "We have a high volume of requests, so this is not a real-time conversation. We’ll answer as fast as possible.";

export class VoiceMessagePipeline {
  constructor(
    private readonly config: Config,
    private readonly dependencies: {
      idempotency: IdempotencyStore;
      telegram: TelegramAdapter;
      transcription: TranscriptionProvider;
      agent: AgentProvider;
      speech: SpeechProvider;
    }
  ) {}

  async process(event: TelegramInboundEvent): Promise<boolean> {
    const claimed = await this.dependencies.idempotency.claim(`telegram:${event.updateId}`);
    if (!claimed) return false;

    if (this.config.HIGH_VOLUME_MODE) {
      await this.dependencies.telegram.sendText(event, HIGH_VOLUME_MESSAGE).catch(() => undefined);
    }

    let canonicalText: string;
    let languageHint: string | undefined;
    if (event.kind === "text") {
      canonicalText = event.text ?? "";
    } else {
      try {
        const audio = await this.dependencies.telegram.downloadVoice(event);
        const transcript = await this.dependencies.transcription.transcribe(audio);
        canonicalText = transcript.text;
        languageHint = transcript.languageCode;
      } catch {
        await this.dependencies.telegram.sendText(
          event,
          "I couldn’t understand that voice message. Please try a shorter recording or send your request as text."
        );
        return true;
      }
    }

    if (!canonicalText.trim()) {
      await this.dependencies.telegram.sendText(event, "I received your message, but it did not contain usable text.");
      return true;
    }

    let reply;
    try {
      reply = await this.dependencies.agent.reply({
        chatId: event.chatId,
        text: canonicalText,
        languageHint
      });
    } catch {
      await this.dependencies.telegram.sendText(
        event,
        "I’m still processing this request. Please try again shortly."
      );
      return true;
    }

    const text = reply.text.slice(0, this.config.MAX_REPLY_CHARS);
    await this.dependencies.telegram.sendText(event, text);

    if (this.config.TELEGRAM_REPLY_WITH_VOICE && reply.shouldGenerateVoice && this.config.AUDIO_REPLY_MODE !== "never") {
      try {
        const audio = await this.dependencies.speech.synthesize({ text, languageHint: reply.languageCode });
        await this.dependencies.telegram.sendVoice(event, audio);
      } catch {
        // The written reply already succeeded; a failed voice rendering is not a duplicate-message reason.
      }
    }
    return true;
  }
}
