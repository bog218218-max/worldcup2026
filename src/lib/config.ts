export const ENTRY_FEE_RUB = 1000;
export const MATCH_TIMEZONE_OFFSET = process.env.MATCH_TIMEZONE_OFFSET || "+03:00";
export const BOT_URL = "https://t.me/worldcup2026_botbot";
export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://144-31-185-83.sslip.io";

export function getAdminTelegramIds() {
  return new Set(
    (process.env.ADMIN_TELEGRAM_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

export function isAdminTelegramId(telegramId: string) {
  return getAdminTelegramIds().has(telegramId);
}
