import { PrismaClient } from "@prisma/client";
import { calculatePredictionPoints, getResultType } from "../src/lib/scoring";

const prisma = new PrismaClient();

const users = [
  ["900001", "Андрей", "andrey", "🧤", true, true],
  ["900002", "Марина", "marina", "🎯", false, true],
  ["900003", "Илья", "ilya", "🚀", false, true],
  ["900004", "Катя", "katya", "🧠", false, true],
  ["900005", "Дима", "dima", "⚡", false, true],
  ["900006", "Оля", "olya", "🦁", false, true],
  ["900007", "Саша", "sasha", "🧊", false, false],
  ["900008", "Никита", "nikita", "🔥", false, true],
  ["900009", "Лена", "lena", "🏆", false, true],
  ["900010", "Рома", "roma", "🪄", false, false]
] as const;

const matchTemplates = [
  ["Бразилия", "Германия", "🇧🇷", "🇩🇪", -72, "Группа A", "finished", 2, 1],
  ["Аргентина", "Франция", "🇦🇷", "🇫🇷", -48, "Группа B", "finished", 1, 1],
  ["Испания", "Португалия", "🇪🇸", "🇵🇹", -28, "Группа C", "finished", 3, 1],
  ["Англия", "Нидерланды", "🏴", "🇳🇱", -6, "Группа D", "finished", 0, 2],
  ["Италия", "Хорватия", "🇮🇹", "🇭🇷", -0.5, "Группа E", "live", null, null],
  ["Уругвай", "Япония", "🇺🇾", "🇯🇵", 5, "Группа F", "scheduled", null, null],
  ["США", "Мексика", "🇺🇸", "🇲🇽", 24, "Группа G", "scheduled", null, null],
  ["Марокко", "Бельгия", "🇲🇦", "🇧🇪", 42, "Группа H", "scheduled", null, null],
  ["Сенегал", "Дания", "🇸🇳", "🇩🇰", 68, "1/8 финала", "scheduled", null, null],
  ["Швейцария", "Сербия", "🇨🇭", "🇷🇸", 92, "1/8 финала", "scheduled", null, null]
] as const;

const scorePool = [
  [2, 1],
  [1, 1],
  [3, 1],
  [0, 2],
  [1, 0],
  [2, 2],
  [2, 0],
  [1, 2],
  [0, 0],
  [4, 1]
] as const;

async function main() {
  await prisma.$transaction([
    prisma.prediction.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.prizeConfig.deleteMany(),
    prisma.match.deleteMany(),
    prisma.user.deleteMany()
  ]);

  const createdUsers = await Promise.all(
    users.map(([telegramId, displayName, slug, avatarEmoji, isAdmin, isPaid]) =>
      prisma.user.create({
        data: {
          telegramId,
          displayName,
          slug,
          avatarEmoji,
          isAdmin,
          isPaid,
          payment: {
            create: {
              amount: 1000,
              isPaid,
              paidAt: isPaid ? new Date() : null
            }
          }
        }
      })
    )
  );

  const now = Date.now();
  const createdMatches = await Promise.all(
    matchTemplates.map(
      ([homeTeam, awayTeam, homeFlag, awayFlag, offsetHours, stage, status, homeScore, awayScore]) =>
        prisma.match.create({
          data: {
            homeTeam,
            awayTeam,
            homeFlag,
            awayFlag,
            stage,
            status,
            kickoffTime: new Date(now + offsetHours * 60 * 60 * 1000),
            homeScore,
            awayScore
          }
        })
    )
  );

  await prisma.prizeConfig.createMany({
    data: [
      { title: "1 место", type: "rank", percentage: 50 },
      { title: "2 место", type: "rank", percentage: 25 },
      { title: "3 место", type: "rank", percentage: 15 },
      { title: "Больше всего точных счетов", type: "nomination", percentage: 10 }
    ]
  });

  for (const [matchIndex, match] of createdMatches.entries()) {
    const participantsForMatch =
      match.status === "scheduled" && matchIndex > 6
        ? createdUsers.slice(0, 6)
        : createdUsers.slice(0, 8 + (matchIndex % 3));

    for (const [userIndex, user] of participantsForMatch.entries()) {
      const [predHome, predAway] = scorePool[(matchIndex + userIndex) % scorePool.length];
      const hasResult = match.homeScore !== null && match.awayScore !== null;
      const result = hasResult
        ? { homeScore: match.homeScore!, awayScore: match.awayScore! }
        : null;

      await prisma.prediction.create({
        data: {
          userId: user.id,
          matchId: match.id,
          predHome,
          predAway,
          points: calculatePredictionPoints({ predHome, predAway }, result),
          resultType: getResultType({ predHome, predAway }, result),
          lockedAt:
            match.kickoffTime.getTime() - Date.now() <= 60 * 1000
              ? new Date(match.kickoffTime.getTime() - 60 * 1000)
              : null
        }
      });
    }
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
