export type PredictionScore = {
  predHome: number;
  predAway: number;
};

export type MatchResult = {
  homeScore: number;
  awayScore: number;
};

export type ResultType = "pending" | "exact" | "difference" | "outcome" | "miss";

function outcome(home: number, away: number) {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function getResultType(
  prediction: PredictionScore,
  matchResult: MatchResult | null | undefined
): ResultType {
  if (!matchResult) return "pending";

  const exact =
    prediction.predHome === matchResult.homeScore &&
    prediction.predAway === matchResult.awayScore;
  if (exact) return "exact";

  const predictedDifference = prediction.predHome - prediction.predAway;
  const actualDifference = matchResult.homeScore - matchResult.awayScore;
  if (predictedDifference === actualDifference) return "difference";

  if (
    outcome(prediction.predHome, prediction.predAway) ===
    outcome(matchResult.homeScore, matchResult.awayScore)
  ) {
    return "outcome";
  }

  return "miss";
}

export function calculatePredictionPoints(
  prediction: PredictionScore,
  matchResult: MatchResult | null | undefined
) {
  const resultType = getResultType(prediction, matchResult);

  switch (resultType) {
    case "exact":
      return 5;
    case "difference":
      return 3;
    case "outcome":
      return 2;
    default:
      return 0;
  }
}

export function parseScoreInput(input: string) {
  const match = input.trim().match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
  if (!match) return null;

  return {
    home: Number(match[1]),
    away: Number(match[2])
  };
}
