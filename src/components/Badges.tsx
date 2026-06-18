import clsx from "clsx";

const toneClasses = {
  exact: "border-[oklch(0.74_0.145_148/0.45)] bg-[oklch(0.74_0.145_148/0.1)] text-[var(--green)]",
  difference: "border-[oklch(0.79_0.115_86/0.46)] bg-[oklch(0.79_0.115_86/0.1)] text-[var(--gold)]",
  outcome: "border-[oklch(0.69_0.095_218/0.42)] bg-[oklch(0.69_0.095_218/0.09)] text-[var(--cyan)]",
  miss: "border-[oklch(0.66_0.145_28/0.44)] bg-[oklch(0.66_0.145_28/0.1)] text-[var(--red)]",
  pending: "border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--muted)]",
  live: "border-[oklch(0.66_0.145_28/0.5)] bg-[oklch(0.66_0.145_28/0.1)] text-[var(--red)] animate-pulse",
  prize: "border-[oklch(0.79_0.115_86/0.48)] bg-[oklch(0.79_0.115_86/0.11)] text-[var(--gold)]"
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClasses[resolvedTone]
      )}
    >
      <span className="status-dot" aria-hidden="true" />
      {labels[value] ?? value}
    </span>
  );
}
