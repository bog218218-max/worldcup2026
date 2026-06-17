import { describe, expect, it } from "vitest";
import { getPredictionDeadline, isPredictionLocked, isPredictionVisible } from "@/lib/deadline";

describe("prediction deadline", () => {
  const kickoff = new Date("2026-06-18T18:00:00.000Z");

  it("sets deadline one minute before kickoff", () => {
    expect(getPredictionDeadline(kickoff).toISOString()).toBe("2026-06-18T17:59:00.000Z");
  });

  it("allows edits before the deadline", () => {
    expect(isPredictionLocked(kickoff, new Date("2026-06-18T17:58:59.999Z"))).toBe(false);
  });

  it("locks edits at the deadline", () => {
    expect(isPredictionLocked(kickoff, new Date("2026-06-18T17:59:00.000Z"))).toBe(true);
  });

  it("reveals predictions only from kickoff", () => {
    expect(isPredictionVisible(kickoff, new Date("2026-06-18T17:59:59.999Z"))).toBe(false);
    expect(isPredictionVisible(kickoff, new Date("2026-06-18T18:00:00.000Z"))).toBe(true);
  });
});
