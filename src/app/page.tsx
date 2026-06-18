import Link from "next/link";
import { CalendarDays, ListChecks, ScrollText, Trophy, Users } from "lucide-react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Badge } from "@/components/Badges";
import { TelegramCta } from "@/components/TelegramCta";
import { initials } from "@/lib/avatar";
import { formatMskDateTime, formatRub, formatScore } from "@/lib/format";
import { getHomeDashboard } from "@/lib/services/home";
import type { LeaderboardRow } from "@/lib/types";

export const revalidate = 15;

type HomeDashboard = Awaited<ReturnType<typeof getHomeDashboard>>;
type HomeMatch = NonNullable<HomeDashboard["nextMatch"]>;

function RankDelta({ value }: { value: number | null }) {
  if (value === null || value === 0) return null;

  return (
    <span className={`text-xs font-black ${value > 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
      {value > 0 ? "▲" : "▼"}{Math.abs(value)}
    </span>
  );
}

function PredictionProgress({ match }: { match: HomeMatch }) {
  const progress = match.predictionProgress;

  return (
    <div className="mt-3 sm:mt-4">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[var(--muted)] sm:text-sm">
        <span>{progress.label}</span>
        {progress.total > 0 ? <span>{progress.percent}%</span> : null}
      </div>
      {progress.total > 0 ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[oklch(0.36_0.04_244/0.7)]">
          <div
            className="h-full rounded-full bg-[var(--green)] transition-[width] duration-200 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MatchScoreboard({ match }: { match: HomeMatch | null }) {
  if (!match) {
    return (
      <section className="rounded-lg border border-[var(--line)] bg-[oklch(0.18_0.036_244/0.95)] p-4 sm:p-5 lg:p-6">
        <p className="eyebrow text-[var(--cyan)]">Матч-центр</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Матчи ещё не добавлены</h1>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-[var(--muted)]">
          Как только появится расписание, здесь будет ближайший матч, дедлайн и готовность прогнозов.
        </p>
      </section>
    );
  }

  const isLive = match.status === "live";

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[linear-gradient(180deg,oklch(0.235_0.045_244/0.98),oklch(0.15_0.032_244/0.98))] p-3 shadow-[0_18px_60px_var(--shadow)] sm:p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-[var(--cyan)]">{isLive ? "Сейчас в игре" : "Следующий матч"}</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
            {match.stage}
          </h1>
        </div>
        <Badge value={match.status} tone={isLive ? "live" : undefined} />
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-center sm:mt-6 sm:gap-5">
        <div className="min-w-0">
          <p className="text-3xl leading-none sm:text-5xl">{match.homeFlag}</p>
          <p className="mt-2 truncate text-base font-semibold sm:text-lg">{match.homeTeam}</p>
        </div>
        <div className="min-w-[4.7rem] rounded-md border border-[oklch(0.82_0.14_84/0.45)] bg-[var(--score)] px-3 py-2 text-[var(--score-ink)] sm:min-w-28 sm:px-4 sm:py-3">
          <p className="text-xl font-black leading-none sm:text-4xl">
            {formatScore(match.homeScore, match.awayScore)}
          </p>
          <p className="mt-2 text-[0.68rem] font-black uppercase text-[oklch(0.34_0.025_244)] sm:text-xs">
            {isLive ? "live" : formatMskDateTime(match.kickoffTime)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-3xl leading-none sm:text-5xl">{match.awayFlag}</p>
          <p className="mt-2 truncate text-base font-semibold sm:text-lg">{match.awayTeam}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-[var(--line-soft)] pt-3 text-sm text-[var(--muted)] sm:grid-cols-[1fr_auto] sm:items-end sm:pt-4">
        <div>
          <p>
            Дедлайн: <span className="font-semibold text-[var(--text)]">{formatMskDateTime(match.deadlineTime)}</span>
          </p>
          <PredictionProgress match={match} />
        </div>
        <Link
          href={`/match/${match.id}`}
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-[oklch(0.72_0.12_225/0.45)] px-4 text-sm font-semibold text-[var(--cyan)] transition-colors hover:bg-[oklch(0.72_0.12_225/0.1)] sm:min-h-11"
        >
          Матчцентр
        </Link>
      </div>
    </section>
  );
}

function PrizeRace({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[oklch(0.18_0.036_244/0.94)] p-3 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-[var(--gold)]">Призовая зона</p>
          <h2 className="mt-1 text-lg font-semibold">Топ-3</h2>
        </div>
        <Trophy className="h-5 w-5 text-[var(--gold)]" aria-hidden="true" />
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">Участники ещё не добавлены</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:block sm:space-y-2">
          {rows.map((row) => (
            <Link
              key={row.userId}
              href={`/player/${row.slug}`}
              className="focus-ring flex min-h-[5.8rem] flex-col items-center justify-between gap-1 rounded-md border border-[var(--line-soft)] bg-[oklch(0.225_0.043_244/0.72)] px-2 py-2 text-center transition-colors hover:bg-[var(--surface-2)] sm:grid sm:min-h-14 sm:grid-cols-[2.4rem_1fr_auto] sm:items-center sm:gap-3 sm:px-3 sm:py-2 sm:text-left"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--score)] text-xs font-black text-[var(--score-ink)] sm:h-9 sm:w-9 sm:text-sm">
                {row.rank}
              </span>
              <span className="min-w-0">
                <span className="flex min-w-0 items-center justify-center gap-1 sm:justify-start sm:gap-2">
                  {row.avatarUrl ? (
                    <img src={row.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] text-[0.68rem] font-black text-[var(--muted)]">
                      {initials(row.displayName)}
                    </span>
                  )}
                  <span className="min-w-0 truncate text-sm font-semibold sm:text-base">{row.displayName}</span>
                </span>
                <span className="mt-0.5 hidden truncate text-xs text-[var(--muted)] sm:block">
                  {row.exact} точных, средний {row.averagePoints.toFixed(1)}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-lg font-black text-[var(--green)] sm:text-xl">{row.points}</span>
                <RankDelta value={row.rankDelta} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function TournamentPulse({ items }: { items: HomeDashboard["tournamentPulse"] }) {
  return (
    <section className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-lg border border-[var(--line-soft)] bg-[oklch(0.18_0.036_244/0.88)] p-3 sm:p-4"
        >
          <p className="truncate text-[0.68rem] font-bold uppercase text-[var(--subtle)] sm:text-xs">
            {item.label}
          </p>
          <p className={`mt-2 truncate text-lg font-black sm:text-2xl ${
            item.tone === "green"
              ? "text-[var(--green)]"
              : item.tone === "gold"
                ? "text-[var(--gold)]"
                : "text-[var(--cyan)]"
          }`}>
            {item.tone === "green" && typeof item.value === "number"
              ? formatRub(item.value)
              : item.value}
          </p>
          <p className="mt-1 truncate text-[0.68rem] text-[var(--muted)] sm:text-xs">{item.hint}</p>
        </div>
      ))}
    </section>
  );
}

function ActionLinks() {
  const actions = [
    { href: "/matches", label: "Все матчи", icon: CalendarDays },
    { href: "/rules", label: "Правила", icon: ScrollText },
    { href: "/players", label: "Игроки", icon: Users }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {actions.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-1 rounded-md border border-[var(--line-soft)] bg-[oklch(0.2_0.04_244/0.9)] px-1 text-center text-[0.78rem] font-semibold leading-tight text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] sm:gap-2 sm:px-2 sm:text-sm"
        >
          <Icon className="h-4 w-4 shrink-0 text-[var(--cyan)]" aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </div>
  );
}

function BroadcastTicker({
  liveMatch,
  nextMatch,
  remainingMatches,
  topMovers
}: {
  liveMatch: HomeDashboard["liveMatch"];
  nextMatch: HomeDashboard["nextMatch"];
  remainingMatches: HomeDashboard["remainingMatches"];
  topMovers: HomeDashboard["topMovers"];
}) {
  const matchForTicker = liveMatch ?? nextMatch;
  const items = [
    matchForTicker
      ? {
          key: "match",
          label: liveMatch ? "LIVE" : "NEXT",
          value: `${matchForTicker.homeTeam} ${formatScore(matchForTicker.homeScore, matchForTicker.awayScore)} ${matchForTicker.awayTeam}`,
          tone: liveMatch ? "red" : "cyan"
        }
      : null,
    ...topMovers.map((row) => ({
      key: `mover-${row.userId}`,
      label: row.rankDelta && row.rankDelta > 0 ? "UP" : "DOWN",
      value: `${row.displayName} ${row.rankDelta && row.rankDelta > 0 ? "+" : ""}${row.rankDelta}`,
      tone: row.rankDelta && row.rankDelta > 0 ? "green" : "red"
    })),
    ...remainingMatches.slice(0, 2).map((match) => ({
      key: `next-${match.id}`,
      label: formatMskDateTime(match.kickoffTime),
      value: `${match.homeTeam} vs ${match.awayTeam}`,
      tone: "muted"
    }))
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (items.length === 0) return null;

  return (
    <section className="border-y border-[var(--line-soft)] bg-[oklch(0.13_0.03_244/0.94)]">
      <div className="mobile-scroll mx-auto flex max-w-[1440px] gap-2 px-4 py-2 sm:px-5 lg:px-6">
        {items.map((item) => (
          <span
            key={item.key}
            className="inline-flex min-h-8 shrink-0 items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[oklch(0.2_0.039_244/0.88)] px-3 text-xs font-semibold"
          >
            <span className={`status-dot ${
              item.tone === "green"
                ? "text-[var(--green)]"
                : item.tone === "red"
                  ? "text-[var(--red)]"
                  : item.tone === "cyan"
                    ? "text-[var(--cyan)]"
                    : "text-[var(--muted)]"
            } ${item.label === "LIVE" ? "animate-pulse" : ""}`} />
            <span className="text-[var(--subtle)]">{item.label}</span>
            <span className="max-w-[17rem] truncate text-[var(--text)]">{item.value}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function UpcomingMatches({ matches }: { matches: HomeDashboard["remainingMatches"] }) {
  if (matches.length === 0) return null;

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[oklch(0.18_0.036_244/0.9)]">
      <div className="divide-y divide-[var(--line-soft)]">
        {matches.slice(0, 3).map((match) => (
          <Link
            key={match.id}
            href={`/match/${match.id}`}
            className="focus-ring grid min-h-14 grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-2)] sm:grid-cols-[8.5rem_1fr_auto] sm:px-5"
          >
            <span className="hidden text-[var(--muted)] sm:block">{formatMskDateTime(match.kickoffTime)}</span>
            <span className="min-w-0 truncate">
              {match.homeFlag} {match.homeTeam} <span className="text-[var(--muted)]">vs</span> {match.awayFlag} {match.awayTeam}
            </span>
            <span className="truncate text-right text-xs font-semibold text-[var(--muted)]">{match.predictionProgress.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const data = await getHomeDashboard();

  return (
    <div>
      <section className="mx-auto grid max-w-[1440px] items-start gap-3 px-4 py-3 sm:px-5 sm:py-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.75fr)] lg:gap-4 lg:px-6 lg:py-5">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <MatchScoreboard match={data.nextMatch} />
        </div>
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <div className="w-full sm:w-auto [&>a]:w-full">
            <TelegramCta />
          </div>
        </div>
        <div className="min-w-0 lg:col-start-2 lg:row-span-4 lg:row-start-1">
          <PrizeRace rows={data.leaderboardTop} />
        </div>
        <div className="min-w-0 lg:col-start-1 lg:row-start-3">
          <TournamentPulse items={data.tournamentPulse} />
        </div>
        <div className="min-w-0 lg:col-start-1 lg:row-start-4">
          <ActionLinks />
        </div>
      </section>

      <BroadcastTicker
        liveMatch={data.liveMatch}
        nextMatch={data.nextMatch}
        remainingMatches={data.remainingMatches}
        topMovers={data.topMovers}
      />

      <section className="mx-auto grid max-w-[1440px] items-start gap-4 px-4 pb-8 pt-4 sm:px-5 lg:px-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-[var(--green)]">Таблица</p>
              <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Полная гонка</h2>
            </div>
            <Link
              href="/leaderboard"
              className="focus-ring hidden min-h-10 items-center gap-2 rounded-md border border-[var(--line-soft)] px-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--text)] sm:inline-flex"
            >
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Таблица
            </Link>
          </div>
          <LeaderboardTable rows={data.leaderboard} compactMode={true} />
        </div>

        {data.remainingMatches.length > 0 ? (
          <div className="min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow text-[var(--cyan)]">Матчи</p>
                <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Ближайшие матчи</h2>
              </div>
              <Link
                href="/matches"
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--line-soft)] px-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--text)]"
              >
                Все матчи
              </Link>
            </div>
            <UpcomingMatches matches={data.remainingMatches} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
