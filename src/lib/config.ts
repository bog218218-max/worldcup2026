export const ENTRY_FEE_RUB = 1000;

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
