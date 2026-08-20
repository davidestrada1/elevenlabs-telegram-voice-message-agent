# Interview Setup: Telegram + ElevenLabs Voice-Message Agent

This guide is designed for a **tomorrow-ready demonstration**. It intentionally keeps the code small and makes the ElevenLabs contribution explicit: Scribe v2 for incoming voice notes, Chat Mode for text reasoning, and Text-to-Speech for voice replies.

## 1. Create and configure the ElevenLabs Agent

Create a private Agent in the ElevenLabs dashboard. In the Agent settings, enable **Chat Mode / Text only**. This is important: Telegram users will send text directly, while voice notes will be transcribed first and then sent into this text-only Agent session. Configure a short system prompt such as:

> You are a concise, helpful Telegram assistant. Reply in the user’s language when clear. You can receive messages that were transcribed from voice notes. Never claim to be a human or a live realtime call. If a request is ambiguous, ask one concise clarifying question.

Start without tools or a knowledge base. If you want one visual interview enhancement, add a short Markdown knowledge-base document describing the project and explain that the Agent configuration, knowledge, workflows, testing, and versioning belong in the ElevenLabs workspace. Copy the Agent ID into the local `ELEVENLABS_AGENT_ID` setting.

Create a restricted server/service API key in the ElevenLabs workspace. The backend uses it to request a private Agent signed URL and to call the Scribe/TTS APIs. Do not use a browser key, paste it into this guide, or disclose it during a screen-share.

## 2. Configure the ElevenLabs voice path

Choose an approved ElevenLabs voice and copy its non-secret voice ID into `ELEVENLABS_TTS_VOICE_ID`. Leave the defaults as `scribe_v2` for speech-to-text and `eleven_multilingual_v2` for speech generation unless you have tested another model. For the demo, test one English, one Spanish, and one Polish phrase. Explain that language coverage is not the same as measured production accuracy; a production rollout uses native-speaker evaluation and quality thresholds.

## 3. Create the Telegram bot

Create a bot using BotFather and place the returned token in `TELEGRAM_BOT_TOKEN`. Create a long random `TELEGRAM_WEBHOOK_SECRET` and retain it in your secret manager/local `.env`. Do not reuse the bot token as the webhook secret.

Start the service after filling the `.env` file:

```bash
pnpm install
cp .env.example .env
pnpm check
pnpm test
pnpm dev
```

Confirm the local health endpoint:

```bash
curl http://localhost:3000/health
```

## 4. Expose a public HTTPS endpoint

Telegram webhooks require public HTTPS. For a short local demo, expose port 3000 through a trusted HTTPS tunnel using test credentials. For a more polished demo, deploy the service to a standard HTTPS host. Your public route must be:

```text
https://YOUR_DOMAIN/webhooks/telegram
```

Once you have a public URL, register the webhook. Replace the environment placeholders locally—do not paste a real token into terminal history if you can use an environment variable or a secret-aware deployment console.

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "content-type: application/json" \
  -d "{\"url\":\"${TELEGRAM_WEBHOOK_URL}\",\"secret_token\":\"${TELEGRAM_WEBHOOK_SECRET}\",\"allowed_updates\":[\"message\"]}"
```

Use Telegram’s `getWebhookInfo` endpoint to diagnose a wrong URL, TLS issue, or queue of failed updates. Do not use long polling at the same time as a webhook.

## 5. Demonstrate the two required paths

First, send a normal text message to the bot. The Telegram adapter forwards the text to an ElevenLabs Chat Mode session and receives an Agent response. The service sends that text back and then generates an ElevenLabs voice note.

Second, hold the Telegram microphone button and send a short completed voice note. The service retrieves the media through Telegram `getFile`, sends the completed audio to ElevenLabs Scribe v2, forwards the transcript into the same Agent layer, returns the text answer, and sends an optional voice-note derivative. This is the central product distinction: users can communicate with **text or voice messages**, but the application is not pretending to be a phone call.

## 6. High-volume explanation

Set `HIGH_VOLUME_MODE=true` before a specific demo run if you want to show the product’s honesty rule. The user receives this notice first:

> “We have a high volume of requests, so this is not a real-time conversation. We’ll answer as fast as possible.”

For the interview, explain that the current code demonstrates the product language. A production system calculates this state from durable-queue age and provider capacity, rather than using a permanent manual flag.

## 7. Recovery plan for the interview

If the Agent Chat Mode private session is not configured correctly, show the architecture and code rather than trying to hide the limitation. Verify, in this order: the environment variables, the Agent ID, Chat Mode enabled in the dashboard, the signed-URL endpoint/permission, and Telegram webhook info. A text-only Agent session requires the Agent’s response event, and voice notes depend on a separate successful Scribe/TTS route.

If public ingress is the problem, use a screen recording or terminal demo of `pnpm test` plus the code walkthrough. Do not disable webhook verification or show real secrets to save time.

## Sources

[1]: https://elevenlabs.io/docs/eleven-agents/guides/chat-mode "ElevenLabs Agents — Chat Mode"
[2]: https://elevenlabs.io/docs/eleven-agents/libraries/java-script "ElevenLabs Agents — JavaScript SDK"
[3]: https://elevenlabs.io/docs/overview/capabilities/speech-to-text "ElevenLabs — Speech to Text"
[4]: https://elevenlabs.io/docs/overview/capabilities/text-to-speech "ElevenLabs — Text to Speech"
[5]: https://core.telegram.org/bots/api#setwebhook "Telegram Bot API — setWebhook"
[6]: https://core.telegram.org/bots/api#getwebhookinfo "Telegram Bot API — getWebhookInfo"
