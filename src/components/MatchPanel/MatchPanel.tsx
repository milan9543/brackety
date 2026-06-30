import type { MatchNode } from "../../types";
import { ROUND_LABEL, resolveTeam, formatScore } from "../../layout/match";
import styles from "./MatchPanel.module.css";

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
    <div className={styles.panel}>
      <button className={styles.close} onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className={styles.round}>{ROUND_LABEL[match.round] ?? match.round}</div>

      <div className={styles.matchup}>
        <div className={`${styles.teamSide} ${winnerId === homeTeam?.id ? styles.winner : ""}`}>
          <span className={styles.flag}>{homeTeam?.flagEmoji ?? ""}</span>
          <span className={styles.teamName}>{homeTeam?.name ?? "TBD"}</span>
        </div>

        <div className={styles.scoreBlock}>
          {score ? (
            <>
              <div className={styles.score}>{score.main}</div>
              {score.suffix && <div className={styles.scoreSuffix}>{score.suffix}</div>}
            </>
          ) : (
            <span className={styles.tbd}>vs</span>
          )}
        </div>

        <div className={`${styles.teamSide} ${winnerId === awayTeam?.id ? styles.winner : ""}`}>
          <span className={styles.flag}>{awayTeam?.flagEmoji ?? ""}</span>
          <span className={styles.teamName}>{awayTeam?.name ?? "TBD"}</span>
        </div>
      </div>

      {match.winner && (
        <div className={styles.winnerLine}>
          Winner: <strong>{match.winner.name}</strong>
        </div>
      )}

      {match.utcDate && (
        <div className={styles.meta}>{formatDate(match.utcDate)}</div>
      )}
      {match.venue && (
        <div className={styles.meta}>{match.venue}</div>
      )}
    </div>
  );
}
