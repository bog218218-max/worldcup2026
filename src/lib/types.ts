export type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  slug: string;
  avatarEmoji: string;
  avatarUrl: string | null;
  telegramUsername: string | null;
  isPaid: boolean;
  points: number;
  predictionsCount: number;
  exact: number;
  difference: number;
  outcome: number;
  miss: number;
  averagePoints: number;
  outcomeAccuracy: number;
  exactAccuracy: number;
  pointsRate: number;
  lastFive: Array<{
    matchId: string;
    points: number;
    resultType: string;
  }>;
  rankDelta: number;
};
