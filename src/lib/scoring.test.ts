import { describe, expect, it } from "vitest";
import { calculatePredictionPoints, getResultType, parseScoreInput } from "@/lib/scoring";

describe("scoring", () => {
  it("gives 5 points for exact score", () => {
    const prediction = { predHome: 2, predAway: 1 };
    const result = { homeScore: 2, awayScore: 1 };

    expect(getResultType(prediction, result)).toBe("exact");
    expect(calculatePredictionPoints(prediction, result)).toBe(5);
  });

  it("gives 3 points for matched goal difference", () => {
    const prediction = { predHome: 2, predAway: 1 };
    const result = { homeScore: 1, awayScore: 0 };

    expect(getResultType(prediction, result)).toBe("difference");
    expect(calculatePredictionPoints(prediction, result)).toBe(3);
  });

  it("gives 2 points for matched outcome only", () => {
    const prediction = { predHome: 2, predAway: 1 };
    const result = { homeScore: 3, awayScore: 1 };

    expect(getResultType(prediction, result)).toBe("outcome");
    expect(calculatePredictionPoints(prediction, result)).toBe(2);
  });

  it("treats draw difference as 0 when exact score is different", () => {
    const prediction = { predHome: 1, predAway: 1 };
    const result = { homeScore: 0, awayScore: 0 };

    expect(getResultType(prediction, result)).toBe("difference");
    expect(calculatePredictionPoints(prediction, result)).toBe(3);
  });

  it("gives 0 points for missed outcome", () => {
    const prediction = { predHome: 1, predAway: 0 };
    const result = { homeScore: 1, awayScore: 2 };

    expect(getResultType(prediction, result)).toBe("miss");
    expect(calculatePredictionPoints(prediction, result)).toBe(0);
  });

  it("validates score input as non-negative integers", () => {
    expect(parseScoreInput("2:1")).toEqual({ home: 2, away: 1 });
    expect(parseScoreInput(" 10 : 0 ")).toEqual({ home: 10, away: 0 });
    expect(parseScoreInput("-1:0")).toBeNull();
    expect(parseScoreInput("2.5:1")).toBeNull();
  });
});
