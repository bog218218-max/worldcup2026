import Link from "next/link";
import { Badge } from "@/components/Badges";
import { percent } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="table-scroll rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <table className="min-w-[980px] w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Игрок</th>
            <th className="px-4 py-3 text-right">Очки</th>
            <th className="px-4 py-3 text-right">Прогнозы</th>
            <th className="px-4 py-3 text-right">Точные</th>
            <th className="px-4 py-3 text-right">Разницы</th>
            <th className="px-4 py-3 text-right">Исходы</th>
            <th className="px-4 py-3 text-right">Промахи</th>
            <th className="px-4 py-3 text-right">Средний</th>
            <th className="px-4 py-3 text-right">Точность</th>
            <th className="px-4 py-3">Форма</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--surface-2)]"
            >
              <td className="px-4 py-3">
                <span className={row.rank <= 3 ? "text-[var(--gold)]" : "text-[var(--muted)]"}>
                  {row.rank}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link href={`/player/${row.slug}`} className="focus-ring flex items-center gap-2 rounded-sm">
                  <span>{row.avatarEmoji}</span>
                  <span className="font-medium">{row.displayName}</span>
                  {row.rank <= 3 ? <Badge value="призовая зона" tone="prize" /> : null}
                </Link>
              </td>
              <td className="px-4 py-3 text-right text-lg font-semibold text-[var(--green)]">
                {row.points}
              </td>
              <td className="px-4 py-3 text-right">{row.predictionsCount}</td>
              <td className="px-4 py-3 text-right text-[var(--green)]">{row.exact}</td>
              <td className="px-4 py-3 text-right text-[var(--gold)]">{row.difference}</td>
              <td className="px-4 py-3 text-right text-[var(--cyan)]">{row.outcome}</td>
              <td className="px-4 py-3 text-right text-[var(--red)]">{row.miss}</td>
              <td className="px-4 py-3 text-right">{row.averagePoints.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{percent(row.outcomeAccuracy)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {row.lastFive.length === 0 ? (
                    <span className="text-[var(--muted)]">нет матчей</span>
                  ) : (
                    row.lastFive.map((item) => (
                      <span
                        key={item.matchId}
                        className="grid h-7 w-7 place-items-center rounded-md bg-[var(--surface-2)] text-xs font-semibold"
                      >
                        {item.points}
                      </span>
                    ))
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
