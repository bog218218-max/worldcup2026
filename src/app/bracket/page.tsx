import type { Metadata } from "next";
import { BracketBoard } from "@/components/BracketBoard";
import { StatCard } from "@/components/StatCard";
import { getPlayoffBracket } from "@/lib/bracket";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "Плей-офф - Forecast Cup 26",
  description: "Сетка плей-офф Forecast Cup 26 с будущими парами и реальными матчами"
};

export default async function BracketPage() {
  const bracket = await getPlayoffBracket();
  const realMatchesCount = bracket.rounds.reduce(
    (sum, round) => sum + round.slots.filter((slot) => slot.match).length,
    bracket.thirdPlaceSlots.length
  );
  const totalSlotsCount = bracket.rounds.reduce((sum, round) => sum + round.slots.length, 0);
  const placeholderCount = totalSlotsCount - realMatchesCount;

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[var(--cyan)]">Плей-офф</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Сетка турнира</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Сетка плей-офф заполнится по мере определения пар.
          </p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Раундов" value={bracket.rounds.length} tone="cyan" />
        <StatCard label="Матчей в сетке" value={realMatchesCount} tone={realMatchesCount > 0 ? "green" : undefined} />
        <StatCard label="Ожидают пары" value={placeholderCount} tone="gold" />
      </section>

      <BracketBoard rounds={bracket.rounds} thirdPlaceSlots={bracket.thirdPlaceSlots} />
    </div>
  );
}
