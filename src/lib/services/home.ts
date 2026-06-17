import { getLeaderboard } from "@/lib/services/leaderboard";
import { getMatches } from "@/lib/services/matches";
import { getPrizeOverview } from "@/lib/services/prizes";
import { getTournamentStats } from "@/lib/services/stats";

export async function getHomeDashboard() {
  const [leaderboard, matches, prizes, stats] = await Promise.all([
    getLeaderboard(),
    getMatches(),
    getPrizeOverview(),
    getTournamentStats()
  ]);

  return {
    leaderboardTop: leaderboard.slice(0, 3),
    leader: leaderboard[0] ?? null,
    upcomingMatches: matches
      .filter((match) => match.status !== "finished")
      .slice(0, 5),
    playedMatches: matches.filter((match) => match.status === "finished").length,
    totalMatches: matches.length,
    prizes,
    stats
  };
}
