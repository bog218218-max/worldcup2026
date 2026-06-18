export type ParticipantInput = {
  telegramId: string;
  displayName: string;
};

export function parseParticipantInput(payload: string): ParticipantInput | null {
  const [telegramId, displayName = ""] = payload
    .split(";")
    .map((part) => part.trim());

  if (!/^\d+$/.test(telegramId) || displayName.length < 2) return null;

  return {
    telegramId,
    displayName: displayName.slice(0, 40)
  };
}

export function parseParticipantLines(payload: string) {
  const lines = payload
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { errorLine: 1, participants: [] as ParticipantInput[] };
  }

  const participants: ParticipantInput[] = [];
  for (const [index, line] of lines.entries()) {
    const participant = parseParticipantInput(line);
    if (!participant) {
      return { errorLine: index + 1, participants: [] as ParticipantInput[] };
    }
    participants.push(participant);
  }

  return { errorLine: null, participants };
}
