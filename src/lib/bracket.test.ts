import { describe, expect, it } from "vitest";
import { buildBracketRounds, getBracketStageKey, type BracketSourceMatch } from "@/lib/bracket";

function match(partial: Partial<BracketSourceMatch> = {}): BracketSourceMatch {
  return {
    id: partial.id ?? "match-1",
    homeTeam: partial.homeTeam ?? "Команда A",
    awayTeam: partial.awayTeam ?? "Команда B",
    homeFlag: partial.homeFlag ?? "🏳️",
    awayFlag: partial.awayFlag ?? "🏳️",
    kickoffTime: partial.kickoffTime ?? new Date("2026-07-01T18:00:00.000Z"),
    stage: partial.stage ?? "Round of 16",
    status: partial.status ?? "scheduled",
    homeScore: partial.homeScore ?? null,
    awayScore: partial.awayScore ?? null
  };
}

describe("bracket helpers", () => {
  it("normalizes playoff stages in a safe order", () => {
    expect(getBracketStageKey("Third place")).toBe("third-place");
    expect(getBracketStageKey("Semi-final")).toBe("semi-final");
    expect(getBracketStageKey("Quarter-final")).toBe("quarter-final");
    expect(getBracketStageKey("Round of 16")).toBe("round-of-16");
    expect(getBracketStageKey("Round of 32")).toBe("round-of-32");
    expect(getBracketStageKey("Final")).toBe("final");
    expect(getBracketStageKey("1/16 финала")).toBe("round-of-32");
    expect(getBracketStageKey("1/8 финала")).toBe("round-of-16");
    expect(getBracketStageKey("1/4 финала")).toBe("quarter-final");
    expect(getBracketStageKey("1/2 финала")).toBe("semi-final");
    expect(getBracketStageKey("Группа A")).toBeNull();
  });

  it("keeps a full placeholder skeleton when there are no playoff matches", () => {
    const bracket = buildBracketRounds([]);

    expect(bracket.rounds.map((round) => round.slots.length)).toEqual([16, 8, 4, 2, 1]);
    expect(bracket.rounds.every((round) => round.slots.every((slot) => slot.match === null))).toBe(true);
    expect(bracket.thirdPlaceSlots).toEqual([]);
  });

  it("fills real playoff matches into the matching round and leaves other slots as placeholders", () => {
    const bracket = buildBracketRounds([
      match({ id: "group", stage: "Группа A" }),
      match({ id: "qf-late", stage: "Quarter-final", kickoffTime: new Date("2026-07-04T18:00:00.000Z") }),
      match({ id: "qf-early", stage: "1/4", kickoffTime: new Date("2026-07-03T18:00:00.000Z") }),
      match({ id: "final", stage: "Final" })
    ]);

    const quarterFinal = bracket.rounds.find((round) => round.key === "quarter-final");
    const final = bracket.rounds.find((round) => round.key === "final");

    expect(quarterFinal?.slots).toHaveLength(4);
    expect(quarterFinal?.slots[0].match?.id).toBe("qf-early");
    expect(quarterFinal?.slots[1].match?.id).toBe("qf-late");
    expect(quarterFinal?.slots[2].match).toBeNull();
    expect(final?.slots[0].match?.id).toBe("final");
  });

  it("adds third-place slots only when real third-place matches exist", () => {
    const withoutThirdPlace = buildBracketRounds([match({ stage: "Final" })]);
    const withThirdPlace = buildBracketRounds([
      match({ id: "bronze", stage: "Матч за 3 место" })
    ]);

    expect(withoutThirdPlace.thirdPlaceSlots).toEqual([]);
    expect(withThirdPlace.thirdPlaceSlots).toHaveLength(1);
    expect(withThirdPlace.thirdPlaceSlots[0].match.id).toBe("bronze");
  });
});
