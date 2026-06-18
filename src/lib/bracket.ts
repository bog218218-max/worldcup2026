import { getPredictionDeadline } from "@/lib/deadline";
import { prisma } from "@/lib/prisma";

export type BracketRoundKey =
  | "round-of-32"
  | "round-of-16"
  | "quarter-final"
  | "semi-final"
  | "final";

export type BracketStageKey = BracketRoundKey | "third-place";

export type BracketSourceMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  kickoffTime: Date;
  stage: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
};

export type BracketMatch = BracketSourceMatch & {
  deadlineTime: Date;
};

export type BracketSlot = {
  slot: number;
  match: BracketMatch | null;
};

export type BracketRound = {
  key: BracketRoundKey;
  label: string;
  shortLabel: string;
  placeholderSlots: number;
  slots: BracketSlot[];
};

export const BRACKET_ROUNDS: Array<Omit<BracketRound, "slots">> = [
  { key: "round-of-32", label: "1/16 финала", shortLabel: "1/16", placeholderSlots: 16 },
  { key: "round-of-16", label: "1/8 финала", shortLabel: "1/8", placeholderSlots: 8 },
  { key: "quarter-final", label: "1/4 финала", shortLabel: "1/4", placeholderSlots: 4 },
  { key: "semi-final", label: "1/2 финала", shortLabel: "1/2", placeholderSlots: 2 },
  { key: "final", label: "Финал", shortLabel: "Финал", placeholderSlots: 1 }
];

function normalizeStageText(stage: string) {
  return stage
    .trim()
    .toLocaleLowerCase("ru")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");
}

export function getBracketStageKey(stage: string): BracketStageKey | null {
  const text = normalizeStageText(stage);

  if (
    /\b(third|3rd)\s*-?\s*place\b/.test(text) ||
    /матч\s+за\s+(3|третье)\s+место/.test(text) ||
    /за\s+бронзу/.test(text)
  ) {
    return "third-place";
  }

  if (/\bsemi\s*-?\s*finals?\b/.test(text) || /полуфинал/.test(text) || /1\s*\/\s*2/.test(text)) {
    return "semi-final";
  }

  if (/\bquarter\s*-?\s*finals?\b/.test(text) || /четвертьфинал/.test(text) || /1\s*\/\s*4/.test(text)) {
    return "quarter-final";
  }

  if (/\bround\s+of\s+16\b/.test(text) || /\bro16\b/.test(text) || /1\s*\/\s*8/.test(text)) {
    return "round-of-16";
  }

  if (/\bround\s+of\s+32\b/.test(text) || /\bro32\b/.test(text) || /1\s*\/\s*16/.test(text)) {
    return "round-of-32";
  }

  if (/^(the\s+)?finals?$/.test(text) || /^финал$/.test(text) || /^финальный матч$/.test(text)) {
    return "final";
  }

  return null;
}

function sortMatches(matches: BracketMatch[]) {
  return [...matches].sort((a, b) => {
    const kickoffDelta = a.kickoffTime.getTime() - b.kickoffTime.getTime();
    if (kickoffDelta !== 0) return kickoffDelta;
    return a.id.localeCompare(b.id);
  });
}

export function buildBracketRounds(sourceMatches: BracketSourceMatch[]) {
  const matchesByStage = new Map<BracketStageKey, BracketMatch[]>();

  for (const match of sourceMatches) {
    const stageKey = getBracketStageKey(match.stage);
    if (!stageKey) continue;

    const matches = matchesByStage.get(stageKey) ?? [];
    matches.push({
      ...match,
      deadlineTime: getPredictionDeadline(match.kickoffTime)
    });
    matchesByStage.set(stageKey, matches);
  }

  const rounds = BRACKET_ROUNDS.map((round) => {
    const matches = sortMatches(matchesByStage.get(round.key) ?? []);
    const slotCount = Math.max(round.placeholderSlots, matches.length);

    return {
      ...round,
      slots: Array.from({ length: slotCount }, (_, index) => ({
        slot: index + 1,
        match: matches[index] ?? null
      }))
    };
  });

  const thirdPlaceMatches = sortMatches(matchesByStage.get("third-place") ?? []);

  return {
    rounds,
    thirdPlaceSlots: thirdPlaceMatches.map((match, index) => ({
      slot: index + 1,
      match
    }))
  };
}

export async function getPlayoffBracket() {
  const matches = await prisma.match.findMany({
    orderBy: [{ kickoffTime: "asc" }, { id: "asc" }],
    select: {
      id: true,
      homeTeam: true,
      awayTeam: true,
      homeFlag: true,
      awayFlag: true,
      kickoffTime: true,
      stage: true,
      status: true,
      homeScore: true,
      awayScore: true
    }
  });

  return buildBracketRounds(matches);
}
