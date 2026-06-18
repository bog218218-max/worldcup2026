import Link from "next/link";
import { Badge } from "@/components/Badges";
import { percent } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

function rankClass(rank: number) {
  return rank <= 3
    ? "bg-[var(--score)] text-[var(--score-ink)]"
    : "border border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--muted)]";
}

function formColor(points: number) {
  if (points >= 5) return "bg-[var(--green)]";
  if (points > 0) return "bg-[oklch(0.72_0.04_244)]";
  return "bg-[var(--red)]";
}

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="panel overflow-hidden rounded-lg">
      <div className="hidden table-scroll md:block">
        <table className="data-table min-w-[980px]">
          <thead>
            <tr>
              <th>#</th>
              <th>Игрок</th>
              <th className="text-right">Очки</th>
              <th className="text-right">Прогнозы</th>
              <th className="text-right">Точные</th>
              <th className="text-right">Разницы</th>
              <th className="text-right">Исходы</th>
              <th className="text-right">Промахи</th>
              <th className="text-right">Средний</th>
              <th className="text-right">Точность</th>
              <th>Форма</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className={row.rank <= 3 ? "prize-row" : undefined}>
                <td className="w-12">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`grid h-8 w-8 place-items-center rounded-md font-black ${rankClass(row.rank)}`}>
                      {row.rank}
                    </span>
                    {row.rankDelta !== 0 && (
                      <span className={`text-[10px] font-bold ${row.rankDelta > 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                        {row.rankDelta > 0 ? "▲" : "▼"}{Math.abs(row.rankDelta)}
                      </span>
                    )}
                    {row.rankDelta === 0 && row.lastFive.length > 0 && (
                      <span className="text-[10px] font-bold text-[var(--muted)]">—</span>
                    )}
                  </div>
                </td>
                <td>
                  <Link href={`/player/${row.slug}`} className="focus-ring flex items-center gap-2 rounded-sm">
                    {row.avatarUrl ? (
                      <img src={row.avatarUrl} alt={row.displayName} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-xl">{row.avatarEmoji}</span>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium leading-tight">{row.displayName}</span>
                      {row.telegramUsername && (
                        <span className="text-xs text-[var(--muted)]">@{row.telegramUsername}</span>
                      )}
                    </div>
                    {row.rank <= 3 ? <Badge value="призовая зона" tone="prize" /> : null}
                  </Link>
                </td>
                <td className="text-right text-lg font-semibold text-[var(--green)]">
                  {row.points}
                </td>
                <td className="text-right">{row.predictionsCount}</td>
                <td className="text-right text-[var(--green)]">{row.exact}</td>
                <td className="text-right text-[var(--gold)]">{row.difference}</td>
                <td className="text-right text-[var(--cyan)]">{row.outcome}</td>
                <td className="text-right text-[var(--red)]">{row.miss}</td>
                <td className="text-right">{row.averagePoints.toFixed(2)}</td>
                <td className="text-right">{percent(row.outcomeAccuracy)}</td>
                <td>
                  <div className="flex gap-1">
                    {row.lastFive.length === 0 ? (
                      <span className="text-[var(--muted)]">нет матчей</span>
                    ) : (
                      row.lastFive.map((item) => (
                        <span
                          key={item.matchId}
                          title={`${item.points} очков`}
                          className={`block h-3 w-3 rounded-full ${formColor(item.points)}`}
                        />
                      ))
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[var(--line-soft)] md:hidden">
        {rows.map((row) => (
          <Link
            key={row.userId}
            href={`/player/${row.slug}`}
            className="focus-ring block p-4 transition-colors hover:bg-[var(--surface-2)] sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className={`grid h-9 w-9 place-items-center rounded-md font-black ${rankClass(row.rank)}`}>
                    {row.rank}
                  </span>
                  {row.rankDelta !== 0 && (
                    <span className={`text-[10px] font-bold ${row.rankDelta > 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                      {row.rankDelta > 0 ? "▲" : "▼"}{Math.abs(row.rankDelta)}
                    </span>
                  )}
                  {row.rankDelta === 0 && row.lastFive.length > 0 && (
                    <span className="text-[10px] font-bold text-[var(--muted)]">—</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {row.avatarUrl ? (
                      <img src={row.avatarUrl} alt={row.displayName} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-xl">{row.avatarEmoji}</span>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-semibold leading-tight">{row.displayName}</span>
                      {row.telegramUsername && (
                        <span className="text-xs text-[var(--muted)] truncate">@{row.telegramUsername}</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[0.85rem] text-[var(--muted)]">
                    {row.exact} точных, {percent(row.outcomeAccuracy)} исходов
                  </p>
                  {row.rank <= 3 ? (
                    <span className="mt-2 inline-flex rounded-full border border-[oklch(0.79_0.115_86/0.48)] bg-[oklch(0.79_0.115_86/0.11)] px-2 py-1 text-xs font-semibold text-[var(--gold)]">
                      призовая зона
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[var(--green)]">{row.points}</p>
                <p className="text-xs text-[var(--muted)]">очков</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[0.8rem] font-medium text-[var(--muted)]">
              <span className="rounded-md bg-[var(--surface-2)] px-2 py-2">Раз {row.difference}</span>
              <span className="rounded-md bg-[var(--surface-2)] px-2 py-2">Исх {row.outcome}</span>
              <span className="rounded-md bg-[var(--surface-2)] px-2 py-2">Мимо {row.miss}</span>
              <span className="rounded-md bg-[var(--surface-2)] px-2 py-2">Ср {row.averagePoints.toFixed(1)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
