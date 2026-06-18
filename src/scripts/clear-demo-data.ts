import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const confirmed =
  process.argv.includes("--confirm") || process.env.CONFIRM_CLEAR_DEMO_DATA === "yes";

async function main() {
  if (!confirmed) {
    console.error(
      [
        "Refusing to clear data without confirmation.",
        "This command irreversibly deletes Prediction, Payment, Match and User rows.",
        "Run only before the real tournament starts, while there are no real predictions.",
        "Use: npm run db:clear-demo -- --confirm"
      ].join("\n")
    );
    process.exit(1);
  }

  const before = await Promise.all([
    prisma.prediction.count(),
    prisma.payment.count(),
    prisma.match.count(),
    prisma.user.count()
  ]);

  await prisma.$transaction([
    prisma.prediction.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.match.deleteMany(),
    prisma.user.deleteMany()
  ]);

  console.log(
    [
      "Demo data cleared.",
      `Deleted predictions: ${before[0]}`,
      `Deleted payments: ${before[1]}`,
      `Deleted matches: ${before[2]}`,
      `Deleted users: ${before[3]}`,
      "PrizeConfig was kept."
    ].join("\n")
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
