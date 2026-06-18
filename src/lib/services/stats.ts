import { prisma } from "@/lib/prisma";
import { buildCumulativeProgress } from "@/lib/analytics";
import { getLeaderboard } from "@/lib/services/leaderboard";

export async function getTournamentStats() {
  const [leaderboard, predictions, matches] = await Promise.all([
    getLeaderboard(),
    prisma.prediction.findMany({
      where: { user: { isPaid: true } },
      include: {
        match: true,
        user: { select: { id: true, displayName: true, slug: true, avatarEmoji: true, avatarUrl: true, telegramUsername: true } }
      }
    }),
    prisma.match.findMany({
      include: {
        predictions: {
          where: { user: { isPaid: true } }
        }
      },
      orderBy: { kickoffTime: "asc" }
    })
  ]);

  const scored = predictions.filter((prediction) => prediction.resultType !== "pending");
  const totalPoints = scored.reduce((sum, prediction) => sum + prediction.points, 0);
  const byType = {
    exact: scored.filter((prediction) => prediction.resultType === "exact").length,
    difference: scored.filter((prediction) => prediction.resultType === "difference").length,
    outcome: scored.filter((prediction) => prediction.resultType === "outcome").length,
    miss: scored.filter((prediction) => prediction.resultType === "miss").length
  };

  const matchDifficulty = matches
    .filter((match) => match.predictions.some((prediction) => prediction.resultType !== "pending"))
    .map((match) => {
      const matchScored = match.predictions.filter(
        (prediction) => prediction.resultType !== "pending"
      );
      const averagePoints =
        matchScored.reduce((sum, prediction) => sum + prediction.points, 0) /
        matchScored.length;

      return {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        averagePoints,
        playersWithPoints: matchScored.filter((prediction) => prediction.points > 0).length
      };
    })
    .sort((a, b) => b.averagePoints - a.averagePoints);

  const progress = buildCumulativeProgress(leaderboard, matches, predictions);

  return {
    totalPredictions: predictions.length,
    scoredPredictions: scored.length,
    averagePoints: scored.length > 0 ? totalPoints / scored.length : 0,
    ...byType,
    easiestMatch: matchDifficulty[0] ?? null,
    hardestMatch: matchDifficulty.at(-1) ?? null,
    exactRanking: leaderboard
      .slice()
      .sort((a, b) => b.exact - a.exact || b.points - a.points)
      .slice(0, 5),
    averageRanking: leaderboard
      .slice()
      .sort((a, b) => b.averagePoints - a.averagePoints || b.points - a.points)
      .slice(0, 5),
    accuracyRanking: leaderboard
      .slice()
      .sort((a, b) => b.outcomeAccuracy - a.outcomeAccuracy || b.points - a.points)
      .slice(0, 5),
    leaderboard,
    progress
  };
}
