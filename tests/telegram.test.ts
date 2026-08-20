import { describe, expect, it } from "vitest";
import { TelegramAdapter } from "../src/channels/telegram.js";
import { loadConfig } from "../src/core/config.js";

const config = loadConfig({
  TELEGRAM_BOT_TOKEN: "test-token",
  TELEGRAM_WEBHOOK_SECRET: "test-secret-value-1234",
  ELEVENLABS_API_KEY: "test-elevenlabs-key",
  ELEVENLABS_AGENT_ID: "agent_test",
  ELEVENLABS_TTS_VOICE_ID: "voice_test"
});

describe("TelegramAdapter", () => {
  it("normalizes a text message", () => {
    const adapter = new TelegramAdapter(config);
    const event = adapter.normalize({
      update_id: 1,
      message: {
        message_id: 2,
        date: 1_700_000_000,
        chat: { id: 3 },
        from: { id: 4 },
        text: "Hola"
      }
    });
    expect(event).toMatchObject({ kind: "text", text: "Hola", chatId: "3" });
  });

  it("normalizes a voice message and verifies the secret", () => {
    const adapter = new TelegramAdapter(config);
    const event = adapter.normalize({
      update_id: 5,
      message: {
        message_id: 6,
        date: 1_700_000_000,
        chat: { id: 3 },
        from: { id: 4 },
        voice: { file_id: "voice-id", duration: 9, mime_type: "audio/ogg", file_size: 42 }
      }
    });
    expect(event).toMatchObject({ kind: "voice", media: { fileId: "voice-id", durationSeconds: 9 } });
    expect(adapter.verifySecret("test-secret-value-1234")).toBe(true);
    expect(adapter.verifySecret("incorrect")).toBe(false);
  });
});
