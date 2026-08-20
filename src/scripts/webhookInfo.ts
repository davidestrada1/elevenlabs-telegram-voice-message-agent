import {
  callTelegram,
  loadTelegramWebhookConfig,
  redactSensitiveValues
} from "./telegramWebhook.js";

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
}

async function main(): Promise<void> {
  try {
    const config = loadTelegramWebhookConfig();
    const result = await callTelegram<TelegramResponse>(config, "getWebhookInfo");
    const safeResult = redactSensitiveValues(result, [
      config.TELEGRAM_BOT_TOKEN,
      config.TELEGRAM_WEBHOOK_SECRET
    ]);
    console.log(`WEBHOOK_INFO_SUCCESS ${JSON.stringify(safeResult)}`);
  } catch {
    console.error("WEBHOOK_INFO_FAILURE");
    process.exitCode = 1;
  }
}

void main();