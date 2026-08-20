# Interview Demo Credentials Checklist

> **Never put a real value in this file.** Fill only the status and the secret-manager reference. Keep keys, tokens, passwords, private certificates, and connection strings in a local `.env` file for development or in the deployment secret manager for the interview demo.

| Item | Needed for | Status | Secret-manager reference or non-secret identifier | Notes |
|---|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API requests | To create |  | Create via BotFather; server-side only. |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook header verification | To create |  | Generate a high-entropy value; use with `setWebhook`. |
| `TELEGRAM_WEBHOOK_URL` | Telegram update delivery | To create |  | Public HTTPS URL, for example `https://demo.example.com/webhooks/telegram`. |
| Telegram bot username | Interview handoff | To create |  | Non-secret `@username`. |
| `ELEVENLABS_API_KEY` | Agent signed URL, Scribe v2, TTS | To create |  | Prefer restricted service-account key; never client-side. |
| `ELEVENLABS_AGENT_ID` | Private Chat Mode Agent | To create |  | Non-secret ID from ElevenLabs Agent dashboard. |
| `ELEVENLABS_TTS_VOICE_ID` | TTS voice selection | To create |  | Use an approved voice with appropriate rights. |
| `ELEVENLABS_TTS_MODEL_ID` | Voice synthesis route | To create |  | Non-secret; default is `eleven_multilingual_v2`. |
| `ELEVENLABS_STT_MODEL_ID` | Speech recognition route | To create |  | Non-secret; default is `scribe_v2`. |
| ElevenLabs workspace owner | Account recovery/billing | To create |  | Record organization owner alias, never a password. |
| Public HTTPS host/tunnel | Telegram webhook ingress | To create |  | Use test-only tunnel credentials for local development. |
| Optional `DATABASE_URL` | Production durability | Not needed |  | Not required for tomorrow’s demo; needed before real clients. |
| Optional `REDIS_URL` | Production queue/locks | Not needed |  | Not required for tomorrow’s demo; needed before real clients. |

## Pre-demo checks

| Check | Status | Evidence |
|---|---|---|
| MFA enabled for Telegram and ElevenLabs owners | To create |  |
| `.env` exists locally and is ignored by Git | To create |  |
| ElevenLabs Agent has **Chat Mode** enabled | To create |  |
| Agent prompt requests concise, language-preserving responses | To create |  |
| Telegram webhook secret matches `TELEGRAM_WEBHOOK_SECRET` | To create |  |
| Health endpoint returns `200` | To create |  |
| Text message demo succeeds | To create |  |
| Voice-note demo succeeds | To create |  |
| AI-generated voice message disclosure is visible in the demo narrative | To create |  |

## Official sources

[1]: https://core.telegram.org/bots/api "Telegram Bot API"
[2]: https://elevenlabs.io/docs/api-reference/authentication "ElevenLabs API Authentication"
[3]: https://elevenlabs.io/docs/eleven-agents/guides/chat-mode "ElevenLabs Agents Chat Mode"
