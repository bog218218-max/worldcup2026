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
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
          Профили без Telegram ID
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Игроки</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Всего игроков" value={players.length} />
        <StatCard label="Оплачено" value={players.filter((player) => player.isPaid).length} tone="green" />
        <StatCard label="Лучший средний" value={players[0]?.averagePoints.toFixed(2) ?? "0.00"} tone="gold" />
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <Link
            key={player.slug}
            href={`/player/${player.slug}`}
            className="focus-ring rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:bg-[var(--surface-2)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <span className="text-3xl">{player.avatarEmoji}</span>
                <span>
                  <span className="block font-semibold">{player.displayName}</span>
                  <span className="text-sm text-[var(--muted)]">место #{player.rank}</span>
                </span>
              </span>
              <span className="text-2xl font-semibold text-[var(--green)]">{player.points}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-[var(--muted)]">
              <span>Точные: {player.exact}</span>
              <span>Средний: {player.averagePoints.toFixed(2)}</span>
              <span>Исходы: {percent(player.outcomeAccuracy)}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
