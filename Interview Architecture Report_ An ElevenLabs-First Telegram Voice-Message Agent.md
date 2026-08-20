# Interview Architecture Report: An ElevenLabs-First Telegram Voice-Message Agent

**Prepared for an ElevenLabs interview.** This repository demonstrates a messaging product, not a live calling product. It allows users to converse with an AI using **text messages and completed voice messages** in Telegram. The primary response is written text; an AI-generated voice note is an optional, accessible derivative.

## Executive position

The agent can use ElevenLabs for nearly every intelligence and voice-facing component: Scribe v2 transcribes incoming voice notes, ElevenLabs Agents Chat Mode provides the text agent, the ElevenLabs workspace holds agent prompt/knowledge/workflow/LLM configuration, and ElevenLabs TTS generates voice replies. Telegram remains a necessary thin integration layer because it owns the user chat, webhook delivery, authentication, media retrieval, and native voice-note send operation. This is not a gap in the design—it is the correct separation between an agent platform and a messaging transport.

> **Interview thesis:** “The goal was not to force a live voice agent into a messaging channel. I used ElevenLabs as the intelligence and speech platform, while keeping a minimal Telegram transport adapter responsible for secure, asynchronous delivery.”

## User experience

The user has two equally valid inputs. A text message is delivered to the Agent Chat Mode bridge. A voice message is downloaded from Telegram, transcribed by Scribe v2, and then submitted as the same canonical text type. In both cases the agent returns a text response and may generate a voice note. The user can therefore write, speak, and receive audio without the product pretending that an asynchronous queue is a phone call.

| Moment | User sees | System does |
|---|---|---|
| User writes text | Normal Telegram chat | Sends text to an ElevenLabs Chat Mode Agent session |
| User sends voice note | Completed voice message | Downloads Telegram media, calls ElevenLabs Scribe v2, preserves detected language/transcript |
| Agent responds | Text answer | Receives `agent_response` from Chat Mode and sends Telegram text |
| Voice reply enabled | Native Telegram voice message | Calls ElevenLabs TTS and sends the completed result with Telegram `sendVoice` |
| High volume | Honest delay notice | Explicitly states the interaction is not realtime and queues work in production |

## ElevenLabs ecosystem mapping

| ElevenLabs component | Role in this repository | Interview value |
|---|---|---|
| Agents | Agent instructions, persona, language behaviour, knowledge, workflows, tools, evaluations, versioning | Shows that the agent is a managed product configuration rather than a hard-coded prompt |
| Chat Mode | Text-only Agent session after text input or Scribe transcript | Matches Telegram’s message-oriented UX without adding a microphone/call interface [1] |
| Scribe v2 | Batch transcription of completed Telegram voice notes | Demonstrates multilingual voice understanding and metadata-aware STT [2] |
| Text-to-Speech | Optional completed audio response | Demonstrates a high-quality voice output without implying a live conversation [3] |
| Workspace service API key | Private signed URL for the Agent session and STT/TTS calls | Demonstrates correct server-side key management [4] |
| Knowledge/workflows/tools | Optional second-stage enhancement | Gives a concrete roadmap for client-specific skills and integrations [5] |
| WhatsApp Agents | Future channel proof of concept | ElevenLabs announced official WhatsApp Agent support in December 2025; it does not replace Telegram integration [6] |

## How Agent Chat Mode fits Telegram

ElevenLabs Chat Mode is designed for text-only Agent conversations. The official guide supports enabling it in Agent configuration or using a runtime text-only override. The guide requires handling the `agent_response` event and sending user text programmatically. The JavaScript SDK establishes a session using `Conversation.startSession`; text-only sessions use WebSockets by default. For a private Agent, the server obtains a signed URL with the secret API key and passes the signed URL to the session instead of exposing the key. [1] [7]

The repository mirrors this documented pattern at the protocol boundary. It requests `GET /v1/convai/conversation/get-signed-url?agent_id=...` using the server-side `xi-api-key`, opens the signed WebSocket, supplies `conversation_initiation_client_data`, and sends `user_message` text. It waits for the Agent’s `agent_response` event. The code keeps the session keyed to a Telegram chat in development; production should persist session/user correlation and introduce lifecycle, reconnect, and queue rules.

## Why the product is not a phone agent

The incoming audio is a completed Telegram file. Scribe v2 handles recorded/batch audio, returns a transcript/language metadata, and can operate asynchronously. It is not necessary to stream microphone frames or use a live turn-taking loop. TTS returns a completed file, which the adapter sends as a Telegram voice message. This fits the core requirement more honestly than WebRTC, SIP, or a telephony agent.

The current agent uses a short, transparent high-volume message:

