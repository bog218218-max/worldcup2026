import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const wc2026Matches = [
  // Группа A (Мексика)
  {
    homeTeam: "Мексика",
    awayTeam: "A2",
    homeFlag: "🇲🇽",
    awayFlag: "🏳️",
    stage: "Группа A",
    kickoffTime: new Date("2026-06-11T20:00:00.000Z"),
  },
  // Группа B (Канада)
  {
    homeTeam: "Канада",
    awayTeam: "B2",
    homeFlag: "🇨🇦",
    awayFlag: "🏳️",
    stage: "Группа B",
    kickoffTime: new Date("2026-06-12T20:00:00.000Z"),
  },
  // Группа D (США)
  {
    homeTeam: "США",
    awayTeam: "D2",
    homeFlag: "🇺🇸",
    awayFlag: "🏳️",
    stage: "Группа D",
    kickoffTime: new Date("2026-06-12T23:00:00.000Z"),
  },
  // Пример других матчей 1-го тура
  {
    homeTeam: "Испания",
    awayTeam: "Германия",
    homeFlag: "🇪🇸",
    awayFlag: "🇩🇪",
    stage: "Группа E",
    kickoffTime: new Date("2026-06-13T19:00:00.000Z"),
  },
  {
    homeTeam: "Бразилия",
    awayTeam: "Франция",
    homeFlag: "🇧🇷",
    awayFlag: "🇫🇷",
    stage: "Группа F",
    kickoffTime: new Date("2026-06-14T22:00:00.000Z"),
  },
  {
    homeTeam: "Аргентина",
    awayTeam: "Португалия",
    homeFlag: "🇦🇷",
    awayFlag: "🇵🇹",
    stage: "Группа G",
    kickoffTime: new Date("2026-06-15T20:00:00.000Z"),
  },
];

async function main() {
  console.log("Очистка старых матчей...");
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();

  console.log("Добавление матчей ЧМ-2026...");
  for (const match of wc2026Matches) {
    await prisma.match.create({
      data: {
        ...match,
        status: "scheduled",
      },
    });
  }

  console.log("Матчи ЧМ-2026 успешно добавлены!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
