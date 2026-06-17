import { StatCard } from "@/components/StatCard";
import { getPrizeOverview } from "@/lib/services/prizes";
import { formatRub } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const prizes = await getPrizeOverview();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
          Правила MVP
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Правила турнира</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Взнос" value={formatRub(prizes.entryFee)} />
        <StatCard label="Участников" value={prizes.participantsCount} tone="cyan" />
        <StatCard label="Фонд" value={formatRub(prizes.fundByParticipants)} tone="gold" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="text-2xl font-semibold">Очки</h2>
          <ul className="mt-4 space-y-3 text-[var(--muted)]">
            <li>Точный счёт: 5 баллов.</li>
            <li>Угадана разница мячей: 3 балла.</li>
            <li>Угадан только исход: 2 балла.</li>
            <li>Исход не угадан: 0 баллов.</li>
          </ul>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="text-2xl font-semibold">Дедлайн и видимость</h2>
          <ul className="mt-4 space-y-3 text-[var(--muted)]">
            <li>Прогноз можно менять до одной минуты перед началом матча.</li>
            <li>До kickoff прогнозы других участников скрыты в UI и API.</li>
            <li>После kickoff прогнозы становятся публичными.</li>
            <li>В плей-офф учитывается счёт основного времени.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="text-2xl font-semibold">Призы</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {prizes.distribution.map((item) => (
            <div key={item.id} className="rounded-md bg-[var(--surface-2)] p-4">
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {item.percentage ? `${item.percentage}%` : "фикс"}
              </p>
              <p className="mt-3 text-xl font-semibold text-[var(--gold)]">
                {formatRub(item.amount)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
