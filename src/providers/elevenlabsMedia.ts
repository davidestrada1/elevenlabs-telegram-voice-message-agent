import type { Config } from "../core/config.js";
import type { AudioAsset, Transcript } from "../core/types.js";
import type { SpeechProvider, TranscriptionProvider } from "./contracts.js";

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}

export class ElevenLabsTranscriptionProvider implements TranscriptionProvider {
  constructor(private readonly config: Config) {}

  async transcribe(audio: AudioAsset, languageHint?: string): Promise<Transcript> {
    const form = new FormData();
    form.set("file", new File([toArrayBuffer(audio.bytes)], audio.fileName, { type: audio.mimeType }));
    form.set("model_id", this.config.ELEVENLABS_STT_MODEL_ID);
    if (languageHint) form.set("language_code", languageHint);

    const response = await fetch(`${this.config.ELEVENLABS_API_BASE_URL}/v1/speech-to-text`, {
      method: "POST",
      headers: { "xi-api-key": this.config.ELEVENLABS_API_KEY },
      body: form
    });
    if (!response.ok) throw new Error(`ElevenLabs STT failed with ${response.status}.`);
    const body = (await response.json()) as {
      text?: string;
      language_code?: string;
      language_probability?: number;
      request_id?: string;
    };
    if (!body.text?.trim()) throw new Error("ElevenLabs STT returned no transcript.");

    return {
      text: body.text.trim(),
      languageCode: body.language_code,
      languageProbability: body.language_probability,
      providerRequestId: body.request_id
    };
  }
}

export class ElevenLabsSpeechProvider implements SpeechProvider {
  constructor(private readonly config: Config) {}

  async synthesize(input: { text: string; languageHint?: string }): Promise<AudioAsset> {
    const url = new URL(`${this.config.ELEVENLABS_API_BASE_URL}/v1/text-to-speech/${this.config.ELEVENLABS_TTS_VOICE_ID}`);
    // Opus is selected for Telegram's native voice-note path. Validate the result
    // with a real bot before a demo and add ffmpeg normalization if needed.
    url.searchParams.set("output_format", "opus_48000_128");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": this.config.ELEVENLABS_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        text: input.text,
        model_id: this.config.ELEVENLABS_TTS_MODEL_ID,
        voice_settings: { stability: 0.55, similarity_boost: 0.75 }
      })
    });
    if (!response.ok) throw new Error(`ElevenLabs TTS failed with ${response.status}.`);

    return {
      bytes: Buffer.from(await response.arrayBuffer()),
      fileName: "elevenlabs-reply.ogg",
      mimeType: "audio/ogg"
    };
  }
}
