import { describe, expect, it } from "vitest";
import { parseMatchInput } from "@/lib/matchInput";

describe("match input parser", () => {
  it("parses semicolon admin match input with configured default timezone offset", () => {
    const parsed = parseMatchInput("Испания; Германия; 2026-06-18 21:00; Группа A");

    expect(parsed).toMatchObject({
      homeTeam: "Испания",
      awayTeam: "Германия",
      stage: "Группа A",
      homeFlag: "🏳️",
      awayFlag: "🏳️"
    });
    expect(parsed?.kickoffTime.toISOString()).toBe("2026-06-18T18:00:00.000Z");
  });

  it("rejects invalid match input", () => {
    expect(parseMatchInput("Испания; Германия; завтра; Группа A")).toBeNull();
  });
});
