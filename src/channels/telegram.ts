import { timingSafeEqual } from "node:crypto";
import type { Config } from "../core/config.js";
import type { AudioAsset, DeliveryReceipt, TelegramInboundEvent } from "../core/types.js";

interface TelegramVoice {
  file_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    chat: { id: number | string };
    from?: { id: number };
    text?: string;
    voice?: TelegramVoice;
  };
}

function asArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}

export class TelegramAdapter {
  constructor(private readonly config: Config) {}

  verifySecret(value: string | undefined): boolean {
    if (!value) return false;
    const expected = Buffer.from(this.config.TELEGRAM_WEBHOOK_SECRET);
    const actual = Buffer.from(value);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  normalize(update: TelegramUpdate): TelegramInboundEvent | undefined {
    const message = update.message;
    if (!message?.from) return undefined;

    const base = {
      updateId: String(update.update_id),
      messageId: String(message.message_id),
      chatId: String(message.chat.id),
      senderId: String(message.from.id),
      receivedAt: new Date(message.date * 1000)
    };

    if (message.text?.trim()) return { ...base, kind: "text", text: message.text.trim() };
    if (message.voice) {
      return {
        ...base,
        kind: "voice",
        media: {
          fileId: message.voice.file_id,
          fileSizeBytes: message.voice.file_size,
          mimeType: message.voice.mime_type,
          durationSeconds: message.voice.duration
        }
      };
    }
    return undefined;
  }

  async downloadVoice(event: TelegramInboundEvent): Promise<AudioAsset> {
    if (!event.media) throw new Error("No Telegram media reference is available.");
    if (event.media.fileSizeBytes && event.media.fileSizeBytes > this.config.MAX_INBOUND_AUDIO_BYTES) {
      throw new Error("Voice note exceeds the configured size limit.");
    }

    const info = await this.api<{ result: { file_path?: string } }>("getFile", { file_id: event.media.fileId });
    if (!info.result.file_path) throw new Error("Telegram did not return a file path.");
    const response = await fetch(`https://api.telegram.org/file/bot${this.config.TELEGRAM_BOT_TOKEN}/${info.result.file_path}`);
    if (!response.ok) throw new Error(`Telegram voice download failed with ${response.status}.`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > this.config.MAX_INBOUND_AUDIO_BYTES) throw new Error("Downloaded voice note exceeds the configured size limit.");

    return {
      bytes,
      fileName: "telegram-voice.ogg",
      mimeType: event.media.mimeType ?? response.headers.get("content-type") ?? "audio/ogg",
      durationSeconds: event.media.durationSeconds
    };
  }

  async sendText(event: TelegramInboundEvent, text: string): Promise<DeliveryReceipt> {
    const result = await this.api<{ result: { message_id: number } }>("sendMessage", {
      chat_id: event.chatId,
      text,
      reply_parameters: { message_id: Number(event.messageId) }
    });
    return { messageId: String(result.result.message_id), acceptedAt: new Date() };
  }

  async sendVoice(event: TelegramInboundEvent, audio: AudioAsset): Promise<DeliveryReceipt> {
    const form = new FormData();
    form.set("chat_id", event.chatId);
    form.set("reply_parameters", JSON.stringify({ message_id: Number(event.messageId) }));
    form.set("voice", new File([asArrayBuffer(audio.bytes)], audio.fileName, { type: audio.mimeType }));
    const response = await fetch(`https://api.telegram.org/bot${this.config.TELEGRAM_BOT_TOKEN}/sendVoice`, {
      method: "POST",
      body: form
    });
    if (!response.ok) throw new Error(`Telegram sendVoice failed with ${response.status}.`);
    const result = (await response.json()) as { ok: boolean; result?: { message_id: number } };
    if (!result.ok || !result.result) throw new Error("Telegram did not accept the voice reply.");
    return { messageId: String(result.result.message_id), acceptedAt: new Date() };
  }

  private async api<T>(method: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`https://api.telegram.org/bot${this.config.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Telegram ${method} failed with ${response.status}.`);
    return (await response.json()) as T;
  }
}
