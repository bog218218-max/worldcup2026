"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Badge } from "@/components/Badges";
import type { BracketRound, BracketSlot } from "@/lib/bracket";
import { formatMskDateTime } from "@/lib/format";

type BracketBoardProps = {
  rounds: BracketRound[];
  thirdPlaceSlots: Array<BracketSlot & { match: NonNullable<BracketSlot["match"]> }>;
};

type ConnectorSide = "left" | "right" | "none";

function getWinnerLabel(slot: BracketSlot) {
  const match = slot.match;

  if (
    !match ||
    match.status !== "finished" ||
    match.homeScore === null ||
    match.awayScore === null ||
    match.homeScore === match.awayScore
  ) {
    return null;
  }

  return match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
}

function PlaceholderCard({ roundLabel, slot }: { roundLabel: string; slot: number }) {
  return (
    <div className="group relative flex w-full flex-col justify-center rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] p-2 shadow-sm transition-colors hover:border-[var(--line)] hover:bg-[oklch(0.20_0.034_244/0.4)]">
      <div className="mb-1.5 text-center text-[0.6rem] font-medium text-[var(--muted)]">
        Матч {slot}
      </div>
      <div className="space-y-1">
        <div className="flex h-5 items-center rounded bg-[var(--surface)] px-1.5 border border-[var(--line-soft)]/50">
          <span className="truncate text-[0.6rem] text-[var(--subtle)]">Определится</span>
        </div>
        <div className="flex h-5 items-center rounded bg-[var(--surface)] px-1.5 border border-[var(--line-soft)]/50">
          <span className="truncate text-[0.6rem] text-[var(--subtle)]">Определится</span>
        </div>
      </div>
    </div>
  );
}

function TeamRow({
  team,
  flag,
  score,
  isWinner,
  isLive
}: {
  team: string;
  flag: string;
  score: number | null;
  isWinner: boolean;
  isLive: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between rounded px-1.5 py-0.5 transition-colors",
        isWinner
          ? "bg-[oklch(0.24_0.04_244/0.5)] font-semibold text-[var(--text)]"
          : "text-[var(--muted)]"
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 text-[0.7rem]">{flag}</span>
        <span className="truncate text-[0.7rem] font-medium">{team}</span>
      </div>
      <span
        className={clsx(
          "ml-1 shrink-0 text-[0.75rem] font-bold",
          isLive ? "text-[var(--live)]" : isWinner ? "text-[var(--text)]" : "text-[var(--subtle)]"
        )}
      >
        {score ?? "-"}
      </span>
    </div>
  );
}

function MatchBracketCard({ slot, isFinal }: { slot: BracketSlot; isFinal?: boolean }) {
  const match = slot.match;
  const winnerLabel = getWinnerLabel(slot);

  if (!match) return null;

  const isLive = match.status === "live";

  return (
    <Link
      href={`/match/${match.id}`}
      className={clsx(
        "group relative flex w-full flex-col overflow-hidden rounded-lg border bg-[var(--surface)] p-2 shadow-sm transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[var(--cyan)] hover:-translate-y-px",
        isFinal
          ? "border-[var(--gold)] hover:shadow-[0_0_15px_rgba(255,215,0,0.15)] bg-[linear-gradient(180deg,oklch(0.20_0.034_244/0.96),oklch(0.16_0.034_244/0.96))]"
          : "border-[var(--line)] hover:border-[var(--cyan)] hover:shadow-[0_4px_15px_rgba(0,255,255,0.1)]"
      )}
    >
      <div className="mb-1.5 flex items-center justify-between text-[0.55rem] font-medium text-[var(--muted)] uppercase tracking-wider">
        <span className="truncate pr-1">{formatMskDateTime(match.kickoffTime)}</span>
        {isLive && <span className="text-[var(--live)] font-bold">LIVE</span>}
      </div>

      <div className="relative z-10 space-y-[1px]">
        <TeamRow
          team={match.homeTeam}
          flag={match.homeFlag}
          score={match.homeScore}
          isWinner={winnerLabel === match.homeTeam}
          isLive={isLive}
        />
        <TeamRow
          team={match.awayTeam}
          flag={match.awayFlag}
          score={match.awayScore}
          isWinner={winnerLabel === match.awayTeam}
          isLive={isLive}
        />
      </div>
    </Link>
  );
}

