import "dotenv/config";

const requiredVariables = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "TELEGRAM_WEBHOOK_URL"] as const;

export type TelegramWebhookConfig = Record<(typeof requiredVariables)[number], string>;

export function loadTelegramWebhookConfig(): TelegramWebhookConfig {
  const values = Object.fromEntries(
    requiredVariables.map((name) => [name, process.env[name]?.trim() ?? ""])
  ) as TelegramWebhookConfig;
  const missing = requiredVariables.filter((name) => !values[name]);

  if (missing.length > 0) {
    throw new Error(`Missing local .env values: ${missing.join(", ")}`);
  }

  try {
    new URL(values.TELEGRAM_WEBHOOK_URL);
  } catch {
    throw new Error("TELEGRAM_WEBHOOK_URL must be a valid URL");
  }

  return values;
}

export function webhookHostname(webhookUrl: string): string {
  return new URL(webhookUrl).hostname;
}

export async function callTelegram<T>(
  config: TelegramWebhookConfig,
  method: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/${method}`, options);
  const result = (await response.json()) as T;
  if (!response.ok) throw new Error("Telegram API request failed");
  return result;
}

export function redactSensitiveValues(value: unknown, secrets: readonly string[]): unknown {
  if (typeof value === "string") {
    return secrets.reduce((redacted, secret) => redacted.replaceAll(secret, "[REDACTED]"), value);
  }
  if (Array.isArray(value)) return value.map((item) => redactSensitiveValues(item, secrets));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /token|secret|password|api.?key|authorization|credential/i.test(key)
          ? "[REDACTED]"
          : redactSensitiveValues(item, secrets)
      ])
    );
  }
  return value;
}