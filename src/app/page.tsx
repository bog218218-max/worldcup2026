import Link from "next/link";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Badge } from "@/components/Badges";
import { ParticipationGuide } from "@/components/ParticipationGuide";
import { TelegramCta } from "@/components/TelegramCta";
import { formatMskDateTime, formatRub, formatScore } from "@/lib/format";
import { getHomeDashboard } from "@/lib/services/home";

export const revalidate = 15;

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
        <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-px bg-[var(--line-soft)] p-px sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.2fr_1.15fr_1fr_1fr_1.25fr_1.1fr] lg:gap-6 lg:bg-transparent lg:p-0 lg:px-5 lg:py-8">
          <div className="bg-[oklch(0.17_0.042_244/0.92)] p-5 sm:p-4 lg:bg-transparent lg:p-0">
            <p className="eyebrow">Турнир</p>
            <h1 className="mt-3 text-3xl font-semibold lg:mt-4 lg:text-4xl">ЧМ-2026</h1>
            <p className="mt-2 text-sm font-medium text-[var(--muted)] lg:mt-4">Приватный турнир</p>
            <div className="mt-4">
              <TelegramCta />
            </div>
          </div>
          <div className="bg-[oklch(0.17_0.042_244/0.92)] p-5 sm:p-4 lg:border-l lg:border-[var(--line)] lg:bg-transparent lg:p-0 lg:pl-6">
            <p className="eyebrow">Призовой фонд</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--green)] lg:mt-4 lg:text-4xl">{formatRub(data.prizes.fundByParticipants)}</p>
            <p className="mt-2 text-sm font-medium text-[var(--muted)] lg:mt-4">Фиксированный</p>
          </div>
          <div className="bg-[oklch(0.17_0.042_244/0.92)] p-5 sm:p-4 lg:border-l lg:border-[var(--line)] lg:bg-transparent lg:p-0 lg:pl-6">
            <p className="eyebrow">Матчей сыграно</p>
            <p className="mt-3 text-2xl font-semibold lg:mt-4 lg:text-4xl">{data.playedMatches} <span className="text-base text-[var(--muted)] lg:text-xl">/ {data.totalMatches}</span></p>
            <p className="mt-2 text-sm font-medium text-[var(--muted)] lg:mt-4">{playedPct}%</p>
          </div>
          <div className="bg-[oklch(0.17_0.042_244/0.92)] p-5 sm:p-4 lg:border-l lg:border-[var(--line)] lg:bg-transparent lg:p-0 lg:pl-6">
            <p className="eyebrow">Угадано точно</p>
            <p className="mt-3 text-2xl font-semibold lg:mt-4 lg:text-4xl">{data.stats.exact}</p>
            <p className="mt-2 text-sm font-medium text-[var(--muted)] lg:mt-4">{exactPct}% от прогнозов</p>
          </div>
          <div className="bg-[oklch(0.17_0.042_244/0.92)] p-5 sm:p-4 lg:border-l lg:border-[var(--line)] lg:bg-transparent lg:p-0 lg:pl-6">
            <p className="eyebrow">Сейчас {liveMatch ? <span className="ml-2 rounded px-1.5 py-0.5 text-xs text-[var(--score)] bg-[var(--red)] animate-pulse">LIVE</span> : null}</p>
            {nextMatch ? (
              <>
                <p className="mt-3 text-xl font-semibold leading-snug lg:mt-4 lg:text-2xl">{nextMatch.homeTeam} <span className="text-[var(--red)]">{formatScore(nextMatch.homeScore, nextMatch.awayScore)}</span> {nextMatch.awayTeam}</p>
                <p className="mt-2 text-sm font-medium text-[var(--muted)] lg:mt-4">{nextMatch.stage}</p>
              </>
            ) : null}
          </div>
          <div className="bg-[oklch(0.17_0.042_244/0.92)] p-5 sm:p-4 lg:border-l lg:border-[var(--line)] lg:bg-transparent lg:p-0 lg:pl-6">
            <p className="eyebrow">Следующий матч</p>
            {remainingMatches[0] ? (
              <>
                <p className="mt-3 text-2xl font-semibold lg:mt-4 lg:text-3xl">{formatMskDateTime(remainingMatches[0].kickoffTime)}</p>
                <p className="mt-2 text-sm font-medium text-[var(--muted)] lg:mt-4">
                  {remainingMatches[0].homeTeam} vs {remainingMatches[0].awayTeam}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] space-y-6 px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
        <ParticipationGuide />

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-8 w-1 rounded bg-[var(--green)]" />
              <h2 className="text-base font-semibold uppercase tracking-[0.08em] sm:text-lg">Турнирная таблица</h2>
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
                <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center sm:mt-6 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-3xl">{nextMatch.homeFlag}</p>
                    <p className="mt-2 truncate font-semibold">{nextMatch.homeTeam}</p>
                  </div>
                  <p className="text-4xl font-semibold text-[var(--red)] sm:text-5xl">{formatScore(nextMatch.homeScore, nextMatch.awayScore)}</p>
                  <div className="min-w-0">
                    <p className="text-3xl">{nextMatch.awayFlag}</p>
                    <p className="mt-2 truncate font-semibold">{nextMatch.awayTeam}</p>
                  </div>
                </div>
                <Link href={`/match/${nextMatch.id}`} className="focus-ring mt-6 flex items-center justify-center border-t border-[var(--line-soft)] pt-4 text-sm font-semibold text-[var(--cyan)]">
                  Смотреть матчцентр
                </Link>
                <p className="mt-3 text-center text-sm text-[var(--muted)]">
                  Прогноз сделали {nextMatch.predictionCount} из {nextMatch.participantCount}
                </p>
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
                <Link key={match.id} href={`/match/${match.id}`} className="grid min-h-12 grid-cols-[7.5rem_1fr] items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--surface-2)] sm:grid-cols-[8rem_1fr_auto] sm:px-5">
                  <span className="text-[var(--muted)]">{formatMskDateTime(match.kickoffTime).replace(",", "")}</span>
                  <span className="min-w-0 truncate">
                    {match.homeFlag} {match.homeTeam} <span className="text-[var(--muted)]">vs</span> {match.awayFlag} {match.awayTeam}
                  </span>
                  <span className="hidden text-[var(--muted)] sm:block">{match.stage}</span>
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
