import "dotenv/config";
import { z } from "zod";

const trueByDefault = z.enum(["true", "false"]).default("true").transform((value) => value === "true");
const falseByDefault = z.enum(["true", "false"]).default("false").transform((value) => value === "true");

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16),
  TELEGRAM_ACCOUNT_ID: z.string().default("interview-demo"),
  ELEVENLABS_API_KEY: z.string().min(1),
  ELEVENLABS_AGENT_ID: z.string().min(1),
  ELEVENLABS_TTS_VOICE_ID: z.string().min(1),
  ELEVENLABS_TTS_MODEL_ID: z.string().default("eleven_multilingual_v2"),
  ELEVENLABS_STT_MODEL_ID: z.string().default("scribe_v2"),
  ELEVENLABS_API_BASE_URL: z.string().url().default("https://api.elevenlabs.io"),
  TELEGRAM_REPLY_WITH_VOICE: trueByDefault,
  AUDIO_REPLY_MODE: z.enum(["never", "on_request", "always"]).default("always"),
  MAX_INBOUND_AUDIO_BYTES: z.coerce.number().int().positive().max(20 * 1024 * 1024).default(20 * 1024 * 1024),
  MAX_REPLY_CHARS: z.coerce.number().int().positive().max(3800).default(1400),
  HIGH_VOLUME_MODE: falseByDefault,
  HIGH_VOLUME_ESTIMATED_WAIT_SECONDS: z.coerce.number().int().positive().default(120),
  CHAT_MODE_RESPONSE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000)
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env = process.env): Config {
  return schema.parse(env);
}
