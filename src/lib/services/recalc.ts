import { prisma } from "@/lib/prisma";
import { calculatePredictionPoints, getResultType } from "@/lib/scoring";

export async function recalculateMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { predictions: true }
  });

  if (!match) {
    throw new Error("Match not found");
  }

  if (match.homeScore === null || match.awayScore === null) {
    await prisma.prediction.updateMany({
      where: { matchId },
      data: { points: 0, resultType: "pending" }
    });
    return;
  }

  const result = {
    homeScore: match.homeScore,
    awayScore: match.awayScore
  };

  await prisma.$transaction(
    match.predictions.map((prediction) =>
      prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          points: calculatePredictionPoints(prediction, result),
          resultType: getResultType(prediction, result)
        }
      })
    )
  );
}

export async function recalculateAll() {
  const matches = await prisma.match.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null }
    },
    select: { id: true }
  });

  for (const match of matches) {
    await recalculateMatch(match.id);
  }

  return matches.length;
}
