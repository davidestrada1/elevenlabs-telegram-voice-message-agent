# Architecture — Telegram Voice-Message Agent

## System context

```mermaid
flowchart LR
    U[Telegram user] -->|text or completed voice note| TG[Telegram Bot API]
    TG -->|HTTPS webhook + secret header| API[Node.js / Express bridge]

    API --> N[Normalize update]
    N -->|text| AG[ElevenLabs Agent\nChat Mode]
    N -->|voice file ID| FILE[Telegram getFile + media download]
    FILE --> STT[ElevenLabs Scribe v2]
    STT -->|transcript| AG

    AG -->|text response| API
    API -->|sendMessage| TG
    API -->|optional synthesis| TTS[ElevenLabs Text-to-Speech]
    TTS -->|audio bytes| TG
    TG -->|written answer + optional voice note| U
```

## Request flow

```mermaid
sequenceDiagram
    actor User as Telegram user
    participant Telegram as Telegram Bot API
    participant Bridge as Node.js bridge
    participant Scribe as ElevenLabs Scribe v2
    participant Agent as ElevenLabs Agent Chat Mode
    participant TTS as ElevenLabs TTS

    User->>Telegram: Send text or completed voice note
    Telegram->>Bridge: POST /webhooks/telegram
    Bridge->>Bridge: Verify secret and claim update ID

    alt Text message
        Bridge->>Agent: Send canonical text
    else Voice message
        Bridge->>Telegram: getFile + download voice bytes
        Telegram-->>Bridge: Audio asset
        Bridge->>Scribe: Transcribe audio
        Scribe-->>Bridge: Transcript + language hint
        Bridge->>Agent: Send transcript as canonical text
    end

    Agent-->>Bridge: Agent response
    Bridge->>Telegram: sendMessage(text)
    opt Voice reply enabled
        Bridge->>TTS: Synthesize response
        TTS-->>Bridge: Audio bytes
        Bridge->>Telegram: sendVoice(audio)
    end
    Telegram-->>User: Written answer and optional voice note
```

## Boundary ownership

| Boundary | Responsibility |
|---|---|
| Telegram | User identity, bot transport, webhook delivery, voice-file retrieval, text and voice delivery |
| Node.js bridge | Authentication, normalization, orchestration, idempotency, error messages, configuration |
| ElevenLabs Scribe v2 | Batch speech-to-text for completed voice notes |
| ElevenLabs Agent Chat Mode | Conversational reasoning and response generation |
| ElevenLabs TTS | Optional response audio rendering |

## Reliability and security

- Telegram webhook requests require `X-Telegram-Bot-Api-Secret-Token` verification.
- Credentials are loaded from local environment configuration and are not embedded in source code.
- Duplicate Telegram updates are rejected by the idempotency store.
- Voice-file and reply-size limits protect the demo service from oversized payloads.
- Text delivery is treated as the primary success path; a TTS failure does not invalidate a successful written response.
- The prototype awaits processing for demo clarity. A production deployment should acknowledge quickly, persist the update, enqueue work, and process STT, agent, TTS, and delivery in workers.

## Production evolution

```mermaid
flowchart LR
    W[Webhook API] --> Q[Durable queue]
    Q --> Worker[Worker pool]
    Worker --> DB[(Postgres\nupdates + sessions)]
    Worker --> Store[(Object storage\naudio)]
    Worker --> Providers[Telegram + ElevenLabs APIs]
    Worker --> Obs[Logs, metrics, tracing, alerts]
```

The current repository deliberately keeps the operational surface small for an interview demonstration. The next production step is to replace the in-memory idempotency store and in-request processing with durable state, queue-backed workers, retry policies, and provider-aware rate limiting.