import { prisma } from "@/lib/prisma";
import { getPredictionDeadline, isPredictionLocked, isPredictionVisible } from "@/lib/deadline";
import { matchDifficultyLabel } from "@/lib/analytics";

export async function getMatches() {
  const [matches, participantCount] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoffTime: "asc" },
      include: {
        predictions: {
          where: { user: { isPaid: true } },
          select: { id: true }
        }
      }
    }),
    prisma.user.count({ where: { isPaid: true } })
  ]);

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
    deadlineTime: getPredictionDeadline(match.kickoffTime),
    predictionCount: match.predictions.length,
    participantCount,
    predictionOpen: !isPredictionLocked(match.kickoffTime),
    predictionsVisible: isPredictionVisible(match.kickoffTime)
  }));
}

export async function getMatchStats(matchId: string) {
  const [match, participantCount] = await Promise.all([
    prisma.match.findUnique({
      where: { id: matchId },
      include: {
        predictions: {
          where: { user: { isPaid: true } },
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
    }),
    prisma.user.count({ where: { isPaid: true } })
  ]);

  if (!match) return null;

  const predictionsVisible = isPredictionVisible(match.kickoffTime);
  const predictionCount = match.predictions.length;
  const visiblePredictions = predictionsVisible ? match.predictions : [];
  const scored = match.status === "finished"
    ? visiblePredictions.filter((p) => p.resultType !== "pending")
    : [];
  const homeWins = visiblePredictions.filter((p) => p.predHome > p.predAway).length;
  const draws = visiblePredictions.filter((p) => p.predHome === p.predAway).length;
  const awayWins = visiblePredictions.filter((p) => p.predHome < p.predAway).length;
  const averagePoints =
    scored.length > 0
      ? scored.reduce((sum, prediction) => sum + prediction.points, 0) / scored.length
      : 0;
  const playersWithPoints = scored.filter((prediction) => prediction.points > 0).length;
  const predictionGroups = new Map<
    string,
    {
      count: number;
      users: Array<{
        id: string;
        displayName: string;
        slug: string;
        avatarEmoji: string;
        avatarUrl: string | null;
        telegramUsername: string | null;
      }>;
    }
  >();
  const heatmap = new Map<
    string,
    {
      predHome: number;
      predAway: number;
      count: number;
      points: number | null;
      resultType: string | null;
      users: Array<{
        id: string;
        displayName: string;
        slug: string;
        avatarEmoji: string;
        avatarUrl: string | null;
        telegramUsername: string | null;
      }>;
    }
  >();

  for (const prediction of visiblePredictions) {
    const key = `${prediction.predHome}:${prediction.predAway}`;
    const user = {
      id: prediction.user.id,
      displayName: prediction.user.displayName,
      slug: prediction.user.slug,
      avatarEmoji: prediction.user.avatarEmoji,
      avatarUrl: prediction.user.avatarUrl,
      telegramUsername: prediction.user.telegramUsername
    };
    const group = predictionGroups.get(key) ?? { count: 0, users: [] };
    group.count += 1;
    group.users.push(user);
    predictionGroups.set(key, group);

    const heatmapItem = heatmap.get(key) ?? {
      predHome: prediction.predHome,
      predAway: prediction.predAway,
      count: 0,
      points: match.status === "finished" ? prediction.points : null,
      resultType: match.status === "finished" ? prediction.resultType : null,
      users: []
    };
    heatmapItem.count += 1;
    heatmapItem.users.push(user);
    heatmap.set(key, heatmapItem);
  }

  const bestScore = Math.max(...scored.map((p) => p.points), 0);
  const finishedStatsVisible = match.status === "finished" && scored.length > 0;

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
    deadlineTime: getPredictionDeadline(match.kickoffTime),
    predictionCount,
    participantCount,
    predictionOpen: !isPredictionLocked(match.kickoffTime),
    predictionsVisible,
    outcomeDistribution: predictionsVisible ? {
      home: homeWins,
      draw: draws,
      away: awayWins
    } : null,
    popularPredictions: predictionsVisible ? [...predictionGroups.entries()]
      .map(([score, item]) => ({
        score,
        count: item.count,
        users: item.users.sort((a, b) => a.displayName.localeCompare(b.displayName, "ru"))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) : [],
    scoreHeatmap: predictionsVisible ? [...heatmap.values()].sort(
      (a, b) => {
        if (a.points !== null && b.points !== null && a.points !== b.points) {
          return b.points - a.points;
        }
        return a.predHome - b.predHome || a.predAway - b.predAway;
      }
    ) : [],
    averagePoints: finishedStatsVisible ? averagePoints : null,
    playersWithPoints: finishedStatsVisible ? playersWithPoints : null,
    difficulty: finishedStatsVisible ? matchDifficultyLabel(averagePoints) : null,
    bestPredictions: finishedStatsVisible ? scored
      .filter((prediction) => prediction.points === bestScore)
      .map((prediction) => ({
        id: prediction.id,
        user: prediction.user,
        predHome: prediction.predHome,
        predAway: prediction.predAway,
        points: prediction.points,
        resultType: prediction.resultType
      })) : [],
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
