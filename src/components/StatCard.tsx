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
    <section className="panel-muted rounded-lg p-4">
      <p className="eyebrow">
        {label}
      </p>
      <p className={clsx("metric-value mt-3 text-3xl", toneClass[tone])}>{value}</p>
      {hint ? <p className="mt-2 text-sm text-[var(--muted)]">{hint}</p> : null}
    </section>
  );
}
