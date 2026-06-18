import Link from "next/link";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Badge } from "@/components/Badges";
import { formatKickoff, formatRub, formatScore } from "@/lib/format";
import { getHomeDashboard } from "@/lib/services/home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeDashboard();
  const liveMatch = data.upcomingMatches.find((match) => match.status === "live");
  const nextMatch = liveMatch ?? data.upcomingMatches[0];
  const remainingMatches = data.upcomingMatches.filter((match) => match.id !== nextMatch?.id);
  const playedPct = data.totalMatches > 0 ? Math.round((data.playedMatches / data.totalMatches) * 100) : 0;
  const exactPct = data.stats.totalPredictions > 0 ? Math.round((data.stats.exact / data.stats.totalPredictions) * 100) : 0;

  return (
    <div>
      <section className="stadium-band">
        <div className="relative grid gap-6 px-5 py-8 lg:grid-cols-[1.2fr_1.15fr_1fr_1fr_1.25fr_1.1fr]">
          <div>
            <p className="eyebrow">Турнир</p>
            <h1 className="mt-4 text-4xl font-semibold">ЧМ-2026</h1>
            <p className="mt-4 text-sm font-medium text-[var(--muted)]">Приватный турнир</p>
          </div>
          <div className="border-l border-[var(--line)] pl-6">
            <p className="eyebrow">Призовой фонд</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--green)]">{formatRub(data.prizes.fundByParticipants)}</p>
            <p className="mt-4 text-sm font-medium text-[var(--muted)]">Фиксированный</p>
          </div>
          <div className="border-l border-[var(--line)] pl-6">
            <p className="eyebrow">Матчей сыграно</p>
            <p className="mt-4 text-4xl font-semibold">{data.playedMatches} <span className="text-xl text-[var(--muted)]">/ {data.totalMatches}</span></p>
            <p className="mt-4 text-sm font-medium text-[var(--muted)]">{playedPct}%</p>
          </div>
          <div className="border-l border-[var(--line)] pl-6">
            <p className="eyebrow">Угадано точно</p>
            <p className="mt-4 text-4xl font-semibold">{data.stats.exact}</p>
            <p className="mt-4 text-sm font-medium text-[var(--muted)]">{exactPct}% от прогнозов</p>
          </div>
          <div className="border-l border-[var(--line)] pl-6">
            <p className="eyebrow">Сейчас {liveMatch ? <span className="ml-2 rounded px-1.5 py-0.5 text-xs text-[var(--score)] bg-[var(--red)]">LIVE</span> : null}</p>
            {nextMatch ? (
              <>
                <p className="mt-4 text-2xl font-semibold">{nextMatch.homeTeam} <span className="text-[var(--red)]">{formatScore(nextMatch.homeScore, nextMatch.awayScore)}</span> {nextMatch.awayTeam}</p>
                <p className="mt-4 text-sm font-medium text-[var(--muted)]">{nextMatch.stage}</p>
              </>
            ) : null}
          </div>
          <div className="border-l border-[var(--line)] pl-6">
            <p className="eyebrow">Следующий матч</p>
            {remainingMatches[0] ? (
              <>
                <p className="mt-4 text-3xl font-semibold">{formatKickoff(remainingMatches[0].kickoffTime)}</p>
                <p className="mt-4 text-sm font-medium text-[var(--muted)]">
                  {remainingMatches[0].homeTeam} vs {remainingMatches[0].awayTeam}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="px-5 py-6 space-y-6">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1 rounded bg-[var(--green)]" />
              <h2 className="text-lg font-semibold uppercase tracking-[0.08em]">Турнирная таблица</h2>
              <span className="hidden items-center gap-2 text-sm text-[var(--muted)] sm:flex">
                <span className="status-dot text-[var(--green)]" />
                Обновлено несколько секунд назад
              </span>
            </div>
          </div>
          <LeaderboardTable rows={data.leaderboard} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {nextMatch ? (
            <section className="panel overflow-hidden rounded-lg">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em]">Прямой эфир</h2>
                <Badge value={nextMatch.status} tone={nextMatch.status === "live" ? "live" : undefined} />
              </div>
              <div className="p-5">
                <p className="text-sm font-semibold text-[var(--red)]">{nextMatch.stage}</p>
                <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                  <div>
                    <p className="text-3xl">{nextMatch.homeFlag}</p>
                    <p className="mt-2 font-semibold">{nextMatch.homeTeam}</p>
                  </div>
                  <p className="text-5xl font-semibold text-[var(--red)]">{formatScore(nextMatch.homeScore, nextMatch.awayScore)}</p>
                  <div>
                    <p className="text-3xl">{nextMatch.awayFlag}</p>
                    <p className="mt-2 font-semibold">{nextMatch.awayTeam}</p>
                  </div>
                </div>
                <Link href={`/match/${nextMatch.id}`} className="focus-ring mt-6 flex items-center justify-center border-t border-[var(--line-soft)] pt-4 text-sm font-semibold text-[var(--cyan)]">
                  Смотреть матчцентр
                </Link>
              </div>
            </section>
          ) : null}

          <section className="panel overflow-hidden rounded-lg">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em]">Ближайшие матчи</h2>
              <Link href="/matches" className="text-sm text-[var(--muted)]">Все матчи</Link>
            </div>
            <div className="divide-y divide-[var(--line-soft)]">
              {remainingMatches.slice(0, 4).map((match) => (
                <Link key={match.id} href={`/match/${match.id}`} className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 px-5 py-3 text-sm hover:bg-[var(--surface-2)]">
                  <span className="text-[var(--muted)]">{formatKickoff(match.kickoffTime).replace(",", "")}</span>
                  <span className="min-w-0 truncate">
                    {match.homeFlag} {match.homeTeam} <span className="text-[var(--muted)]">vs</span> {match.awayFlag} {match.awayTeam}
                  </span>
                  <span className="text-[var(--muted)]">{match.stage}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel overflow-hidden rounded-lg">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em]">Как начисляются очки</h2>
              <Link href="/rules" className="text-sm text-[var(--muted)]">Правила</Link>
            </div>
            <div className="divide-y divide-[var(--line-soft)] px-5 text-sm">
              <div className="flex justify-between py-3"><span className="text-[var(--muted)]">Точный счёт</span><strong>5</strong></div>
              <div className="flex justify-between py-3"><span className="text-[var(--muted)]">Разница</span><strong>3</strong></div>
              <div className="flex justify-between py-3"><span className="text-[var(--muted)]">Исход</span><strong>2</strong></div>
              <div className="flex justify-between py-3"><span className="text-[var(--muted)]">Промах</span><strong>0</strong></div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
