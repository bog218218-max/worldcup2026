import { prisma } from "@/lib/prisma";
import { isPredictionVisible } from "@/lib/deadline";
import { getLeaderboard } from "@/lib/services/leaderboard";

export async function getPlayers() {
  const leaderboard = await getLeaderboard();

  return leaderboard.map((row) => ({
    rank: row.rank,
    displayName: row.displayName,
    slug: row.slug,
    avatarEmoji: row.avatarEmoji,
    avatarUrl: row.avatarUrl,
    telegramUsername: row.telegramUsername,
    isPaid: row.isPaid,
    points: row.points,
    exact: row.exact,
    averagePoints: row.averagePoints,
    outcomeAccuracy: row.outcomeAccuracy
  }));
}

function calculateCurrentPointStreak(
  predictions: Array<{ points: number; match: { kickoffTime: Date } }>
) {
  const sorted = [...predictions].sort(
    (a, b) => b.match.kickoffTime.getTime() - a.match.kickoffTime.getTime()
  );
  let streak = 0;

  for (const prediction of sorted) {
    if (prediction.points <= 0) break;
    streak += 1;
  }

  return streak;
}

function calculateCurrentStreak(
  predictions: Array<{ points: number; match: { kickoffTime: Date } }>
) {
  const sorted = [...predictions].sort(
    (a, b) => b.match.kickoffTime.getTime() - a.match.kickoffTime.getTime()
  );
  if (sorted.length === 0) return { type: "none" as const, length: 0 };

  const type = sorted[0].points > 0 ? "points" : "miss";
  let length = 0;

  for (const prediction of sorted) {
    if (type === "points" && prediction.points <= 0) break;
    if (type === "miss" && prediction.points > 0) break;
    length += 1;
  }

  return { type, length };
}

function badgeNames(player: {
  exact: number;
  exactAccuracy: number;
  pointsRate: number;
  miss: number;
  predictions: Array<{ predHome: number; predAway: number; points: number }>;
}) {
  const badges: string[] = [];
  const total = player.predictions.length || 1;
  const drawRate =
    player.predictions.filter((prediction) => prediction.predHome === prediction.predAway)
      .length / total;
  const bigScoreRate =
    player.predictions.filter((prediction) => prediction.predHome + prediction.predAway >= 5)
      .length / total;

  if (player.exact >= 2 || player.exactAccuracy >= 0.25) badges.push("Снайпер");
  if (player.pointsRate >= 0.7) badges.push("Стабильный");
  if (drawRate >= 0.35) badges.push("Король ничьих");
  if (bigScoreRate >= 0.3) badges.push("Любитель разгромов");
  if (player.miss >= 3) badges.push("Авантюрист");
  if (player.miss >= 2 && player.pointsRate < 0.45) badges.push("Невезучий");

  return badges;
}

export async function getPlayerStats(slug: string) {
  const [leaderboard, user] = await Promise.all([
    getLeaderboard(),
    prisma.user.findUnique({
      where: { slug },
      include: {
        predictions: {
          include: { match: true },
          orderBy: { updatedAt: "desc" }
        }
      }
    })
  ]);

  if (!user?.isPaid) return null;

  const row = leaderboard.find((item) => item.userId === user.id);
  const visiblePredictions = user.predictions.filter((prediction) =>
    isPredictionVisible(prediction.match.kickoffTime)
  );
  const scored = visiblePredictions.filter(
    (prediction) =>
      prediction.match.status === "finished" && prediction.resultType !== "pending"
  );
  const bestGame = scored
    .slice()
    .sort((a, b) => b.points - a.points || a.match.kickoffTime.getTime() - b.match.kickoffTime.getTime())[0];

  if (!row) return null;

  return {
    ...row,
    badges: badgeNames({ ...row, predictions: visiblePredictions }),
    primaryBadge: badgeNames({ ...row, predictions: visiblePredictions })[0] ?? null,
    currentPointStreak: calculateCurrentPointStreak(scored),
    currentStreak: calculateCurrentStreak(scored),
    bestGame: bestGame
      ? {
          matchId: bestGame.matchId,
          homeTeam: bestGame.match.homeTeam,
          awayTeam: bestGame.match.awayTeam,
          points: bestGame.points,
          resultType: bestGame.resultType
      }
      : null,
    timeline: scored
      .slice()
      .sort((a, b) => a.match.kickoffTime.getTime() - b.match.kickoffTime.getTime())
      .reduce<Array<{
        match: string;
        matchId: string;
        points: number;
        cumulativePoints: number;
      }>>((items, prediction) => {
        const previous = items.at(-1)?.cumulativePoints ?? 0;
        items.push({
          match: `${prediction.match.homeTeam} - ${prediction.match.awayTeam}`,
          matchId: prediction.matchId,
          points: prediction.points,
          cumulativePoints: previous + prediction.points
        });
        return items;
      }, []),
    history: visiblePredictions.map((prediction) => ({
      id: prediction.id,
      matchId: prediction.matchId,
      homeTeam: prediction.match.homeTeam,
      awayTeam: prediction.match.awayTeam,
      homeFlag: prediction.match.homeFlag,
      awayFlag: prediction.match.awayFlag,
      kickoffTime: prediction.match.kickoffTime,
      status: prediction.match.status,
      homeScore: prediction.match.homeScore,
      awayScore: prediction.match.awayScore,
      predHome: prediction.predHome,
      predAway: prediction.predAway,
      points: prediction.points,
      resultType: prediction.resultType
    }))
  };
}
