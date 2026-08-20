import type { AgentReply, AudioAsset, Transcript } from "../core/types.js";

export interface TranscriptionProvider {
  transcribe(audio: AudioAsset, languageHint?: string): Promise<Transcript>;
}

export interface AgentProvider {
  reply(input: { chatId: string; text: string; languageHint?: string }): Promise<AgentReply>;
}

export interface SpeechProvider {
  synthesize(input: { text: string; languageHint?: string }): Promise<AudioAsset>;
}
