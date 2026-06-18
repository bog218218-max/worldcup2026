import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { percent } from "@/lib/format";
import { getPlayers } from "@/lib/services/players";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-[var(--gold)]">
          Профили без Telegram ID
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Игроки</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Всего игроков" value={players.length} />
        <StatCard label="Взнос" value="1000 ₽" hint="наличкой вне приложения" tone="green" />
        <StatCard label="Лучший средний" value={players[0]?.averagePoints.toFixed(2) ?? "0.00"} tone="gold" />
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <Link
            key={player.slug}
            href={`/player/${player.slug}`}
            className="focus-ring panel rounded-lg p-4 transition-colors duration-150 hover:border-[oklch(0.74_0.145_148/0.42)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt={player.displayName} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="text-3xl shrink-0">{player.avatarEmoji}</span>
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold leading-tight">{player.displayName}</span>
                  {player.telegramUsername && (
                    <span className="truncate text-xs text-[var(--muted)]">@{player.telegramUsername}</span>
                  )}
                  <span className="text-sm text-[var(--muted)]">место #{player.rank}</span>
                </span>
              </span>
              <span className="text-2xl font-semibold text-[var(--green)]">{player.points}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--line-soft)] pt-4 text-sm text-[var(--muted)]">
              <span>Тч {player.exact}</span>
              <span>Ср {player.averagePoints.toFixed(2)}</span>
              <span>Исх {percent(player.outcomeAccuracy)}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
