import { MatchesExplorer } from "@/components/MatchesExplorer";
import { StatCard } from "@/components/StatCard";
import { TelegramCta } from "@/components/TelegramCta";
import { getMatches } from "@/lib/services/matches";

export const revalidate = 15;

export default async function MatchesPage() {
  const matches = await getMatches();

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[var(--cyan)]">
            Прогнозы открываются после начала матча
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Матчи</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <TelegramCta />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Всего матчей" value={matches.length} />
        <StatCard label="Завершено" value={matches.filter((match) => match.status === "finished").length} tone="green" />
        <StatCard label="Скрытых прогнозов" value={matches.filter((match) => !match.predictionsVisible).length} tone="gold" />
      </div>
      <MatchesExplorer matches={matches} />
    </div>
  );
}
