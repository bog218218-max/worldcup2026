import { getLeaderboard } from "@/lib/services/leaderboard";
import { getMatches } from "@/lib/services/matches";
import { getPrizeOverview } from "@/lib/services/prizes";
import { getTournamentStats } from "@/lib/services/stats";

type MatchSummary = Awaited<ReturnType<typeof getMatches>>[number];

function predictionProgress(match: MatchSummary) {
  if (match.participantCount === 0) {
    return {
      current: 0,
      total: 0,
      percent: 0,
      label: "Участники ещё не добавлены"
    };
  }

  return {
    current: match.predictionCount,
    total: match.participantCount,
    percent: Math.round((match.predictionCount / match.participantCount) * 100),
    label: `Прогноз сделали ${match.predictionCount} из ${match.participantCount}`
  };
}

function withPredictionProgress(match: MatchSummary) {
  return {
    ...match,
    predictionProgress: predictionProgress(match)
  };
}

export async function getHomeDashboard() {
  const [leaderboard, matches, prizes, stats] = await Promise.all([
    getLeaderboard(),
    getMatches(),
    getPrizeOverview(),
    getTournamentStats()
  ]);
  const liveMatch = matches.find((match) => match.status === "live") ?? null;
  const nextMatch =
    liveMatch ??
    matches.find((match) => match.status !== "finished") ??
    null;
  const remainingMatches = matches
    .filter((match) => match.status !== "finished" && match.id !== nextMatch?.id)
    .slice(0, 5)
    .map(withPredictionProgress);
  const playedMatches = matches.filter((match) => match.status === "finished").length;
  const playedPct =
    matches.length > 0 ? Math.round((playedMatches / matches.length) * 100) : 0;
  const exactPct =
    stats.totalPredictions > 0
      ? Math.round((stats.exact / stats.totalPredictions) * 100)
      : 0;

  return {
    leaderboard,
    leaderboardTop: leaderboard.slice(0, 3),
    leader: leaderboard[0] ?? null,
    liveMatch: liveMatch ? withPredictionProgress(liveMatch) : null,
    nextMatch: nextMatch ? withPredictionProgress(nextMatch) : null,
    remainingMatches,
    upcomingMatches: [nextMatch, ...remainingMatches]
      .filter((match): match is NonNullable<typeof match> => Boolean(match))
      .slice(0, 5),
    topMovers: leaderboard
      .filter((row) => row.rankDelta !== null && row.rankDelta !== 0)
      .sort((a, b) => Math.abs(b.rankDelta ?? 0) - Math.abs(a.rankDelta ?? 0))
      .slice(0, 3),
    tournamentPulse: [
      {
        label: "Сыграно",
        value: `${playedMatches} / ${matches.length}`,
        hint: `${playedPct}% турнира`,
        tone: "cyan" as const
      },
      {
        label: "Точные",
        value: stats.exact,
        hint: stats.totalPredictions > 0 ? `${exactPct}% прогнозов` : "нет прогнозов",
        tone: "gold" as const
      },
      {
        label: "Фонд",
        value: prizes.fundByParticipants,
        hint: "фиксированный",
        tone: "green" as const
      }
    ],
    predictionProgress: nextMatch ? predictionProgress(nextMatch) : null,
    playedMatches,
    totalMatches: matches.length,
    prizes,
    stats
  };
}
