import { MATCH_TIMEZONE_OFFSET } from "@/lib/config";

export type MatchInput = {
  homeTeam: string;
  awayTeam: string;
  kickoffTime: Date;
  stage: string;
  homeFlag: string;
  awayFlag: string;
};

function parseDateTime(input: string) {
  const trimmed = input.trim();
  const isoDate = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?([zZ]|[+-]\d{2}:\d{2})?$/
  );

  if (isoDate) {
    const [, date, time, explicitOffset] = isoDate;
    const offset = explicitOffset?.toUpperCase() === "Z" ? "Z" : explicitOffset || MATCH_TIMEZONE_OFFSET;
    return new Date(`${date}T${time}:00${offset}`);
  }

  const parsed = new Date(trimmed);
  return parsed;
}

export function parseMatchInput(payload: string): MatchInput | null {
  const separator = payload.includes(";") ? ";" : "|";
  const parts = payload.split(separator).map((part) => part.trim());
  const [homeTeam, awayTeam, kickoffRaw, stage, homeFlag = "🏳️", awayFlag = "🏳️"] = parts;
  const kickoffTime = parseDateTime(kickoffRaw ?? "");

  if (!homeTeam || !awayTeam || !stage || Number.isNaN(kickoffTime.getTime())) {
    return null;
  }

  return {
    homeTeam,
    awayTeam,
    kickoffTime,
    stage,
    homeFlag,
    awayFlag
  };
}
