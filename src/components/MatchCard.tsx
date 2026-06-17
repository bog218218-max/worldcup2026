import Link from "next/link";
import { Badge } from "@/components/Badges";
import { formatKickoff, formatScore } from "@/lib/format";

type MatchCardProps = {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeFlag: string;
    awayFlag: string;
    kickoffTime: Date;
    stage: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    predictionCount: number;
    predictionsVisible?: boolean;
  };
};

export function MatchCard({ match }: MatchCardProps) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="focus-ring block rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:-translate-y-0.5 hover:bg-[var(--surface-2)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          {match.stage}
        </span>
        <Badge value={match.status} tone={match.status === "live" ? "live" : undefined} />
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <p className="text-2xl">{match.homeFlag}</p>
          <p className="mt-1 font-semibold">{match.homeTeam}</p>
        </div>
        <div className="rounded-md bg-[var(--bg)] px-3 py-2 text-center">
          <p className="text-lg font-semibold">
            {formatScore(match.homeScore, match.awayScore)}
          </p>
          <p className="text-xs text-[var(--muted)]">{formatKickoff(match.kickoffTime)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl">{match.awayFlag}</p>
          <p className="mt-1 font-semibold">{match.awayTeam}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">
        Прогнозов: {match.predictionCount}
        {match.predictionsVisible === false ? " , счёты скрыты до kickoff" : ""}
      </p>
    </Link>
  );
}
