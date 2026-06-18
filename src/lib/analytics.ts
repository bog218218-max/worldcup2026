export function matchDifficultyLabel(averagePoints: number) {
  if (averagePoints >= 3) return "лёгкий";
  if (averagePoints >= 1.5) return "средний";
  return "сложный";
}

export function buildCumulativeProgress(
  players: Array<{ displayName: string }>,
  matches: Array<{ id: string; homeTeam: string; awayTeam: string; status: string }>,
  predictions: Array<{
    matchId: string;
    points: number;
    resultType: string;
    user: { displayName: string };
  }>
) {
  const cumulativeByUser = new Map(players.map((player) => [player.displayName, 0]));

  return matches
    .filter((match) => match.status === "finished")
    .map((match) => {
      for (const prediction of predictions.filter(
        (item) => item.matchId === match.id && item.resultType !== "pending"
      )) {
        const current = cumulativeByUser.get(prediction.user.displayName) ?? 0;
        cumulativeByUser.set(prediction.user.displayName, current + prediction.points);
      }

      return {
        match: `${match.homeTeam} - ${match.awayTeam}`,
        ...Object.fromEntries(cumulativeByUser.entries())
      };
    });
}
