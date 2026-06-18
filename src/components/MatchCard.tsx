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
      className="focus-ring panel group block rounded-lg p-4 transition-colors duration-150 hover:border-[oklch(0.74_0.145_148/0.42)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">
          {match.stage}
        </span>
        <Badge value={match.status} tone={match.status === "live" ? "live" : undefined} />
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rule-top pt-4">
        <div className="min-w-0">
          <p className="text-xl">{match.homeFlag}</p>
          <p className="mt-1 truncate font-semibold">{match.homeTeam}</p>
        </div>
        <div className="min-w-20 rounded-md border border-[var(--line-soft)] bg-[var(--score)] px-3 py-2 text-center text-[var(--score-ink)]">
          <p className="text-xl font-black">
            {formatScore(match.homeScore, match.awayScore)}
          </p>
          <p className="mt-1 text-xs font-semibold text-[oklch(0.35_0.018_163)]">{formatKickoff(match.kickoffTime)}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-xl">{match.awayFlag}</p>
          <p className="mt-1 truncate font-semibold">{match.awayTeam}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span>Прогнозов: {match.predictionCount}</span>
        {match.predictionsVisible === false ? <span className="text-[var(--gold)]">скрыты</span> : null}
      </div>
    </Link>
  );
}
