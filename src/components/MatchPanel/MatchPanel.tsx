import type { MatchNode } from "../../types";
import { ROUND_LABEL, resolveTeam, formatScore } from "../../layout/match";

type Props = {
  match: MatchNode;
  onClose: () => void;
};

function formatDate(utcDate: string): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date(utcDate).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
    timeZoneName: "short",
  });
}

export function MatchPanel({ match, onClose }: Props) {
  const score = formatScore(match);
  const homeTeam = resolveTeam(match.home);
  const awayTeam = resolveTeam(match.away);
  const winnerId = match.winner?.id ?? null;

  return (
    <div
      className="fixed top-1/2 right-8 z-100 w-65 -translate-y-1/2 rounded-xl border border-white/10
        bg-[#0f0f16]/95 p-5 pb-4.5 font-sans text-white shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(245,197,24,0.08)]
        backdrop-blur-md [animation:slide-in_0.18s_ease]
        max-[600px]:top-auto max-[600px]:right-0 max-[600px]:bottom-0 max-[600px]:left-0
        max-[600px]:w-full max-[600px]:translate-x-0 max-[600px]:translate-y-0
        max-[600px]:rounded-b-none"
    >
      <button
        className="absolute top-2.5 right-3 rounded px-1 py-0.5 text-[13px] leading-none text-white/40 transition-colors hover:text-white/90"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      <div className="mb-3.5 text-[10px] font-semibold tracking-[0.1em] text-[#f5c518]/75 uppercase">
        {ROUND_LABEL[match.round] ?? match.round}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div
          className={`flex flex-1 flex-col items-center gap-1 transition-opacity ${
            winnerId === homeTeam?.id ? "opacity-100" : "opacity-55"
          }`}
        >
          <span
            className={`text-[26px] leading-none ${winnerId === homeTeam?.id ? "drop-shadow-[0_0_6px_rgba(245,197,24,0.6)]" : ""}`}
          >
            {homeTeam?.flagEmoji ?? ""}
          </span>
          <span
            className={`text-center text-[11px] tracking-[0.02em] transition-[color,font-weight] ${
              winnerId === homeTeam?.id ? "font-bold text-[#f5c518]" : "font-medium text-white/85"
            }`}
          >
            {homeTeam?.name ?? "TBD"}
          </span>
        </div>

        <div className="shrink-0 text-center">
          {score ? (
            <>
              <div className="text-lg font-bold tracking-[0.03em] text-white">{score.main}</div>
              {score.suffix && (
                <div className="mt-0.5 text-[10px] font-medium tracking-[0.04em] text-white/45">
                  {score.suffix}
                </div>
              )}
            </>
          ) : (
            <span className="text-sm font-medium text-white/30">vs</span>
          )}
        </div>

        <div
          className={`flex flex-1 flex-col items-center gap-1 transition-opacity ${
            winnerId === awayTeam?.id ? "opacity-100" : "opacity-55"
          }`}
        >
          <span
            className={`text-[26px] leading-none ${winnerId === awayTeam?.id ? "drop-shadow-[0_0_6px_rgba(245,197,24,0.6)]" : ""}`}
          >
            {awayTeam?.flagEmoji ?? ""}
          </span>
          <span
            className={`text-center text-[11px] tracking-[0.02em] transition-[color,font-weight] ${
              winnerId === awayTeam?.id ? "font-bold text-[#f5c518]" : "font-medium text-white/85"
            }`}
          >
            {awayTeam?.name ?? "TBD"}
          </span>
        </div>
      </div>

      {match.winner && (
        <div className="mb-2.5 text-center text-[11px] text-white/50">
          Winner: <strong className="font-semibold text-[#f5c518]">{match.winner.name}</strong>
        </div>
      )}

      {match.utcDate && (
        <div className="mt-1.5 text-[10.5px] leading-snug text-white/35">
          {formatDate(match.utcDate)}
        </div>
      )}
      {match.venue && (
        <div className="mt-1.5 text-[10.5px] leading-snug text-white/35">{match.venue}</div>
      )}
    </div>
  );
}
