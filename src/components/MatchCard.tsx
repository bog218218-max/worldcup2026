import Link from "next/link";
import { Badge } from "@/components/Badges";
import { formatMskDateTime, formatScore } from "@/lib/format";

type MatchCardProps = {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeFlag: string;
    awayFlag: string;
    kickoffTime: Date;
    deadlineTime: Date;
    stage: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    predictionCount: number;
    participantCount: number;
    predictionOpen: boolean;
    predictionsVisible?: boolean;
  };
};

export function MatchCard({ match }: MatchCardProps) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="focus-ring panel group block rounded-lg p-3 sm:p-5 transition-all duration-200 hover:bg-[oklch(0.25_0.045_244/0.4)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">
          {match.stage}
        </span>
        <Badge value={match.status} tone={match.status === "live" ? "live" : undefined} />
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rule-top pt-3 sm:mt-4 sm:gap-3 sm:pt-4">
        <div className="min-w-0">
          <p className="text-lg sm:text-xl">{match.homeFlag}</p>
          <p className="mt-1 truncate text-sm font-semibold sm:text-base">{match.homeTeam}</p>
        </div>
        <div className="min-w-16 rounded-md border border-[var(--line-soft)] bg-[var(--score)] px-2 py-2 text-center text-[var(--score-ink)] sm:min-w-20 sm:px-3">
          <p className="text-lg font-black sm:text-xl">
            {formatScore(match.homeScore, match.awayScore)}
          </p>
          <p className="mt-1 text-xs font-semibold text-[oklch(0.35_0.018_163)]">{formatMskDateTime(match.kickoffTime)}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-lg sm:text-xl">{match.awayFlag}</p>
          <p className="mt-1 truncate text-sm font-semibold sm:text-base">{match.awayTeam}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 border-t border-[var(--line-soft)] pt-3 text-xs text-[var(--muted)] sm:mt-4 sm:pt-4 sm:text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {match.participantCount === 0
              ? "Участники ещё не добавлены"
              : `Прогноз сделали ${match.predictionCount} из ${match.participantCount}`}
          </span>
          {match.predictionsVisible === false ? <span className="text-[var(--gold)]">скрыты</span> : null}
        </div>

      </div>
    </Link>
  );
}
