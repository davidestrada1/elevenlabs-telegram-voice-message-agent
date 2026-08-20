# Telegram Voice-Message Agent — Product One-Pager

## The product

An asynchronous Telegram assistant that lets people communicate naturally through either text messages or completed voice notes. It returns a clear written answer and can optionally send the same answer as an AI-generated voice note.

This project intentionally solves a **messaging** problem, not a live calling problem: users can speak to the assistant without requiring a real-time phone conversation, while the system remains transparent about processing time and provider failures.

## The problem

Typing is inconvenient when a user is mobile, multitasking, or more comfortable speaking. A traditional voice-agent architecture is often too complex for an asynchronous messaging channel: it introduces live audio streaming, call state, interruption handling, and telephony concerns that Telegram does not need.

The product bridges that gap by accepting a finished Telegram voice note, transcribing it, reasoning over the resulting text, and delivering a written and optional spoken response.

## Who it serves

- **Mobile users** who prefer speaking to typing.
- **Support and operations teams** that need a lightweight conversational intake channel.
- **Product teams** evaluating an AI agent through an existing messaging surface.
- **Interview and prototype stakeholders** who need a demonstrable end-to-end flow with clear system boundaries.

## How it works

1. Telegram delivers a signed webhook update to the Node.js service.
2. The service normalizes text or voice-note input and rejects unauthenticated webhook requests.
3. Text goes directly to an ElevenLabs Agent Chat Mode session.
4. Voice notes are retrieved from Telegram and transcribed with ElevenLabs Scribe v2.
5. The canonical text is sent through the same ElevenLabs agent path.
6. The service sends the primary answer as Telegram text.
7. When enabled, ElevenLabs Text-to-Speech renders the answer and Telegram sends it as a voice note.

## Why this architecture

Telegram remains the transport layer because it owns bot identity, webhook delivery, media retrieval, and native message delivery. ElevenLabs provides the voice and intelligence layer: speech-to-text, agent reasoning, and text-to-speech. This keeps each platform inside its strongest boundary and avoids pretending that an asynchronous message exchange is a live call.

## Technical highlights

- TypeScript and Node.js with strict compiler checking.
- Express webhook endpoint with Telegram secret-token verification.
- ElevenLabs Agents Chat Mode over a private server-minted WebSocket session.
- ElevenLabs Scribe v2 batch transcription for Telegram voice notes.
- ElevenLabs Text-to-Speech for optional voice replies.
- Idempotency protection for duplicate Telegram updates.
- Environment-based credentials with dedicated safe webhook-registration scripts.
- Explicit production roadmap: durable queue, persistent idempotency, object storage, worker execution, and observability.

## Demo and repository

The demo entry point is the Telegram bot configured for the deployment. The public repository contains the implementation, setup guide, demo script, architecture report, and diagram. Credentials are never part of the repository; recruiters should use the project page and architecture materials rather than expecting unrestricted access to a private bot or provider account.

See [`README.md`](../README.md) for local setup, [`architecture.md`](architecture.md) for the system diagram, and [`demo_script.md`](demo_script.md) for the walkthrough.