import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badges";
import { StatCard } from "@/components/StatCard";
import { formatMskDateTime, formatScore } from "@/lib/format";
import { getMatchStats } from "@/lib/services/matches";

export const revalidate = 15;

type PredictionUser = {
  id: string;
  displayName: string;
  slug: string;
  avatarEmoji: string;
  avatarUrl: string | null;
  telegramUsername: string | null;
};

function UserPill({ user, isHighlight = false }: { user: PredictionUser; isHighlight?: boolean }) {
  return (
    <Link
      href={`/player/${user.slug}`}
      className={`focus-ring inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold transition-colors ${
        isHighlight 
          ? "border-[oklch(0_0_0/0.15)] bg-[oklch(0_0_0/0.15)] text-[var(--score-ink)] hover:bg-[oklch(0_0_0/0.25)]"
          : "border-[var(--line-soft)] bg-[oklch(0.2_0.04_244/0.72)] text-[var(--text)] hover:bg-[var(--surface-2)]"
      }`}
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
      ) : null}
      <span className="truncate">{user.displayName}</span>
    </Link>
  );
}

function predictionCountLabel(predictionCount: number, participantCount: number) {
  if (participantCount === 0) return "Участники ещё не добавлены";
  return `Прогноз сделали ${predictionCount} из ${participantCount}`;
}

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
              {predictionCountLabel(match.predictionCount, match.participantCount)}
            </p>
          </div>

        </div>
      </section>

      {!match.predictionsVisible ? (
        <section className="panel rounded-lg p-6">
          <h2 className="text-2xl font-semibold">Прогнозы скрыты</h2>
          <p className="mt-2 text-[var(--muted)]">
            API и интерфейс не раскрывают чужие прогнозы до начала матча.
          </p>
          <p className="mt-4 text-lg font-semibold text-[var(--gold)]">
            {predictionCountLabel(match.predictionCount, match.participantCount)}
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
            <h2 className="text-2xl font-semibold">Все прогнозы</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {match.scoreHeatmap.map((item) => {
                let bgStyle = `oklch(0.72 0.21 144 / ${0.08 + (item.count / maxHeatmapCount) * 0.28})`;
                let borderClass = "border-[var(--line-soft)]";
                let textClass = "";
                
                if (item.resultType === "exact") {
                  bgStyle = "oklch(0.72 0.21 144 / 0.3)";
                  borderClass = "border-[oklch(0.72_0.21_144/0.6)]";
                  textClass = "text-[var(--green)]";
                } else if (item.resultType === "difference") {
                  bgStyle = "oklch(0.82 0.18 126 / 0.3)";
                  borderClass = "border-[oklch(0.82_0.18_126/0.6)]";
                  textClass = "text-[var(--lime)]";
                } else if (item.resultType === "outcome") {
                  bgStyle = "oklch(0.82 0.14 84 / 0.3)";
                  borderClass = "border-[oklch(0.82_0.14_84/0.6)]";
                  textClass = "text-[var(--gold)]";
                } else if (item.resultType === "miss") {
                  bgStyle = "oklch(0.67 0.19 28 / 0.3)";
                  borderClass = "border-[oklch(0.67_0.19_28/0.6)]";
                  textClass = "text-[var(--red)]";
                }

                return (
                  <div
                    key={`${item.predHome}:${item.predAway}`}
                    className={`rounded-md border ${borderClass} px-3 py-3 text-center transition-colors`}
                    style={{ backgroundColor: bgStyle }}
                  >
                    <p className={`text-lg font-black ${textClass}`}>
                      {item.predHome}:{item.predAway}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {item.users.map((user) => (
                        <UserPill key={user.id} user={user} />
                      ))}
                    </div>
                  </div>
                );
              })}
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


        </>
      )}
    </div>
  );
}