function SlotCard({
  roundLabel,
  slot,
  isFinal
}: {
  roundLabel: string;
  slot: BracketSlot;
  isFinal?: boolean;
}) {
  return slot.match ? (
    <MatchBracketCard slot={slot} isFinal={isFinal} />
  ) : (
    <PlaceholderCard roundLabel={roundLabel} slot={slot.slot} />
  );
}

function Connector({ side }: { side: ConnectorSide }) {
  if (side === "none") return null;

  return (
    <div
      aria-hidden="true"
      className={clsx(
        "pointer-events-none absolute top-1/2 -z-10 hidden h-px w-2 sm:w-3 bg-[var(--line-soft)] xl:block",
        side === "right" ? "-right-2 sm:-right-3" : "-left-2 sm:-left-3"
      )}
    />
  );
}

function FlowSlot({
  roundLabel,
  slot,
  connectorSide,
  isFinal
}: {
  roundLabel: string;
  slot: BracketSlot;
  connectorSide: ConnectorSide;
  isFinal?: boolean;
}) {
  return (
    <div className="relative z-10 w-full min-w-0">
      <SlotCard roundLabel={roundLabel} slot={slot} isFinal={isFinal} />
      <Connector side={connectorSide} />
    </div>
  );
}

function BracketColumn({
  round,
  slots,
  side,
  isFinal
}: {
  round: BracketRound;
  slots: BracketSlot[];
  side: "left" | "right" | "center";
  isFinal?: boolean;
}) {
  // Using 32 grid rows perfectly aligns any power of 2 bracket sizes.
  // We calculate how many rows each slot should span to be mathematically centered.
  const rowSpan = Math.max(1, 32 / Math.max(1, slots.length));

  return (
    <div className={clsx("flex h-full w-full min-w-0 flex-col", isFinal && "relative z-20")}>
      <div
        className={clsx(
          "mb-1 shrink-0 rounded border px-1 py-1.5 text-center shadow-sm backdrop-blur",
          isFinal
            ? "border-[var(--gold)] bg-[oklch(0.82_0.14_84/0.1)]"
            : "border-[var(--line-soft)] bg-[var(--surface-2)]/80"
        )}
      >
        <p
          className={clsx(
            "text-[0.6rem] font-bold uppercase tracking-tight",
            isFinal ? "text-[var(--gold)] drop-shadow-md" : "text-[var(--text)]"
          )}
        >
          {round.shortLabel}
        </p>
      </div>

      <div className="grid flex-1" style={{ gridTemplateRows: 'repeat(32, minmax(0, 1fr))' }}>
        {slots.map((slot) => (
          <div
            key={`${round.key}-${side}-${slot.slot}`}
            className="relative flex w-full flex-col justify-center"
            style={{ gridRow: `span ${rowSpan}` }}
          >
            <FlowSlot
              roundLabel={round.shortLabel}
              slot={slot}
              connectorSide={side === "left" ? "right" : side === "right" ? "left" : "none"}
              isFinal={isFinal}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function splitRound(round: BracketRound) {
  const midpoint = Math.ceil(round.slots.length / 2);

  return {
    left: round.slots.slice(0, midpoint),
    right: round.slots.slice(midpoint)
  };
}

function DesktopPyramid({ rounds }: { rounds: BracketRound[] }) {
  const roundOf32 = rounds.find((round) => round.key === "round-of-32");
  const roundOf16 = rounds.find((round) => round.key === "round-of-16");
  const quarterFinal = rounds.find((round) => round.key === "quarter-final");
  const semiFinal = rounds.find((round) => round.key === "semi-final");
  const final = rounds.find((round) => round.key === "final");

  if (!roundOf32 || !roundOf16 || !quarterFinal || !semiFinal) return null;

  const round32 = splitRound(roundOf32);
  const round16 = splitRound(roundOf16);
  const quarters = splitRound(quarterFinal);
  const semis = splitRound(semiFinal);

  return (
    <section data-bracket-desktop="true" className="relative hidden xl:block mb-6">
      <div className="w-full">
        {/* Background Grid Lines for Aesthetics */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--line-soft)_1px,transparent_1px),linear-gradient(to_bottom,var(--line-soft)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-[0.03] mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
        
        {/* The grid is responsive and height adjusts to the viewport, making it fit on screen */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.1fr_1fr_1fr_1fr_1fr] gap-2 lg:gap-3 h-[calc(100vh-220px)] min-h-[550px] max-h-[850px] w-full px-1">
          <BracketColumn round={roundOf32} slots={round32.left} side="left" />
          <BracketColumn round={roundOf16} slots={round16.left} side="left" />
          <BracketColumn round={quarterFinal} slots={quarters.left} side="left" />
          <BracketColumn round={semiFinal} slots={semis.left} side="left" />
          <BracketColumn round={final!} slots={final!.slots} side="center" isFinal />
          <BracketColumn round={semiFinal} slots={semis.right} side="right" />
          <BracketColumn round={quarterFinal} slots={quarters.right} side="right" />
          <BracketColumn round={roundOf16} slots={round16.right} side="right" />
          <BracketColumn round={roundOf32} slots={round32.right} side="right" />
        </div>
      </div>
    </section>
  );
}

export function BracketBoard({ rounds, thirdPlaceSlots }: BracketBoardProps) {
  const [activeRoundKey, setActiveRoundKey] = useState(rounds[0]?.key ?? "round-of-32");
  const activeRound = rounds.find((round) => round.key === activeRoundKey) ?? rounds[0];

  return (
    <div className="space-y-6">
      <DesktopPyramid rounds={rounds} />

      <section data-bracket-mobile="true" className="xl:hidden">
        <div className="mobile-scroll -mx-4 flex gap-2 px-4 pb-2">
          {rounds.map((round) => (
            <button
              key={round.key}
              type="button"
              onClick={() => setActiveRoundKey(round.key)}
              className={clsx(
                "focus-ring min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-all",
                activeRound?.key === round.key
                  ? "border-[var(--cyan)] bg-[oklch(0.79_0.115_86/0.14)] text-[var(--cyan)] shadow-[0_0_15px_rgba(0,255,255,0.1)]"
                  : "border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--line)] hover:text-[var(--text)]"
              )}
            >
              {round.shortLabel}
            </button>
          ))}
        </div>
        
        {activeRound ? (
          <div className="mt-4 space-y-4">
            <div className="mb-6 flex items-baseline justify-between border-b border-[var(--line-soft)] pb-3">
              <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--text)]">
                {activeRound.label}
              </h2>
              <span className="text-sm font-medium text-[var(--muted)]">
                {activeRound.slots.length} {activeRound.slots.length === 1 ? "матч" : "матчей"}
              </span>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {activeRound.slots.map((slot) => (
                <div key={`${activeRound.key}-${slot.slot}`} className="w-full">
                  <SlotCard
                    roundLabel={activeRound.shortLabel}
                    slot={slot}
                    isFinal={activeRound.key === "final"}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {thirdPlaceSlots.length > 0 ? (
        <section className="mt-8 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--gold)]/20 pb-4">
            <div>
              <p className="eyebrow text-[var(--gold)] drop-shadow-sm">Дополнительный матч</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--text)]">Матч за 3 место</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {thirdPlaceSlots.map((slot) => (
              <div key={`third-place-${slot.slot}`} className="w-full">
                <MatchBracketCard slot={slot} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
