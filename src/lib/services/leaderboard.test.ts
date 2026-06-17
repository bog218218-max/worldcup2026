import { describe, expect, it } from "vitest";
import { rankLeaderboardRows } from "@/lib/services/leaderboard";
import type { LeaderboardRow } from "@/lib/types";

function row(partial: Partial<Omit<LeaderboardRow, "rank">>) {
  return {
    userId: partial.userId ?? partial.displayName ?? "u",
    displayName: partial.displayName ?? "Player",
    slug: partial.slug ?? "player",
    avatarEmoji: "⚽",
    isPaid: true,
    points: 0,
    predictionsCount: 4,
    exact: 0,
    difference: 0,
    outcome: 0,
    miss: 0,
    averagePoints: 0,
    outcomeAccuracy: 0,
    exactAccuracy: 0,
    pointsRate: 0,
    lastFive: [],
    ...partial
  };
}

describe("leaderboard tie-breakers", () => {
  it("sorts by points, exact, difference, outcome, then fewer misses", () => {
    const ranked = rankLeaderboardRows([
      row({ displayName: "A", points: 10, exact: 1, difference: 3, outcome: 1, miss: 0 }),
      row({ displayName: "B", points: 12, exact: 0, difference: 1, outcome: 4, miss: 0 }),
      row({ displayName: "C", points: 10, exact: 2, difference: 0, outcome: 0, miss: 2 }),
      row({ displayName: "D", points: 10, exact: 1, difference: 3, outcome: 2, miss: 2 }),
      row({ displayName: "E", points: 10, exact: 1, difference: 3, outcome: 2, miss: 1 })
    ]);

    expect(ranked.map((item) => item.displayName)).toEqual(["B", "C", "E", "D", "A"]);
    expect(ranked.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
  });
});
