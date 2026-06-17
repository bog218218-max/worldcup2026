export const PREDICTION_DEADLINE_OFFSET_MS = 60 * 1000;

export function getPredictionDeadline(kickoffTime: Date) {
  return new Date(kickoffTime.getTime() - PREDICTION_DEADLINE_OFFSET_MS);
}

export function isPredictionLocked(kickoffTime: Date, now = new Date()) {
  return now >= getPredictionDeadline(kickoffTime);
}

export function isPredictionVisible(kickoffTime: Date, now = new Date()) {
  return now >= kickoffTime;
}
