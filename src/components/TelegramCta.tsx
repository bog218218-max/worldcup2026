import Link from "next/link";
import { Send } from "lucide-react";
import { BOT_URL } from "@/lib/config";

export function TelegramCta({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href={BOT_URL}
      target="_blank"
      rel="noreferrer"
      className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[oklch(0.72_0.12_225/0.48)] bg-[oklch(0.72_0.12_225/0.12)] px-4 py-2 text-sm font-semibold text-[var(--cyan)] transition-colors hover:bg-[oklch(0.72_0.12_225/0.18)]"
    >
      <Send size={compact ? 16 : 18} aria-hidden="true" />
      <span>{compact ? "Telegram" : "Сделать прогноз в Telegram"}</span>
    </Link>
  );
}
