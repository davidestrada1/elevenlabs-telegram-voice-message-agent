import { createApp } from "./app.js";
import { TelegramAdapter } from "./channels/telegram.js";
import { loadConfig } from "./core/config.js";
import { InMemoryIdempotencyStore } from "./core/stores.js";
import { ElevenLabsChatModeProvider } from "./providers/elevenlabsChatMode.js";
import { ElevenLabsSpeechProvider, ElevenLabsTranscriptionProvider } from "./providers/elevenlabsMedia.js";
import { VoiceMessagePipeline } from "./services/pipeline.js";

const config = loadConfig();
const telegram = new TelegramAdapter(config);
const pipeline = new VoiceMessagePipeline(config, {
  idempotency: new InMemoryIdempotencyStore(),
  telegram,
  transcription: new ElevenLabsTranscriptionProvider(config),
  agent: new ElevenLabsChatModeProvider(config),
  speech: new ElevenLabsSpeechProvider(config)
});

const app = createApp({ config, telegram, pipeline });
app.listen(config.PORT, () => {
  console.log(`ElevenLabs Telegram voice-message agent listening on port ${config.PORT}`);
});
