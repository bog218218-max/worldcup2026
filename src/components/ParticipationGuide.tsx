export function ParticipationGuide() {
  const steps = [
    "Открой бота и нажми /start",
    "Нажми кнопку «Открыть приложение»",
    "Выбери матч и укажи счет",
    "Менять прогноз можно до старта"
  ];

  return (
    <section className="panel rounded-lg p-4 sm:p-5">
      <p className="eyebrow text-[var(--cyan)]">Telegram flow</p>
      <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Как участвовать</h2>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] p-2.5 sm:p-3">
            <span className="grid h-6 w-6 sm:h-7 sm:w-7 shrink-0 place-items-center rounded-md bg-[var(--score)] text-xs sm:text-sm font-black text-[var(--score-ink)]">
              {index + 1}
            </span>
            <span className="text-xs sm:text-sm leading-6 text-[var(--muted)]">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
