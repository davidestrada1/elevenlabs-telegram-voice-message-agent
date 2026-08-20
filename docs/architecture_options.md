# Architecture Options for the Interview Demonstration

The product is a **voice-message agent**, not a live calling agent. Users send Telegram text or completed voice notes. The service replies with text and, when enabled, an AI-generated voice note. It must say that it is processing rather than imply a live realtime conversation.

## Two viable implementations

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---|
| **ElevenLabs Agent bridge — primary interview demo** | Telegram remains a small custom adapter. ElevenLabs provides Scribe v2 transcription, Chat Mode agent logic, agent configuration/workflows/knowledge, and TTS. The bridge maintains a text-only Agent session for a Telegram conversation and receives `agent_response` events. This maximizes visible ElevenLabs ecosystem use. | Depends on ElevenLabs plan/usage | Moderate: configure an Agent in the ElevenLabs dashboard, create a service key, and run the bridge behind HTTPS. |
| **ElevenLabs voice APIs plus an external text model — resilient fallback** | ElevenLabs provides Scribe v2 and TTS, while a configurable LLM provider produces text. This is simpler to operate and avoids a long-lived Agent WebSocket session, but demonstrates less of the ElevenLabs Agents platform. | Depends on chosen providers and voice usage | Lower: configure Telegram plus API keys; no Agent session bridge. |

## Repository decision

The repository implements the **ElevenLabs Agent bridge as the intended route** and keeps the text-generation boundary explicit so an external-model fallback can be added without rewriting the Telegram/media pipeline. This is a strong interview design because it is honest about the limitation: ElevenLabs can provide the agent layer, speech recognition, speech generation, knowledge, workflows, and agent observability, while Telegram still requires a dedicated adapter for signed updates, media retrieval, native voice-note delivery, and idempotent operations.

> **Interview framing:** “I used ElevenLabs wherever it adds differentiated value—Scribe v2 for multilingual voice notes, Chat Mode/Agents for the agent brain and skills, and ElevenLabs TTS for voice responses. I kept Telegram as a thin channel adapter because user delivery, webhook verification, voice-note media semantics, and queue correctness are channel responsibilities.”

## Why this remains asynchronous

An incoming Telegram update is accepted and deduplicated first. The assistant can send a receipt immediately. Voice notes are transcribed, sent to a text-only agent session, synthesized as a completed audio file, transcoded/validated as Ogg/Opus, and sent back through Telegram. Streaming is deliberately not visible to the user: it can improve internal generation latency but cannot make a completed Telegram voice note a live two-way call.

## Required ElevenLabs workspace setup

Create one **text-only Agent** in the ElevenLabs dashboard, enable Chat Mode, configure the system prompt and preferred languages, and capture the non-secret `ELEVENLABS_AGENT_ID`. For private Agents, the server uses an `ELEVENLABS_API_KEY` to obtain a signed session URL; no key is sent to Telegram or any client. Add a knowledge base or workflow only after the basic text and voice-note loop works. The project’s `.env.example` and `docs/interview_setup.md` list every setting.

## Sources

[1]: https://elevenlabs.io/docs/eleven-agents/guides/chat-mode "ElevenLabs Agents — Chat Mode"
[2]: https://elevenlabs.io/docs/eleven-agents/libraries/java-script "ElevenLabs Agents — JavaScript SDK"
[3]: https://elevenlabs.io/docs/overview/capabilities/speech-to-text "ElevenLabs — Speech to Text"
[4]: https://elevenlabs.io/docs/overview/capabilities/text-to-speech "ElevenLabs — Text to Speech"
[5]: https://core.telegram.org/bots/api "Telegram Bot API"
