import { useState, useEffect, useMemo } from "react";
import type { MatchNode, Round } from "../../types";
import {
  KNOCKOUT_ROUNDS,
  ROUND_LABEL,
  resolveTeam,
  formatScore,
} from "../../layout/match";

type Props = {
  matchesByRound: Record<Round, MatchNode[]>;
  selectedMatch: MatchNode | null;
  nextMatch: MatchNode | null;
  onSelectMatch: (match: MatchNode | null) => void;
};

function formatDate(utcDate: string): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const d = new Date(utcDate);
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
  return `${date} · ${time}`;
}

export function MatchListPanel({
  matchesByRound,
  selectedMatch,
  nextMatch,
  onSelectMatch,
}: Props) {
  const defaultRound = useMemo<Round>(
    () => nextMatch?.round ?? "round32",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [selectedRound, setSelectedRound] = useState<Round>(defaultRound);

  useEffect(() => {
    if (selectedMatch) {
      setSelectedRound(selectedMatch.round);
    }
  }, [selectedMatch]);

  const matches = matchesByRound[selectedRound];

  return (
    <div
      className="flex w-full max-h-none flex-col overflow-hidden md:rounded-xl rounded-t-xl border border-white/10
        bg-[#0f0f16]/95 font-sans text-white shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(245,197,24,0.08)]
        backdrop-blur-md md:w-80 md:max-h-[80vh]"
    >
      <div className="flex flex-wrap gap-1 border-b border-white/8 p-3">
        {KNOCKOUT_ROUNDS.map((round) => (
          <button
            key={round}
            className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold tracking-[0.04em] uppercase transition-colors ${
              round === selectedRound
                ? "border-[#f5c518] bg-[#f5c518] text-[#0d0d0d]"
                : "border-white/12 text-white/55 hover:text-white/85"
            }`}
            onClick={() => {
              setSelectedRound(round);
              onSelectMatch(null);
            }}
          >
            {ROUND_LABEL[round]}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto p-2">
        {matches.map((match) => {
          const home = resolveTeam(match.home);
          const away = resolveTeam(match.away);
          const score = formatScore(match);
          const isExpanded = selectedMatch?.id === match.id;
          const isNext = nextMatch?.id === match.id;
          const winnerId = match.winner?.id ?? null;

          return (
            <div key={match.id}>
              <button
                className={`flex w-full flex-col rounded-lg px-2.5 py-2 text-left transition-colors ${
                  isExpanded
                    ? "bg-white/8"
                    : isNext
                      ? "bg-[#f5c518]/8 hover:bg-[#f5c518]/12"
                      : "hover:bg-white/6"
                }`}
                onClick={() => onSelectMatch(isExpanded ? null : match)}
              >
                <span className="flex w-full items-center gap-2">
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="shrink-0 text-base leading-none">
                      {home?.flagEmoji ?? ""}
                    </span>
                    <span
                      className={`overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap ${
                        winnerId === home?.id
                          ? "font-bold text-white"
                          : "font-medium text-white/85"
                      }`}
                    >
                      {home?.name ?? "TBD"}
                    </span>
                  </span>

                  <span className="w-11 shrink-0 text-center text-[11.5px] font-semibold text-white/50">
                    {isNext ? (
                      <span className="rounded-sm bg-[#f5c518] px-1 py-0.5 text-[9px] font-bold tracking-[0.06em] text-[#0d0d0d] uppercase">
                        Next
                      </span>
                    ) : score ? (
                      score.main
                    ) : (
                      "vs"
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-row-reverse items-center gap-1.5 text-right">
                    <span
                      className={`overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap ${
                        winnerId === away?.id
                          ? "font-bold text-white"
                          : "font-medium text-white/85"
                      }`}
                    >
                      {away?.name ?? "TBD"}
                    </span>
                    <span className="shrink-0 text-base leading-none">
                      {away?.flagEmoji ?? ""}
                    </span>
                  </span>
                </span>
                {isNext && match.utcDate && (
                  <span className="mt-1 text-[10px] text-[#f5c518]/60">
                    {formatDate(match.utcDate)}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="mx-1 mb-1 rounded-lg border border-white/8 bg-[#0a0a12] px-3 py-3">
                  <div className="mb-2 flex items-center gap-3">
                    <div
                      className={`flex flex-1 flex-col items-center gap-1 transition-opacity ${
                        winnerId && winnerId !== home?.id
                          ? "opacity-45"
                          : "opacity-100"
                      }`}
                    >
                      <span className="text-[28px] leading-none">
                        {home?.flagEmoji ?? ""}
                      </span>
                      <span
                        className={`text-center text-[11px] tracking-[0.02em] ${
                          winnerId === home?.id
                            ? "font-bold text-[#f5c518]"
                            : "font-medium text-white/80"
                        }`}
                      >
                        {home?.name ?? "TBD"}
                      </span>
                    </div>

                    <div className="shrink-0 text-center">
                      {score ? (
                        <>
                          <div className="text-lg font-bold tracking-[0.03em] text-white">
                            {score.main}
                          </div>
                          {score.suffix && (
                            <div className="mt-0.5 text-[10px] font-medium tracking-[0.04em] text-white/45">
                              {score.suffix}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm font-medium text-white/30">
                          vs
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex flex-1 flex-col items-center gap-1 transition-opacity ${
                        winnerId && winnerId !== away?.id
                          ? "opacity-45"
                          : "opacity-100"
                      }`}
                    >
                      <span className="text-[28px] leading-none">
                        {away?.flagEmoji ?? ""}
                      </span>
                      <span
                        className={`text-center text-[11px] tracking-[0.02em] ${
                          winnerId === away?.id
                            ? "font-bold text-[#f5c518]"
                            : "font-medium text-white/80"
                        }`}
                      >
                        {away?.name ?? "TBD"}
                      </span>
                    </div>
                  </div>

                  {match.goals &&
                    (match.goals.home.length > 0 ||
                      match.goals.away.length > 0) && (
                      <div className="mt-2 flex gap-2 text-[10px] text-white/50">
                        <div className="flex flex-1 flex-col gap-0.5">
                          {match.goals.home.map((g, i) => (
                            <span key={i}>
                              {g.name}{" "}
                              <span className="text-white/30">{g.minute}'</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-1 flex-col items-end gap-0.5 text-right">
                          {match.goals.away.map((g, i) => (
                            <span key={i}>
                              <span className="text-white/30">{g.minute}'</span>{" "}
                              {g.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {match.utcDate && (
                    <div className="mt-1 text-[10px] leading-snug text-white/35">
                      {formatDate(match.utcDate)}
                    </div>
                  )}
                  {match.venue && (
                    <div className="mt-1 text-[10px] leading-snug text-white/35">
                      {match.venue}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
