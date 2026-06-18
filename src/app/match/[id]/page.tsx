import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badges";
import { StatCard } from "@/components/StatCard";
import { formatKickoff, formatScore } from "@/lib/format";
import { getMatchStats } from "@/lib/services/matches";

export const dynamic = "force-dynamic";

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

  return (
    <div className="space-y-6">
      <section className="panel rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-[var(--cyan)]">
              {match.stage}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              {match.homeFlag} {match.homeTeam} <span className="text-[var(--muted)]">vs</span>{" "}
              {match.awayTeam} {match.awayFlag}
            </h1>
          </div>
          <Badge value={match.status} tone={match.status === "live" ? "live" : undefined} />
        </div>
        <div className="mt-6 grid gap-4 border-t border-[var(--line-soft)] pt-5 sm:grid-cols-3">
          <div>
            <p className="eyebrow">Начало</p>
            <p className="mt-2 text-xl font-semibold">{formatKickoff(match.kickoffTime)}</p>
          </div>
          <div>
            <p className="eyebrow">Счёт</p>
            <p className="mt-2 text-3xl font-black text-[var(--green)]">{formatScore(match.homeScore, match.awayScore)}</p>
          </div>
          <div>
            <p className="eyebrow">Прогнозов</p>
            <p className="mt-2 text-3xl font-black text-[var(--cyan)]">{match.predictionCount}</p>
          </div>
        </div>
      </section>

      {!match.predictionsVisible ? (
        <section className="panel rounded-lg p-6">
          <h2 className="text-2xl font-semibold">Прогнозы скрыты</h2>
          <p className="mt-2 text-[var(--muted)]">
            API и интерфейс не раскрывают чужие прогнозы до начала матча.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Средний балл" value={match.averagePoints.toFixed(2)} tone="gold" />
            <StatCard label="Игроков с очками" value={match.playersWithPoints} tone="green" />
            <StatCard
              label="Исходы"
              value={`${match.outcomeDistribution.home}/${match.outcomeDistribution.draw}/${match.outcomeDistribution.away}`}
              hint="П1 / ничья / П2"
              tone="cyan"
            />
          </section>

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

          <section className="panel table-scroll overflow-hidden rounded-lg">
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
                      {prediction.user.avatarEmoji} {prediction.user.displayName}
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