> “We have a high volume of requests, so this is not a real-time conversation. We’ll answer as fast as possible.”

The prototype has a configuration flag to demonstrate the language. In a production build the condition would come from priority-queue age, provider backlog, capacity, and per-tenant SLA policies. The crucial design decision is that the system never invents an estimate or calls itself live.

## Telegram is still necessary

Telegram’s Bot API provides the bot token, HTTPS webhook event delivery, `secret_token` header, inbound voice `file_id`, `getFile` media retrieval, and outbound `sendVoice` delivery. A Bot API client must authenticate updates, deduplicate retries, cap media size, and format output for native voice-note use. Telegram documents voice notes around OGG/Opus, while ElevenLabs TTS supports Opus output; the repository requests Opus and labels it for the Telegram voice route. The first live bot should validate container/MIME compatibility and add an ffmpeg normalization step if Telegram rejects the returned payload. [8]

This boundary is valuable in an interview: it shows an understanding that agents are not substitutes for channel operations. The transport adapter remains narrow; the intelligence, language, and voice layers remain in ElevenLabs.

## Local versus hosted answer

The source code can run locally, and local development is sufficient for tests, a screen share, or an HTTPS-tunnel demo. However, normal ElevenLabs SDK/API calls use the hosted ElevenLabs service through a server-side API key. This is not local/offline inference. ElevenLabs has a separate private-deployment offering for authorized enterprise use cases. [9]

For a polished demonstration, run the Node service behind stable public HTTPS, register the Telegram webhook, and store `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and `ELEVENLABS_API_KEY` in deployment secrets. For a short private dry run, local development with a tunnel and test credentials is appropriate. The default sandbox must not be used as the production webhook host because it does not guarantee a durable public service.

## What can be built entirely in ElevenLabs—and what cannot

| Requirement | Entirely in ElevenLabs? | Reasoned answer |
|---|---|---|
| Agent prompt, knowledge, workflow, voice, LLM configuration | Largely yes | Configure in ElevenLabs Agents workspace/API. |
| Voice-note transcription | Yes | Scribe v2 can process completed audio through the API. |
| Text reasoning in a configured Agent | Yes, with a session bridge | Chat Mode provides text-only Agent behaviour but it uses a conversation session rather than a documented generic stateless completion endpoint. |
| Telegram receiving/sending | No | Telegram credentials, updates, media files, and native delivery remain Telegram Bot API responsibilities. |
| Durable queues, retries, tenant isolation, retention governance | No | These are application/control-plane responsibilities and should remain under the product owner’s control. |
| WhatsApp Agent deployment | Potentially, with validation | ElevenLabs documents native WhatsApp Agent support; confirm commercial onboarding, policy, and voice-note semantics in a proof of concept. [6] |

## Production roadmap after the interview

The smallest credible production upgrade adds PostgreSQL for tenant/message/idempotency state, Redis or a durable queue for job dispatch, private object storage for temporary audio, an ffmpeg worker for verified Ogg/Opus conversion, retry classification, queue-derived high-volume notices, and an administration console. The underlying model does not change. Telegram remains the first adapter; WhatsApp becomes the next adapter, preferably tested against ElevenLabs’ documented WhatsApp deployment with client-specific consent and template policies.

## Sources

[1]: https://elevenlabs.io/docs/eleven-agents/guides/chat-mode "ElevenLabs Agents — Chat Mode" (living documentation, reviewed August 16, 2026)
[2]: https://elevenlabs.io/docs/overview/capabilities/speech-to-text "ElevenLabs — Speech to Text" (living documentation, reviewed August 16, 2026)
[3]: https://elevenlabs.io/docs/overview/capabilities/text-to-speech "ElevenLabs — Text to Speech" (living documentation, reviewed August 16, 2026)
[4]: https://elevenlabs.io/docs/api-reference/authentication "ElevenLabs API — Authentication" (living documentation, reviewed August 16, 2026)
[5]: https://elevenlabs.io/docs/eleven-agents/customization/agent-workflows "ElevenLabs Agents — Agent Workflows" (living documentation, reviewed August 16, 2026)
[6]: https://elevenlabs.io/blog/elevenlabs-agents-whatsapp-support "ElevenLabs — ElevenLabs Agents now support WhatsApp" (published December 17, 2025)
[7]: https://elevenlabs.io/docs/eleven-agents/libraries/java-script "ElevenLabs Agents — JavaScript SDK" (living documentation, reviewed August 16, 2026)
[8]: https://core.telegram.org/bots/api "Telegram Bot API" (living documentation, reviewed August 16, 2026)
[9]: https://elevenlabs.io/docs/eleven-api/private-deployment/overview "ElevenLabs — Private Deployment" (living documentation, reviewed August 16, 2026)
