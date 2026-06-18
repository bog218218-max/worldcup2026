import { prisma } from "@/lib/prisma";
import { getMatchStats } from "@/lib/services/matches";

async function main() {
  const futureMatch = await prisma.match.findFirst({
    where: {
      kickoffTime: { gt: new Date() },
      predictions: { some: {} }
    },
    orderBy: { kickoffTime: "asc" },
    select: { id: true, homeTeam: true, awayTeam: true }
  });

  if (!futureMatch) {
    console.log("No future match with predictions found. Hidden-predictions smoke check skipped.");
    return;
  }

  const stats = await getMatchStats(futureMatch.id);
  if (!stats) {
    throw new Error("Future match disappeared during smoke check.");
  }

  if (stats.predictionsVisible !== false || stats.predictions.length !== 0) {
    throw new Error(
      `Prediction leak detected for ${futureMatch.homeTeam} - ${futureMatch.awayTeam}.`
    );
  }

  console.log(
    `Hidden-predictions smoke check passed for ${futureMatch.homeTeam} - ${futureMatch.awayTeam}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
