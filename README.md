# ElevenLabs Telegram Voice-Message Agent

> **Recruiter view:** [Product one-pager](docs/product_one_pager.md) · [Architecture diagram](docs/architecture.md) · [Demo walkthrough](docs/demo_script.md)

This is a **Telegram-first, asynchronous voice-message agent** built for an ElevenLabs interview demonstration. It is deliberately **not** a telephone or live streaming voice agent. A Telegram user can send either ordinary text or a completed voice note. The service understands both, returns the primary answer as text, and returns an optional AI-generated Telegram voice note.

The build uses the ElevenLabs ecosystem wherever it is technically appropriate:

| Capability | Implementation |
|---|---|
| Agent brain | ElevenLabs Agents **Chat Mode** over a private, server-minted WebSocket session |
| Voice-note understanding | ElevenLabs **Scribe v2** batch speech-to-text |
| Voice-note reply | ElevenLabs **Text-to-Speech** with an approved voice/model |
| Agent configuration | ElevenLabs Agent ID, Chat Mode, prompt, knowledge base, workflow, LLM routing, testing, and versioning in the ElevenLabs workspace |
| Channel delivery | A thin custom Telegram adapter for signed webhooks, voice-file retrieval, and native `sendVoice` replies |

## At a glance

This project solves a simple product problem: people often prefer speaking to typing on mobile, but an asynchronous Telegram experience does not need the complexity or false expectations of a live phone call. The agent accepts text or completed voice notes, uses ElevenLabs for transcription, reasoning, and optional voice synthesis, and returns a transparent response through Telegram.

For a shareable overview, start with the [product one-pager](docs/product_one_pager.md). For the technical design, see the [architecture diagram](docs/architecture.md).

## Product behaviour

```text
Telegram text ───────────────────────────────────────────────┐
                                                             ├─→ ElevenLabs Chat Mode → text reply
Telegram voice note → Telegram file download → Scribe v2 STT ┘                              └→ optional ElevenLabs TTS → Telegram voice note
```

The agent is **asynchronous by design**. When `HIGH_VOLUME_MODE=true`, it sends the transparent message: “We have a high volume of requests, so this is not a real-time conversation. We’ll answer as fast as possible.” The user must not be led to believe they are on a live call.

## What is implemented

| Area | Status |
|---|---|
| Telegram written-message normalization | Implemented |
| Telegram voice-note normalization and download | Implemented |
| Telegram webhook-secret verification | Implemented |
| Telegram text and `sendVoice` replies | Implemented |
| ElevenLabs Scribe v2 batch STT call | Implemented |
| ElevenLabs Chat Mode private signed WebSocket session bridge | Implemented |
| ElevenLabs TTS call | Implemented |
| Duplicate-update protection | Development in-memory implementation |
| Production queue/database/storage | Intentionally documented as the next productionization step |

## Prerequisites

You need a Telegram bot token, an ElevenLabs service-account API key, a text-only ElevenLabs Agent ID, and an ElevenLabs voice ID. See [`docs/interview_setup.md`](docs/interview_setup.md) and [`docs/credentials_checklist.md`](docs/credentials_checklist.md). Do not store secrets in Git, chat, a slide deck, or a coding-agent prompt.

## Local quick start

```bash
pnpm install
cp .env.example .env
# Fill .env locally, never commit it.
pnpm check
pnpm test
pnpm dev
```

The health check is:

```text
GET http://localhost:3000/health
```

For local message testing, use a development tunnel with **test-only** credentials or temporarily use Telegram long polling in a separate helper. For the cleanest interview demo, deploy this process to a stable public HTTPS URL and register the Telegram webhook according to the setup guide.

### Register and inspect the Telegram webhook safely

Add the public HTTPS endpoint to the local `.env` file. Do not put a bot token or webhook secret in a command, shell history, log, or chat:

```text
TELEGRAM_WEBHOOK_URL=https://YOUR_TUNNEL_HOST.trycloudflare.com/webhooks/telegram
```

Then run these commands from the repository root. They load all credentials from `.env` and do not print them:

```bash
pnpm register-webhook
pnpm webhook-info
```

`register-webhook` configures Telegram with `allowed_updates: ["message"]` and prints only the result plus the webhook hostname. `webhook-info` prints Telegram’s current webhook status with sensitive values redacted. Keep the Node server and Cloudflare Tunnel processes running while testing. A temporary tunnel hostname changes when the tunnel restarts.

## Required ElevenLabs configuration

Create a private ElevenLabs Agent in the dashboard and turn on **Chat Mode**. Chat Mode is text-only, so the repository uses it as the agent-reasoning layer after text arrives directly or Scribe v2 has transcribed a voice note. The Node bridge requests a signed Agent WebSocket URL with the server-side `ELEVENLABS_API_KEY`; it never exposes the key to Telegram.

Configure the agent’s prompt to answer concisely and preserve the user’s language. For a first demo, use a simple knowledge-base document or no knowledge base. Add workflows, webhook tools, and external LLM routing only after the baseline loop succeeds.

## Important caveats to say in the interview

The public ElevenLabs SDK/API is a hosted service; local code calls it through a secret server-side API key. That is **not** offline local inference. ElevenLabs has a separate private-deployment offering for authorized enterprise use cases. Telegram also remains an independent transport concern: it has its own webhook authentication, media retrieval, native voice-note formats, and delivery/rate-limit behavior.

The repository’s current flow awaits processing inside the webhook request for demo clarity. A production version should persist the update, return success, enqueue a job, and perform STT, Agent Chat Mode, TTS, conversion, and delivery in workers. The interview report explains this tradeoff without pretending the prototype is production-complete.

## Documents

| File | Purpose |
|---|---|
| [`docs/interview_architecture_report.md`](docs/interview_architecture_report.md) | Source-backed report: what can be built entirely with ElevenLabs, what Telegram still requires, and the recommended architecture |
| [`docs/interview_setup.md`](docs/interview_setup.md) | Checklist to configure ElevenLabs, Telegram, local development, and a public demo |
| [`docs/demo_script.md`](docs/demo_script.md) | A concise 7–10 minute interview walkthrough with talking points and test messages |
| [`docs/credentials_checklist.md`](docs/credentials_checklist.md) | Placeholder-only credentials worksheet for this separate repository |
| [`docs/architecture_options.md`](docs/architecture_options.md) | Two valid solution paths and the scoped interview choice |

## Sources

[1]: https://elevenlabs.io/docs/eleven-agents/guides/chat-mode "ElevenLabs Agents — Chat Mode"
[2]: https://elevenlabs.io/docs/overview/capabilities/speech-to-text "ElevenLabs — Speech to Text"
[3]: https://elevenlabs.io/docs/overview/capabilities/text-to-speech "ElevenLabs — Text to Speech"
[4]: https://core.telegram.org/bots/api "Telegram Bot API"
