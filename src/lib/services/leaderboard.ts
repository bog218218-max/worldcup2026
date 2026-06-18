import type { PredictionResultType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LeaderboardRow } from "@/lib/types";

function incrementResultType(
  row: Omit<LeaderboardRow, "rank" | "rankDelta">,
  resultType: PredictionResultType
) {
  if (resultType === "exact") row.exact += 1;
  if (resultType === "difference") row.difference += 1;
  if (resultType === "outcome") row.outcome += 1;
  if (resultType === "miss") row.miss += 1;
}

export function sortLeaderboardRows<T extends Omit<LeaderboardRow, "rank" | "rankDelta">>(rows: T[]) {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exact !== a.exact) return b.exact - a.exact;
    if (b.difference !== a.difference) return b.difference - a.difference;
    if (b.outcome !== a.outcome) return b.outcome - a.outcome;
    if (a.miss !== b.miss) return a.miss - b.miss;
    return a.displayName.localeCompare(b.displayName, "ru");
  });
}

export function rankLeaderboardRows<T extends Omit<LeaderboardRow, "rank" | "rankDelta">>(rows: T[]) {
  return sortLeaderboardRows(rows).map((row, index) => ({
    ...row,
    rank: index + 1
  }));
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { displayName: "asc" },
    include: {
      predictions: {
        include: {
          match: true
        }
      }
    }
  });

  const latestMatch = await prisma.match.findFirst({
    where: { status: "finished" },
    orderBy: { kickoffTime: "desc" }
  });
  const latestMatchId = latestMatch?.id;

  const previousRows: Omit<LeaderboardRow, "rank" | "rankDelta">[] = [];

  const rows = users.map((user) => {
    const predictions = user.predictions;
    const scoredPredictions = predictions.filter(
      (prediction) => prediction.resultType !== "pending"
    );
    const row: Omit<LeaderboardRow, "rank"> = {
      userId: user.id,
      displayName: user.displayName,
      slug: user.slug,
      avatarEmoji: user.avatarEmoji,
      avatarUrl: user.avatarUrl,
      telegramUsername: user.telegramUsername,
      isPaid: user.isPaid,
      points: 0,
      predictionsCount: predictions.length,
      exact: 0,
      difference: 0,
      outcome: 0,
      miss: 0,
      averagePoints: 0,
      outcomeAccuracy: 0,
      exactAccuracy: 0,
      pointsRate: 0,
      lastFive: [],
      rankDelta: 0
    };

    const previousRow: Omit<LeaderboardRow, "rank" | "rankDelta"> = {
      ...row
    };

    for (const prediction of scoredPredictions) {
      row.points += prediction.points;
      incrementResultType(row, prediction.resultType);

      if (prediction.matchId !== latestMatchId) {
        previousRow.points += prediction.points;
        incrementResultType(previousRow, prediction.resultType);
      }
    }

    previousRows.push(previousRow);

    row.averagePoints =
      scoredPredictions.length > 0 ? row.points / scoredPredictions.length : 0;
    row.outcomeAccuracy =
      scoredPredictions.length > 0
        ? (row.exact + row.difference + row.outcome) / scoredPredictions.length
        : 0;
    row.exactAccuracy =
      scoredPredictions.length > 0 ? row.exact / scoredPredictions.length : 0;
    row.pointsRate =
      scoredPredictions.length > 0
        ? scoredPredictions.filter((prediction) => prediction.points > 0).length /
          scoredPredictions.length
        : 0;
    row.lastFive = scoredPredictions
      .sort((a, b) => b.match.kickoffTime.getTime() - a.match.kickoffTime.getTime())
      .slice(0, 5)
      .map((prediction) => ({
        matchId: prediction.matchId,
        points: prediction.points,
        resultType: prediction.resultType
      }));

    return row;
  });

  const currentRanked = rankLeaderboardRows(rows);
  const previousRanked = rankLeaderboardRows(previousRows);

  return currentRanked.map((row) => {
    const prev = previousRanked.find((p) => p.userId === row.userId);
    return {
      ...row,
      rankDelta: prev ? prev.rank - row.rank : 0
    };
  });
}
