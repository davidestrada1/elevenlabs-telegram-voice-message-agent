# 7–10 Minute Interview Demonstration Script

## Opening — 45 seconds

> “I built a Telegram-first **voice-message agent**, not a calling agent. A user can write to it or send a completed voice note. The agent understands both, sends a written response, and can also send an AI-generated voice note. I used ElevenLabs for the parts where it is strongest: Scribe v2 for speech-to-text, Chat Mode/Agents for the reasoning layer, and ElevenLabs TTS for the audio reply.”

Show the repository root and point to the four boundaries: `src/channels/telegram.ts`, `src/providers/elevenlabsMedia.ts`, `src/providers/elevenlabsChatMode.ts`, and `src/services/pipeline.ts`.

## Product flow — 90 seconds

Show the diagram in the README. Explain that text goes directly into a private ElevenLabs Chat Mode session. A voice note goes through Telegram `getFile`, ElevenLabs Scribe v2, then the same text Agent path. The Agent response returns as text; TTS optionally renders the same answer to a Telegram voice note.

> “The transcript is the canonical user turn. That makes it easier to audit, search, apply language policy, and fall back to text if the TTS delivery fails.”

## Live text demonstration — 90 seconds

Send a short text message to the Telegram bot, such as:

```text
Explain in one sentence what this demo does.
```

Show the text reply and optional voice-note reply. Explain that the private Agent is configured in ElevenLabs with Chat Mode enabled. The service gets a signed WebSocket URL on the server; the ElevenLabs key never reaches Telegram.

## Live voice-note demonstration — 90 seconds

Send a short completed voice note, for example:

```text
In Spanish: ¿Puedes explicar qué ocurre cuando te envío una nota de voz?
```

Narrate the stages while the response arrives:

> “Telegram receives a standard voice note. My adapter validates the signed update, downloads the file using `getFile`, then Scribe v2 produces a transcript and language metadata. I send the transcript to the same text-only Agent. Finally the application sends text first and an optional TTS voice note.”

If available, repeat with a Polish test phrase. Do not claim perfect multilingual quality; say that English, Spanish, and Polish are the launch evaluation languages.

## High-volume experience — 60 seconds

Temporarily set `HIGH_VOLUME_MODE=true` and restart, or show the relevant configuration and test. Send a message and point out the transparent acknowledgement:

> “We have a high volume of requests, so this is not a real-time conversation. We’ll answer as fast as possible.”

Then say:

> “This is deliberate. Voice-note messaging is asynchronous. I do not fake live presence or invent an ETA. The production version drives this from queue age and capacity telemetry.”

## ElevenLabs ecosystem discussion — 90 seconds

| Question | Suggested answer |
|---|---|
| Why not a generic LLM directly? | “I wanted to make the agent configuration, knowledge, workflows, tools, and conversation observability native to ElevenLabs where possible. Telegram is just the transport edge.” |
| Why Chat Mode? | “It fits a text-and-voice-message product. I do not need a live microphone, WebRTC, or a telephone call. Scribe turns completed audio into text, and Chat Mode handles the text conversation.” |
| Why keep a Telegram service? | “The channel owns bot authentication, media files, native voice-note format, retries, and delivery. A small adapter keeps those operational concerns correct.” |
| Is this production-ready? | “It is an interview-ready end-to-end prototype. The next step is durable queues, PostgreSQL, storage, Ogg/Opus verification/transcoding, full retry policy, and tenant isolation.” |
| How would you add WhatsApp? | “I would preserve the same normalized text/transcript core. ElevenLabs now supports WhatsApp Agents, which I would validate in a proof of concept; channel policy, opt-in, templates, and delivery state remain explicit commercial controls.” |

## Close — 45 seconds

> “The core decision was to create the right interaction model rather than forcing a realtime voice agent into the wrong product. Users can talk naturally through text and voice messages. ElevenLabs provides the agent intelligence and voice stack, and a thin Telegram adapter handles safe, native delivery. That pattern can grow into a multi-tenant Telegram-first, WhatsApp-next service.”

## If something breaks

Do not improvise with secrets or disable verification. Say:

> “The code is tested locally, and the integration boundary is intentionally explicit. I would verify the Agent’s Chat Mode setting, the signed-URL permission, ElevenLabs API key, Telegram webhook status, and media-output format in that order. The architecture remains valid even if a provider credential or deployment setting needs correction.”
