import { ClosedTournamentNotice } from "@/components/ClosedTournamentNotice";
import { StatCard } from "@/components/StatCard";
import { getPrizeOverview } from "@/lib/services/prizes";
import { formatRub } from "@/lib/format";

export const revalidate = 15;

export default async function RulesPage() {
  const prizes = await getPrizeOverview();

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="eyebrow text-[var(--gold)]">
          Правила MVP
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Правила турнира</h1>
      </div>

      <ClosedTournamentNotice />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Взнос" value={formatRub(prizes.entryFee)} />
        <StatCard label="Участников" value={prizes.participantsCount} tone="cyan" />
        <StatCard label="Фонд" value={formatRub(prizes.fundByParticipants)} tone="gold" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel rounded-lg p-5">
          <h2 className="text-2xl font-semibold">Очки</h2>
          <ul className="mt-4 space-y-3 text-[var(--muted)]">
            <li>Точный счёт: 5 баллов.</li>
            <li>Угадана разница мячей: 3 балла.</li>
            <li>Угадан только исход: 2 балла.</li>
            <li>Исход не угадан: 0 баллов.</li>
          </ul>
        </div>
        <div className="panel rounded-lg p-5">
          <h2 className="text-2xl font-semibold">Дедлайн и видимость</h2>
          <ul className="mt-4 space-y-3 text-[var(--muted)]">
            <li>Прогноз можно менять и отменять в любой момент до дедлайна (за 1 минуту до старта матча).</li>
            <li>До начала матча прогнозы других участников скрыты, чтобы избежать списывания.</li>
            <li>Как только матч начался, все ставки становятся публичными и их можно посмотреть.</li>
            <li>За пропущенный матч начисляется 0 баллов. Штрафов нет, но после дедлайна добавить прогноз уже нельзя.</li>
          </ul>
        </div>
      </section>

      <section className="panel rounded-lg p-5">
        <h2 className="text-2xl font-semibold">Плей-офф</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
          В плей-офф прогноз считается по счёту в основное время. Дополнительное время и пенальти не учитываются.
          Например, если основное время завершилось 1:1, а затем команда победила по пенальти, для начисления очков используется счёт 1:1.
        </p>
      </section>

      <section className="panel rounded-lg p-5">
        <h2 className="text-2xl font-semibold">Призы</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {prizes.distribution.map((item) => (
            <div key={item.id} className="panel-muted rounded-md p-4">
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
