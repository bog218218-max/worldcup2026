"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";

type MatchExplorerItem = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  kickoffTime: Date;
  deadlineTime: Date;
  stage: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  predictionCount: number;
  participantCount: number;
  predictionOpen: boolean;
  predictionsVisible?: boolean;
};

const filters = ["Все", "Сегодня", "Завтра", "Открытые для прогноза", "2 тур", "3 тур"] as const;

function mskDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(date));
}

function tomorrowMskKey() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return mskDayKey(tomorrow);
}

export function MatchesExplorer({ matches }: { matches: MatchExplorerItem[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("Все");
  const [query, setQuery] = useState("");

  const visibleMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");
    const today = mskDayKey(new Date());
    const tomorrow = tomorrowMskKey();

    return matches.filter((match) => {
      const kickoffKey = mskDayKey(match.kickoffTime);
      const stage = match.stage.toLocaleLowerCase("ru");
      const teams = `${match.homeTeam} ${match.awayTeam}`.toLocaleLowerCase("ru");

      if (normalizedQuery && !teams.includes(normalizedQuery)) return false;
      if (activeFilter === "Сегодня") return kickoffKey === today;
      if (activeFilter === "Завтра") return kickoffKey === tomorrow;
      if (activeFilter === "Открытые для прогноза") return match.predictionOpen;
      if (activeFilter === "2 тур") return stage.includes("2 тур");
      if (activeFilter === "3 тур") return stage.includes("3 тур");
      return true;
    });
  }, [activeFilter, matches, query]);

  return (
    <section className="space-y-4">
      <div className="panel rounded-lg p-4">
        <div className="mobile-scroll flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={clsx(
                "focus-ring min-h-10 shrink-0 rounded-md border px-3 text-sm font-semibold transition-colors",
                activeFilter === filter
                  ? "border-[oklch(0.79_0.115_86/0.58)] bg-[oklch(0.79_0.115_86/0.14)] text-[var(--gold)]"
                  : "border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3">
          <Search size={18} className="shrink-0 text-[var(--muted)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по команде"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--text)] outline-none placeholder:text-[var(--subtle)]"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
      {visibleMatches.length === 0 ? (
        <section className="panel-muted rounded-lg p-5 text-sm text-[var(--muted)]">
          Матчи по этим условиям не найдены.
        </section>
      ) : null}
    </section>
  );
}
