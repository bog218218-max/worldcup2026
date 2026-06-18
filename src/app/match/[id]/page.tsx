import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badges";
import { StatCard } from "@/components/StatCard";
import { formatMskDateTime, formatScore } from "@/lib/format";
import { getMatchStats } from "@/lib/services/matches";

export const revalidate = 15;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatchStats(id);
  if (!match) return {};

  const title = `${match.homeTeam} vs ${match.awayTeam} - Forecast Cup 26`;
  const description = match.status === "finished" 
    ? `Матч завершен со счетом ${match.homeScore}:${match.awayScore}`
    : `Прогнозы на матч ${match.stage}`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchStats(id);

  if (!match) notFound();
  const maxHeatmapCount = Math.max(...match.scoreHeatmap.map((item) => item.count), 1);
  const hasFinishedStats = match.averagePoints !== null && match.playersWithPoints !== null;
  const averagePoints = match.averagePoints ?? 0;
  const playersWithPoints = match.playersWithPoints ?? 0;

  return (
    <div className="page-shell space-y-6">
      <section className="panel rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-[var(--cyan)]">
              {match.stage}
            </p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-4xl">
              {match.homeFlag} {match.homeTeam} <span className="text-[var(--muted)]">vs</span>{" "}
              {match.awayTeam} {match.awayFlag}
            </h1>
          </div>
          <Badge value={match.status} tone={match.status === "live" ? "live" : undefined} />
        </div>
        <div className="mt-6 grid gap-4 border-t border-[var(--line-soft)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="eyebrow">ID матча</p>
            <p className="mt-2 break-all font-mono text-sm text-[var(--text)]">{match.id}</p>
          </div>
          <div>
            <p className="eyebrow">Kickoff</p>
            <p className="mt-2 text-xl font-semibold">{formatMskDateTime(match.kickoffTime)}</p>
          </div>
          <div>
            <p className="eyebrow">Deadline</p>
            <p className="mt-2 text-xl font-semibold">{formatMskDateTime(match.deadlineTime)}</p>
          </div>
          <div>
            <p className="eyebrow">Счёт</p>
            <p className="mt-2 text-3xl font-black text-[var(--green)]">{formatScore(match.homeScore, match.awayScore)}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] p-3">
          <div>
            <p className="eyebrow">Прогнозов</p>
            <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
              Сделали {match.predictionCount} из {match.participantCount}
            </p>
          </div>
          <code className="break-all rounded bg-[var(--bg-2)] px-3 py-2 text-sm font-semibold text-[var(--cyan)]">
            /predict {match.id} 2:1
          </code>
        </div>
      </section>

      {!match.predictionsVisible ? (
        <section className="panel rounded-lg p-6">
          <h2 className="text-2xl font-semibold">Прогнозы скрыты</h2>
          <p className="mt-2 text-[var(--muted)]">
            API и интерфейс не раскрывают чужие прогнозы до начала матча.
          </p>
          <p className="mt-4 text-lg font-semibold text-[var(--gold)]">
            Прогноз сделали {match.predictionCount} из {match.participantCount}
          </p>
        </section>
      ) : (
        <>
          {match.outcomeDistribution ? (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <StatCard
                label="Исходы"
                value={`${match.outcomeDistribution.home}/${match.outcomeDistribution.draw}/${match.outcomeDistribution.away}`}
                hint="П1 / ничья / П2"
                tone="cyan"
              />
              <StatCard label="Прогнозов раскрыто" value={match.predictions.length} />
              <StatCard label="Участников" value={match.participantCount} tone="gold" />
            </section>
          ) : null}

          {hasFinishedStats ? (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <StatCard label="Средний балл" value={averagePoints.toFixed(2)} tone="gold" />
              <StatCard label="Игроков с очками" value={playersWithPoints} tone="green" />
              <StatCard label="Сложность" value={match.difficulty ?? "нет"} tone="cyan" />
              <StatCard label="Лучший балл" value={match.bestPredictions[0]?.points ?? 0} tone="green" />
            </section>
          ) : null}

          <section className="panel rounded-lg p-5">
            <h2 className="text-2xl font-semibold">Популярные прогнозы</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {match.popularPredictions.map((item) => (
                <span key={item.score} className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                  {item.score}: {item.count}
                </span>
              ))}
            </div>
          </section>

          <section className="panel rounded-lg p-5">
            <h2 className="text-2xl font-semibold">Heatmap прогнозов</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {match.scoreHeatmap.map((item) => (
                <div
                  key={`${item.predHome}:${item.predAway}`}
                  className="rounded-md border border-[var(--line-soft)] px-3 py-3 text-center"
                  style={{
                    backgroundColor: `oklch(0.73 0.16 142 / ${0.08 + (item.count / maxHeatmapCount) * 0.28})`
                  }}
                >
                  <p className="text-lg font-black">{item.predHome}:{item.predAway}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.count} прогнозов</p>
                </div>
              ))}
            </div>
          </section>

          {hasFinishedStats && match.bestPredictions.length > 0 ? (
            <section className="panel rounded-lg p-5">
              <h2 className="text-2xl font-semibold">Лучший прогноз матча</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {match.bestPredictions.map((prediction) => (
                  <span key={prediction.id} className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                    {prediction.user.displayName}: {prediction.predHome}:{prediction.predAway}, {prediction.points} очков
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel divide-y divide-[var(--line-soft)] overflow-hidden rounded-lg md:hidden">
            {match.predictions.map((prediction) => (
              <div key={prediction.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {prediction.user.avatarUrl ? (
                      <img src={prediction.user.avatarUrl} alt={prediction.user.displayName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="shrink-0 text-2xl">{prediction.user.avatarEmoji}</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{prediction.user.displayName}</p>
                      {prediction.user.telegramUsername && (
                        <p className="truncate text-xs text-[var(--muted)]">@{prediction.user.telegramUsername}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black text-[var(--green)]">{prediction.points}</p>
                    <p className="text-xs text-[var(--muted)]">очков</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="rounded-md border border-[var(--line-soft)] bg-[var(--score)] px-3 py-2 text-lg font-black text-[var(--score-ink)]">
                    {prediction.predHome}:{prediction.predAway}
                  </span>
                  <Badge value={prediction.resultType} />
                </div>
              </div>
            ))}
          </section>

          <section className="panel table-scroll hidden overflow-hidden rounded-lg md:block">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Игрок</th>
                  <th>Прогноз</th>
                  <th className="text-right">Очки</th>
                  <th>Тип</th>
                </tr>
              </thead>
              <tbody>
                {match.predictions.map((prediction) => (
                  <tr key={prediction.id}>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        {prediction.user.avatarUrl ? (
                          <img src={prediction.user.avatarUrl} alt={prediction.user.displayName} className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <span className="text-lg">{prediction.user.avatarEmoji}</span>
                        )}
                        <div className="flex flex-col">
                          <span>{prediction.user.displayName}</span>
                          {prediction.user.telegramUsername && (
                            <span className="text-xs text-[var(--muted)] font-normal">@{prediction.user.telegramUsername}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{prediction.predHome}:{prediction.predAway}</td>
                    <td className="text-right font-semibold">{prediction.points}</td>
                    <td><Badge value={prediction.resultType} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
