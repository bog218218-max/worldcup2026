import { describe, expect, it } from "vitest";
import { parseParticipantInput, parseParticipantLines } from "@/lib/participantInput";

describe("participant input parser", () => {
  it("parses one participant", () => {
    expect(parseParticipantInput("123456789; Костя")).toEqual({
      telegramId: "123456789",
      displayName: "Костя"
    });
  });

  it("parses bulk participant lines", () => {
    expect(parseParticipantLines("123; Костя\n456; Артём")).toEqual({
      errorLine: null,
      participants: [
        { telegramId: "123", displayName: "Костя" },
        { telegramId: "456", displayName: "Артём" }
      ]
    });
  });

  it("returns a 1-based invalid line number and no participants", () => {
    expect(parseParticipantLines("123; Костя\nbad line\n456; Артём")).toEqual({
      errorLine: 2,
      participants: []
    });
  });
});
