import { describe, expect, it } from "vitest";
import { buildCumulativeProgress, matchDifficultyLabel } from "@/lib/analytics";

describe("analytics helpers", () => {
  it("labels match difficulty by average points", () => {
    expect(matchDifficultyLabel(3)).toBe("лёгкий");
    expect(matchDifficultyLabel(1.5)).toBe("средний");
    expect(matchDifficultyLabel(1.49)).toBe("сложный");
  });

  it("builds cumulative leadership race only from finished scored matches", () => {
    const players = [{ displayName: "Аня" }, { displayName: "Борис" }];
    const matches = [
      { id: "m1", homeTeam: "A", awayTeam: "B", status: "finished" },
      { id: "m2", homeTeam: "C", awayTeam: "D", status: "live" },
      { id: "m3", homeTeam: "E", awayTeam: "F", status: "finished" }
    ];
    const predictions = [
      { matchId: "m1", points: 5, resultType: "exact", user: { displayName: "Аня" } },
      { matchId: "m1", points: 2, resultType: "outcome", user: { displayName: "Борис" } },
      { matchId: "m2", points: 5, resultType: "exact", user: { displayName: "Аня" } },
      { matchId: "m3", points: 0, resultType: "miss", user: { displayName: "Аня" } },
      { matchId: "m3", points: 3, resultType: "difference", user: { displayName: "Борис" } }
    ];

    expect(buildCumulativeProgress(players, matches, predictions)).toEqual([
      { match: "A - B", "Аня": 5, "Борис": 2 },
      { match: "E - F", "Аня": 5, "Борис": 5 }
    ]);
  });
});
