import clsx from "clsx";

const toneClasses = {
  exact: "border-[oklch(0.78_0.19_145/0.5)] bg-[oklch(0.78_0.19_145/0.12)] text-[var(--green)]",
  difference: "border-[oklch(0.82_0.14_83/0.5)] bg-[oklch(0.82_0.14_83/0.12)] text-[var(--gold)]",
  outcome: "border-[oklch(0.76_0.13_210/0.5)] bg-[oklch(0.76_0.13_210/0.12)] text-[var(--cyan)]",
  miss: "border-[oklch(0.68_0.19_31/0.5)] bg-[oklch(0.68_0.19_31/0.12)] text-[var(--red)]",
  pending: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)]",
  live: "border-[oklch(0.76_0.13_210/0.5)] bg-[oklch(0.76_0.13_210/0.12)] text-[var(--cyan)]",
  prize: "border-[oklch(0.82_0.14_83/0.5)] bg-[oklch(0.82_0.14_83/0.12)] text-[var(--gold)]"
};

const labels: Record<string, string> = {
  exact: "точный",
  difference: "разница",
  outcome: "исход",
  miss: "промах",
  pending: "ожидает",
  scheduled: "скоро",
  live: "live",
  finished: "завершён"
};

export function Badge({
  value,
  tone
}: {
  value: string;
  tone?: keyof typeof toneClasses;
}) {
  const resolvedTone =
    tone ?? (value in toneClasses ? (value as keyof typeof toneClasses) : "pending");

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[resolvedTone]
      )}
    >
      {labels[value] ?? value}
    </span>
  );
}
