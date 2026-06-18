import { prisma } from "@/lib/prisma";
import { isPredictionVisible } from "@/lib/deadline";

export async function getMatches() {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffTime: "asc" },
    include: {
      _count: {
        select: { predictions: true }
      }
    }
  });

  return matches.map((match) => ({
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeFlag: match.homeFlag,
    awayFlag: match.awayFlag,
    kickoffTime: match.kickoffTime,
    stage: match.stage,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    predictionCount: match._count.predictions,
    predictionsVisible: isPredictionVisible(match.kickoffTime)
  }));
}

export async function getMatchStats(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      predictions: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              avatarEmoji: true,
              avatarUrl: true,
              telegramUsername: true,
              isPaid: true
            }
          }
        },
        orderBy: [{ points: "desc" }, { updatedAt: "asc" }]
      }
    }
  });

  if (!match) return null;

  const predictionsVisible = isPredictionVisible(match.kickoffTime);
  const predictionCount = match.predictions.length;
  const visiblePredictions = predictionsVisible ? match.predictions : [];
  const homeWins = visiblePredictions.filter((p) => p.predHome > p.predAway).length;
  const draws = visiblePredictions.filter((p) => p.predHome === p.predAway).length;
  const awayWins = visiblePredictions.filter((p) => p.predHome < p.predAway).length;
  const scored = visiblePredictions.filter((p) => p.resultType !== "pending");
  const averagePoints =
    scored.length > 0
      ? scored.reduce((sum, prediction) => sum + prediction.points, 0) / scored.length
      : 0;
  const playersWithPoints = scored.filter((prediction) => prediction.points > 0).length;
  const predictionGroups = new Map<string, number>();

  for (const prediction of visiblePredictions) {
    const key = `${prediction.predHome}:${prediction.predAway}`;
    predictionGroups.set(key, (predictionGroups.get(key) ?? 0) + 1);
  }

  return {
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeFlag: match.homeFlag,
    awayFlag: match.awayFlag,
    kickoffTime: match.kickoffTime,
    stage: match.stage,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    predictionCount,
    predictionsVisible,
    outcomeDistribution: {
      home: homeWins,
      draw: draws,
      away: awayWins
    },
    popularPredictions: [...predictionGroups.entries()]
      .map(([score, count]) => ({ score, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    averagePoints,
    playersWithPoints,
    bestPredictions: visiblePredictions
      .filter((prediction) => prediction.points === Math.max(...scored.map((p) => p.points), 0))
      .map((prediction) => ({
        id: prediction.id,
        user: prediction.user,
        predHome: prediction.predHome,
        predAway: prediction.predAway,
        points: prediction.points,
        resultType: prediction.resultType
      })),
    predictions: visiblePredictions.map((prediction) => ({
      id: prediction.id,
      user: prediction.user,
      predHome: prediction.predHome,
      predAway: prediction.predAway,
      points: prediction.points,
      resultType: prediction.resultType,
      updatedAt: prediction.updatedAt
    }))
  };
}
