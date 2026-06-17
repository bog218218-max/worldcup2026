import { MatchCard } from "@/components/MatchCard";
import { StatCard } from "@/components/StatCard";
import { getMatches } from "@/lib/services/matches";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const matches = await getMatches();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--cyan)]">
          Прогнозы раскрываются после kickoff
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Матчи</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Всего матчей" value={matches.length} />
        <StatCard label="Завершено" value={matches.filter((match) => match.status === "finished").length} tone="green" />
        <StatCard label="Скрытых прогнозов" value={matches.filter((match) => !match.predictionsVisible).length} tone="gold" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
