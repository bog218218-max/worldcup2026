import { notFound } from "next/navigation";
import { Badge } from "@/components/Badges";
import { StatCard } from "@/components/StatCard";
import { formatKickoff, formatScore } from "@/lib/format";
import { getMatchStats } from "@/lib/services/matches";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchStats(id);

  if (!match) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--cyan)]">
              {match.stage}
            </p>
            <h1 className="mt-3 text-4xl font-semibold">
              {match.homeFlag} {match.homeTeam} <span className="text-[var(--muted)]">vs</span>{" "}
              {match.awayTeam} {match.awayFlag}
            </h1>
          </div>
          <Badge value={match.status} tone={match.status === "live" ? "live" : undefined} />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Начало" value={formatKickoff(match.kickoffTime)} />
          <StatCard label="Счёт" value={formatScore(match.homeScore, match.awayScore)} tone="green" />
          <StatCard label="Прогнозов" value={match.predictionCount} tone="cyan" />
        </div>
      </section>

      {!match.predictionsVisible ? (
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6">
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

          <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
            <h2 className="text-2xl font-semibold">Популярные прогнозы</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {match.popularPredictions.map((item) => (
                <span key={item.score} className="rounded-md bg-[var(--surface-2)] px-3 py-2 text-sm">
                  {item.score}: {item.count}
                </span>
              ))}
            </div>
          </section>

          <section className="table-scroll rounded-lg border border-[var(--line)] bg-[var(--surface)]">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-4 py-3">Игрок</th>
                  <th className="px-4 py-3">Прогноз</th>
                  <th className="px-4 py-3 text-right">Очки</th>
                  <th className="px-4 py-3">Тип</th>
                </tr>
              </thead>
              <tbody>
                {match.predictions.map((prediction) => (
                  <tr key={prediction.id} className="border-b border-[var(--line)] last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      {prediction.user.avatarEmoji} {prediction.user.displayName}
                    </td>
                    <td className="px-4 py-3">{prediction.predHome}:{prediction.predAway}</td>
                    <td className="px-4 py-3 text-right font-semibold">{prediction.points}</td>
                    <td className="px-4 py-3"><Badge value={prediction.resultType} /></td>
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
