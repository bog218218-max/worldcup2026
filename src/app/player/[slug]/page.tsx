import { notFound } from "next/navigation";
import { Badge } from "@/components/Badges";
import { StatCard } from "@/components/StatCard";
import { formatKickoff, formatScore, percent } from "@/lib/format";
import { getPlayerStats } from "@/lib/services/players";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = await getPlayerStats(slug);

  if (!player) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--green)]">
          Место #{player.rank}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-5xl font-semibold">
            <span className="mr-3">{player.avatarEmoji}</span>
            {player.displayName}
          </h1>
          <span className="text-5xl font-semibold text-[var(--green)]">{player.points}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {player.badges.length > 0 ? (
            player.badges.map((badge) => <Badge key={badge} value={badge} tone="prize" />)
          ) : (
            <Badge value="бейджи появятся после матчей" />
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Средний балл" value={player.averagePoints.toFixed(2)} tone="gold" />
        <StatCard label="Точные счета" value={player.exact} tone="green" />
        <StatCard label="Точность исходов" value={percent(player.outcomeAccuracy)} tone="cyan" />
        <StatCard label="Серия с очками" value={player.currentPointStreak} />
        <StatCard label="Разницы" value={player.difference} tone="gold" />
        <StatCard label="Исходы" value={player.outcome} tone="cyan" />
        <StatCard label="Промахи" value={player.miss} tone="red" />
        <StatCard label="Точность счёта" value={percent(player.exactAccuracy)} tone="green" />
      </section>

      {player.bestGame ? (
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="text-2xl font-semibold">Лучшая игра</h2>
          <p className="mt-2 text-[var(--muted)]">
            {player.bestGame.homeTeam} vs {player.bestGame.awayTeam}: {player.bestGame.points} очков
          </p>
        </section>
      ) : null}

      <section className="table-scroll rounded-lg border border-[var(--line)] bg-[var(--surface)]">
        <table className="min-w-[860px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              <th className="px-4 py-3">Матч</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Факт</th>
              <th className="px-4 py-3">Прогноз</th>
              <th className="px-4 py-3 text-right">Очки</th>
              <th className="px-4 py-3">Тип</th>
            </tr>
          </thead>
          <tbody>
            {player.history.map((item) => (
              <tr key={item.id} className="border-b border-[var(--line)] last:border-b-0">
                <td className="px-4 py-3 font-medium">
                  {item.homeFlag} {item.homeTeam} vs {item.awayTeam} {item.awayFlag}
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">{formatKickoff(item.kickoffTime)}</td>
                <td className="px-4 py-3">{formatScore(item.homeScore, item.awayScore)}</td>
                <td className="px-4 py-3">{item.predHome}:{item.predAway}</td>
                <td className="px-4 py-3 text-right font-semibold">{item.points}</td>
                <td className="px-4 py-3"><Badge value={item.resultType} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
