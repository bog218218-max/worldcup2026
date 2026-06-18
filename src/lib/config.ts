export const ENTRY_FEE_RUB = 1000;
export const MATCH_TIMEZONE_OFFSET = process.env.MATCH_TIMEZONE_OFFSET || "+03:00";

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
