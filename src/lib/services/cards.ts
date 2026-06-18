import { prisma } from "@/lib/prisma";

export interface PlayerCardInfo {
  user: {
    slug: string;
    displayName: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
  };
  stats: {
    ovr: number;
    acc: number;
    exa: number;
    dif: number;
    str: number;
    rsk: number;
    frm: number;
    totalPoints: number;
    averagePoints: number;
    exactCount: number;
    predictionCount: number;
    missCount: number;
    archetype: string;
    archetypeCode: string;
  };
}

export async function getCardsData(): Promise<PlayerCardInfo[]> {
  const users = await prisma.user.findMany({
    where: { isPaid: true },
    include: {
      predictions: {
        include: { match: true },
      },
    },
  });

  const results = users.map((user) => {
    const finishedPredictions = user.predictions.filter(
      (p) => p.match.status === "finished" && p.resultType !== "pending"
    );

    const predictionCount = finishedPredictions.length;
    let totalPoints = 0;
    let exactCount = 0;
    let diffCount = 0;
    let missCount = 0;
    let pointsGreaterThanZeroCount = 0;
    let riskCount = 0;
    let drawsCount = 0;
    let bigScoresCount = 0;

    const sortedPredictions = [...finishedPredictions].sort(
      (a, b) => b.match.kickoffTime.getTime() - a.match.kickoffTime.getTime()
    );

    for (const p of sortedPredictions) {
      totalPoints += p.points;
      if (p.resultType === "exact") exactCount++;
      if (p.resultType === "difference") diffCount++;
      if (p.resultType === "miss") missCount++;
      if (p.points > 0) pointsGreaterThanZeroCount++;

      let isRisk = false;
      if (p.predHome === p.predAway) {
        isRisk = true;
        drawsCount++;
      } else if (p.predHome < p.predAway) {
        isRisk = true;
      } else if (p.predHome + p.predAway >= 4) {
        isRisk = true;
        bigScoresCount++;
      } else if (Math.abs(p.predHome - p.predAway) >= 3) {
        isRisk = true;
      }
      
      if (isRisk) riskCount++;
    }

    const averagePoints = predictionCount > 0 ? totalPoints / predictionCount : 0;
    const exactRate = predictionCount > 0 ? exactCount / predictionCount : 0;
    
    const acc = predictionCount > 0 ? (pointsGreaterThanZeroCount / predictionCount) * 99 : 0;
    const exa = Math.min(99, exactRate * 300);
    const dif = predictionCount > 0 ? ((exactCount + diffCount) / predictionCount) * 99 : 0;
    
    const last5 = sortedPredictions.slice(0, 5);
    const last5Points = last5.reduce((sum, p) => sum + p.points, 0);
    const frm = Math.min(99, (last5Points / 25) * 99);

    let currentStreak = 0;
    for (const p of sortedPredictions) {
      if (p.points > 0) currentStreak++;
      else break;
    }
    const str = Math.min(99, currentStreak * 10);

    const rsk = predictionCount > 0 ? (riskCount / predictionCount) * 99 : 50;

    const avgPointsScore = Math.min(99, (averagePoints / 5) * 99);
    
    let ovr = Math.round(
      0.30 * avgPointsScore +
      0.25 * acc +
      0.20 * exa +
      0.15 * dif +
      0.10 * frm
    );

    let archetype = "Новичок";
    let archetypeCode = "NEW";

    if (predictionCount < 3) {
      archetype = "Новичок";
      archetypeCode = "НОВ";
    } else {
      if (exa > 70 || exactCount >= 2) {
        archetype = "Снайпер";
        archetypeCode = "СНП";
      } else if (drawsCount / predictionCount >= 0.35) {
        archetype = "Король ничьих";
        archetypeCode = "НИЧ";
      } else if (bigScoresCount / predictionCount >= 0.3) {
        archetype = "Любитель разгромов";
        archetypeCode = "ГОЛ";
      } else if (rsk > 60) {
        archetype = "Авантюрист";
        archetypeCode = "РСК";
      } else if (frm >= 80) {
        archetype = "В форме";
        archetypeCode = "ФОР";
      } else if (acc > 50) {
        archetype = "Стабильный";
        archetypeCode = "СТБ";
      } else {
        archetype = "Авантюрист";
        archetypeCode = "РСК";
      }
    }

    return {
      user: {
        slug: user.slug,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        avatarEmoji: user.avatarEmoji,
      },
      stats: {
        ovr: Math.max(0, Math.min(99, ovr)),
        acc: Math.max(0, Math.min(99, Math.round(acc))),
        exa: Math.max(0, Math.min(99, Math.round(exa))),
        dif: Math.max(0, Math.min(99, Math.round(dif))),
        str: Math.max(0, Math.min(99, Math.round(str))),
        rsk: Math.max(0, Math.min(99, Math.round(rsk))),
        frm: Math.max(0, Math.min(99, Math.round(frm))),
        totalPoints,
        averagePoints,
        exactCount,
        predictionCount,
        missCount,
        archetype,
        archetypeCode,
      }
    };
  });

  return results.sort((a, b) => b.stats.ovr - a.stats.ovr);
}
