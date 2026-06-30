import type { MatchNode, Team } from "../../types";
import { isTeam } from "../../layout/polar";
import styles from "./MatchPanel.module.css";

type Props = {
  match: MatchNode;
  onClose: () => void;
};

function resolveTeam(node: MatchNode | Team): Team | null {
  if (isTeam(node)) return node;
  return node.winner ?? null;
}


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

function formatScore(match: MatchNode): { main: string; suffix: string | null } | null {
  const { score } = match;
  if (!score || !resolveTeam(match.home) || !resolveTeam(match.away)) return null;
  const main = `${score.home} – ${score.away}`;
  let suffix: string | null = null;
  if (score.extraTime && score.homePens !== undefined && score.awayPens !== undefined) {
    suffix = `${score.homePens}–${score.awayPens} pens`;
  } else if (score.extraTime) {
    suffix = "aet";
  }
  return { main, suffix };
}

const ROUND_LABEL: Record<string, string> = {
  final: "Final",
  semi: "Semi-final",
  quarter: "Quarter-final",
  round16: "Round of 16",
  round32: "Round of 32",
  round48: "Round of 48",
};

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
