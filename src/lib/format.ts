export function formatScore(home: number | null | undefined, away: number | null | undefined) {
  if (home === null || home === undefined || away === null || away === undefined) {
    return "vs";
  }

  return `${home}:${away}`;
}

export function formatKickoff(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatMskDateTime(date: Date) {
  return `${new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  }).format(date)} МСК`;
}

export function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(amount);
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
