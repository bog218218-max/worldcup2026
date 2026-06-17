import { HitBreakdownChart, ProgressChart } from "@/components/Charts";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { StatCard } from "@/components/StatCard";
import { getTournamentStats } from "@/lib/services/stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const stats = await getTournamentStats();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--cyan)]">
          Турнирная аналитика
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Статистика</h1>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Всего прогнозов" value={stats.totalPredictions} />
        <StatCard label="Средний балл" value={stats.averagePoints.toFixed(2)} tone="gold" />
        <StatCard label="Точных счетов" value={stats.exact} tone="green" />
        <StatCard label="Промахов" value={stats.miss} tone="red" />
        <StatCard label="Разниц" value={stats.difference} tone="gold" />
        <StatCard label="Исходов" value={stats.outcome} tone="cyan" />
        <StatCard label="Лёгкий матч" value={stats.easiestMatch ? `${stats.easiestMatch.homeTeam} ${stats.easiestMatch.awayTeam}` : "нет"} />
        <StatCard label="Сложный матч" value={stats.hardestMatch ? `${stats.hardestMatch.homeTeam} ${stats.hardestMatch.awayTeam}` : "нет"} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <HitBreakdownChart
          data={[
            { name: "Точные", value: stats.exact, fill: "var(--green)" },
            { name: "Разницы", value: stats.difference, fill: "var(--gold)" },
            { name: "Исходы", value: stats.outcome, fill: "var(--cyan)" },
            { name: "Промахи", value: stats.miss, fill: "var(--red)" }
          ]}
        />
        <ProgressChart data={stats.progress} />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Рейтинг по точности</h2>
        <LeaderboardTable rows={stats.accuracyRanking} />
      </section>
    </div>
  );
}
