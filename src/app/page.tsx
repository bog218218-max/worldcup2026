import Link from "next/link";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { MatchCard } from "@/components/MatchCard";
import { StatCard } from "@/components/StatCard";
import { formatRub } from "@/lib/format";
import { getHomeDashboard } from "@/lib/services/home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeDashboard();

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--green)]">
            Публичный scoreboard
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Турнир прогнозов на чемпионат мира
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Все прогнозы вводятся через Telegram-бота. Сайт только показывает таблицу,
            матчи, статистику игроков и призовой фонд.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-sm text-[var(--muted)]">Текущий лидер</p>
          {data.leader ? (
            <Link href={`/player/${data.leader.slug}`} className="focus-ring mt-3 flex items-center justify-between rounded-sm">
              <span className="flex items-center gap-3">
                <span className="text-3xl">{data.leader.avatarEmoji}</span>
                <span>
                  <span className="block text-xl font-semibold">{data.leader.displayName}</span>
                  <span className="text-sm text-[var(--muted)]">
                    {data.leader.exact} точных, средний {data.leader.averagePoints.toFixed(2)}
                  </span>
                </span>
              </span>
              <span className="text-4xl font-semibold text-[var(--green)]">{data.leader.points}</span>
            </Link>
          ) : (
            <p className="mt-3 text-[var(--muted)]">Лидер появится после seed или первых прогнозов.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Участников" value={data.prizes.participantsCount} tone="cyan" />
        <StatCard label="Призовой фонд" value={formatRub(data.prizes.fundByParticipants)} tone="gold" />
        <StatCard label="Матчей сыграно" value={`${data.playedMatches}/${data.totalMatches}`} />
        <StatCard label="Точных счетов" value={data.stats.exact} tone="green" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Ближайшие матчи</h2>
            <Link href="/matches" className="text-sm text-[var(--green)]">Все матчи</Link>
          </div>
          <div className="grid gap-3">
            {data.upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Топ-3</h2>
            <Link href="/leaderboard" className="text-sm text-[var(--green)]">Таблица</Link>
          </div>
          <LeaderboardTable rows={data.leaderboardTop} />
        </div>
      </section>
    </div>
  );
}
