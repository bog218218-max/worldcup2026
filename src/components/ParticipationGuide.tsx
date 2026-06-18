export function ParticipationGuide() {
  const steps = [
    "Открой бота и нажми /start",
    "Посмотри матчи через /matches",
    "Сделай прогноз командой /predict <matchId> 2:1",
    "Прогноз можно менять до дедлайна"
  ];

  return (
    <section className="panel rounded-lg p-5">
      <p className="eyebrow text-[var(--cyan)]">Telegram flow</p>
      <h2 className="mt-2 text-2xl font-semibold">Как участвовать</h2>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] p-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--score)] text-sm font-black text-[var(--score-ink)]">
              {index + 1}
            </span>
            <span className="text-sm leading-6 text-[var(--muted)]">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
