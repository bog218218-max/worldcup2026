import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badges";
import { HitBreakdownChart, PlayerTimelineChart } from "@/components/Charts";
import { StatCard } from "@/components/StatCard";
import { initials } from "@/lib/avatar";
import { formatMskDateTime, formatScore, percent } from "@/lib/format";
import { getPlayerStats } from "@/lib/services/players";

export const revalidate = 15;

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
  const streakText =
    player.currentStreak.type === "points"
      ? `${player.currentStreak.length} с очками`
      : player.currentStreak.type === "miss"
        ? `${player.currentStreak.length} без очков`
        : "нет";

  return (
    <div className="page-shell space-y-6">
      <section className="panel rounded-lg p-5">
        <p className="eyebrow text-[var(--green)]">
          Место #{player.rank}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {player.avatarUrl ? (
              <img src={player.avatarUrl} alt={player.displayName} className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20" />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] text-xl font-black text-[var(--muted)] sm:h-20 sm:w-20 sm:text-2xl">
                {initials(player.displayName)}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-semibold sm:text-5xl">{player.displayName}</h1>
              {player.telegramUsername && (
                <p className="mt-1 text-lg text-[var(--muted)]">@{player.telegramUsername}</p>
              )}
            </div>
          </div>
          <span className="text-4xl font-semibold text-[var(--green)] sm:text-5xl">{player.points}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {player.primaryBadge ? <Badge value={player.primaryBadge} tone="prize" /> : null}
          {player.badges
            .filter((badge) => badge !== player.primaryBadge)
            .map((badge) => <Badge key={badge} value={badge} tone="prize" />)}
          {!player.primaryBadge && player.badges.length === 0 ? (
            <Badge value="бейджи появятся после матчей" />
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Средний балл" value={player.averagePoints.toFixed(2)} tone="gold" />
        <StatCard label="Точные счета" value={player.exact} tone="green" />
        <StatCard label="Точность исходов" value={percent(player.outcomeAccuracy)} tone="cyan" />
        <StatCard label="Текущая серия" value={streakText} />
        <StatCard label="Разницы" value={player.difference} tone="gold" />
        <StatCard label="Исходы" value={player.outcome} tone="cyan" />
        <StatCard label="Промахи" value={player.miss} tone="red" />
        <StatCard label="Точность счёта" value={percent(player.exactAccuracy)} tone="green" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3">
            <p className="eyebrow text-[var(--green)]">Завершённые матчи</p>
            <h2 className="mt-1 text-2xl font-semibold">Динамика очков</h2>
          </div>
          <PlayerTimelineChart data={player.timeline} />
        </div>
        <div>
          <div className="mb-3">
            <p className="eyebrow text-[var(--gold)]">Структура очков</p>
            <h2 className="mt-1 text-2xl font-semibold">Типы попаданий</h2>
          </div>
          <HitBreakdownChart
            data={[
              { name: "Точные", value: player.exact, fill: "var(--green)" },
              { name: "Разницы", value: player.difference, fill: "var(--lime)" },
              { name: "Исходы", value: player.outcome, fill: "var(--gold)" },
              { name: "Промахи", value: player.miss, fill: "var(--red)" }
            ]}
          />
        </div>
      </section>

      <section className="panel rounded-lg p-5">
        <p className="eyebrow">Последние 5 матчей</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {player.lastFive.length > 0 ? (
            player.lastFive.map((item) => (
              <span
                key={item.matchId}
                className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm"
              >
                {item.points} очков, {item.resultType}
              </span>
            ))
          ) : (
            <span className="text-sm text-[var(--muted)]">Нет завершённых матчей.</span>
          )}
        </div>
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

      <section className="panel divide-y divide-[var(--line-soft)] overflow-hidden rounded-lg md:hidden">
        {player.history.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {item.homeFlag} {item.homeTeam} <span className="text-[var(--muted)]">vs</span> {item.awayTeam} {item.awayFlag}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{formatMskDateTime(item.kickoffTime)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-black text-[var(--green)]">{item.points}</p>
                <p className="text-xs text-[var(--muted)]">очков</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">Факт</p>
                <p className="mt-1 font-semibold">{formatScore(item.homeScore, item.awayScore)}</p>
              </div>
              <div className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">Прогноз</p>
                <p className="mt-1 font-semibold">{item.predHome}:{item.predAway}</p>
              </div>
            </div>
            <div className="mt-3">
              <Badge value={item.resultType} />
            </div>
          </div>
        ))}
      </section>

      <section className="panel table-scroll hidden overflow-hidden rounded-lg md:block">
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
                <td className="text-[var(--muted)]">{formatMskDateTime(item.kickoffTime)}</td>
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
