import { LeaderboardTable } from "@/components/LeaderboardTable";
import { StatCard } from "@/components/StatCard";
import { getLeaderboard } from "@/lib/services/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const rows = await getLeaderboard();
  const leader = rows[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-[var(--green)]">
          Тай-брейки: очки, точные, разницы, исходы, меньше промахов
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Таблица</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Лидер" value={leader?.displayName ?? "нет"} hint={leader ? `${leader.points} очков` : undefined} tone="green" />
        <StatCard label="Точных счетов у лидера" value={leader?.exact ?? 0} tone="gold" />
        <StatCard label="Игроков в таблице" value={rows.length} tone="cyan" />
      </div>
      <LeaderboardTable rows={rows} />
    </div>
  );
}
