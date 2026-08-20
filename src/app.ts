import express from "express";
import pino from "pino";
import type { TelegramAdapter } from "./channels/telegram.js";
import type { Config } from "./core/config.js";
import type { VoiceMessagePipeline } from "./services/pipeline.js";

export function createApp(input: {
  config: Config;
  telegram: TelegramAdapter;
  pipeline: VoiceMessagePipeline;
}) {
  const app = express();
  const logger = pino({ level: input.config.LOG_LEVEL });
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.status(200).json({ ok: true, service: "elevenlabs-telegram-voice-message-agent" });
  });

  app.post("/webhooks/telegram", async (request, response) => {
    if (!input.telegram.verifySecret(request.header("x-telegram-bot-api-secret-token"))) {
      response.status(401).json({ error: "invalid webhook secret" });
      return;
    }

    const event = input.telegram.normalize(request.body);
    if (!event) {
      response.status(200).json({ ok: true, ignored: true });
      return;
    }

    try {
      const processed = await input.pipeline.process(event);
      response.status(200).json({ ok: true, duplicate: !processed });
    } catch (error) {
      logger.error({ err: error }, "telegram voice-message pipeline failed");
      response.status(500).json({ error: "processing failed" });
    }
  });

  return app;
}
