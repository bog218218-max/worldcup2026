import clsx from "clsx";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "green" | "gold" | "cyan" | "red";
};

const toneClass = {
  default: "text-[var(--text)]",
  green: "text-[var(--green)]",
  gold: "text-[var(--gold)]",
  cyan: "text-[var(--cyan)]",
  red: "text-[var(--red)]"
};

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className={clsx("mt-2 text-3xl font-semibold", toneClass[tone])}>{value}</p>
      {hint ? <p className="mt-2 text-sm text-[var(--muted)]">{hint}</p> : null}
    </section>
  );
}
