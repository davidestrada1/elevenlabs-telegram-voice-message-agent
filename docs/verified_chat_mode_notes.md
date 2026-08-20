# Verified ElevenLabs Chat Mode Notes

Reviewed 2026-08-16 from the official Chat Mode and JavaScript SDK documentation.

ElevenLabs Chat Mode is a text-only conversation configuration. It can be made the default at agent configuration time or enabled through a `conversation.text_only` runtime override. The official guide requires an `agent_response` callback/event in order to receive and display text replies. User text is sent programmatically through `send_user_message`.

The JavaScript SDK package is `@elevenlabs/client`. Its documented session entry point is `Conversation.startSession(options)`. For an unauthenticated/public agent, the agent ID can be supplied directly. For a private agent using WebSocket, a server requests a signed URL from `GET /v1/convai/conversation/get-signed-url?agent_id={agent_id}` with an `xi-api-key` header, then passes the signed URL into the client session. The documentation states that text-only conversations use WebSocket by default, while voice sessions use WebRTC by default.

Architecture consequence: the Telegram bridge can use an ElevenLabs Chat Mode session to produce text responses, but it needs a small server-side session bridge and must treat a persistent Telegram chat/session relationship carefully. The repository should include the adapter interface and a documented integration point rather than inventing a stateless agent-completion API. Voice notes are converted to text using Scribe v2 first; optional response audio is generated separately with ElevenLabs TTS and sent as a completed Telegram voice message.

Sources:
- https://elevenlabs.io/docs/eleven-agents/guides/chat-mode
- https://elevenlabs.io/docs/eleven-agents/libraries/java-script
