import { ENTRY_FEE_RUB } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export async function getPrizeOverview() {
  const [participantsCount, paidParticipantsCount, prizeConfig] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPaid: true } }),
    prisma.prizeConfig.findMany({ orderBy: { createdAt: "asc" } })
  ]);

  const fundByParticipants = participantsCount * ENTRY_FEE_RUB;
  const paidFund = paidParticipantsCount * ENTRY_FEE_RUB;

  return {
    entryFee: ENTRY_FEE_RUB,
    participantsCount,
    paidParticipantsCount,
    fundByParticipants,
    paidFund,
    distribution: prizeConfig.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      percentage: item.percentage,
      fixedAmount: item.fixedAmount,
      amount:
        item.fixedAmount ??
        (item.percentage ? Math.round((fundByParticipants * item.percentage) / 100) : 0)
    }))
  };
}
