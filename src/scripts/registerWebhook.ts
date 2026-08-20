import {
  callTelegram,
  loadTelegramWebhookConfig,
  webhookHostname
} from "./telegramWebhook.js";

interface TelegramResponse {
  ok: boolean;
}

async function main(): Promise<void> {
  let hostname = "unknown";
  try {
    const config = loadTelegramWebhookConfig();
    hostname = webhookHostname(config.TELEGRAM_WEBHOOK_URL);
    const result = await callTelegram<TelegramResponse>(config, "setWebhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: config.TELEGRAM_WEBHOOK_URL,
        secret_token: config.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: ["message"]
      })
    });

    if (!result.ok) throw new Error("Telegram rejected the webhook");
    console.log(`WEBHOOK_REGISTRATION_SUCCESS hostname=${hostname}`);
  } catch {
    console.error(`WEBHOOK_REGISTRATION_FAILURE hostname=${hostname}`);
    process.exitCode = 1;
  }
}

void main();