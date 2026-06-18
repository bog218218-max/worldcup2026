import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badges";
import { StatCard } from "@/components/StatCard";
import { formatKickoff, formatScore, percent } from "@/lib/format";
import { getPlayerStats } from "@/lib/services/players";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayerStats(slug);
  if (!player) return {};
  
  const title = `${player.displayName} - Forecast Cup 26`;
  const description = `Профиль участника: ${player.points} очков, ${player.exact} точных счетов`;
  
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = await getPlayerStats(slug);

  if (!player) notFound();

  return (
    <div className="space-y-6">
      <section className="panel rounded-lg p-5">
        <p className="eyebrow text-[var(--green)]">
          Место #{player.rank}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            {player.avatarUrl ? (
              <img src={player.avatarUrl} alt={player.displayName} className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20" />
            ) : (
              <span className="text-5xl sm:text-6xl">{player.avatarEmoji}</span>
            )}
            <div>
              <h1 className="text-4xl font-semibold sm:text-5xl">{player.displayName}</h1>
              {player.telegramUsername && (
                <p className="mt-1 text-lg text-[var(--muted)]">@{player.telegramUsername}</p>
              )}
            </div>
          </div>
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
        <section className="panel rounded-lg p-5">
          <p className="eyebrow">Пик формы</p>
          <h2 className="text-2xl font-semibold">Лучшая игра</h2>
          <p className="mt-2 text-[var(--muted)]">
            {player.bestGame.homeTeam} vs {player.bestGame.awayTeam}: {player.bestGame.points} очков
          </p>
        </section>
      ) : null}

      <section className="panel table-scroll overflow-hidden rounded-lg">
        <table className="data-table min-w-[860px]">
          <thead>
            <tr>
              <th>Матч</th>
              <th>Дата</th>
              <th>Факт</th>
              <th>Прогноз</th>
              <th className="text-right">Очки</th>
              <th>Тип</th>
            </tr>
          </thead>
          <tbody>
            {player.history.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">
                  {item.homeFlag} {item.homeTeam} vs {item.awayTeam} {item.awayFlag}
                </td>
                <td className="text-[var(--muted)]">{formatKickoff(item.kickoffTime)}</td>
                <td>{formatScore(item.homeScore, item.awayScore)}</td>
                <td>{item.predHome}:{item.predAway}</td>
                <td className="text-right font-semibold">{item.points}</td>
                <td><Badge value={item.resultType} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
