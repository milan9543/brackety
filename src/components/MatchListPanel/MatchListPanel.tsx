import { useState } from "react";
import type { MatchNode, Round } from "../../types";
import { KNOCKOUT_ROUNDS, ROUND_LABEL, resolveTeam, formatScore } from "../../layout/match";
import styles from "./MatchListPanel.module.css";

type Props = {
  matchesByRound: Record<Round, MatchNode[]>;
  onSelectMatch: (match: MatchNode) => void;
};

export function MatchListPanel({ matchesByRound, onSelectMatch }: Props) {
  const [selectedRound, setSelectedRound] = useState<Round>("round32");
  const matches = matchesByRound[selectedRound];

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        {KNOCKOUT_ROUNDS.map((round) => (
          <button
            key={round}
            className={`${styles.tab} ${round === selectedRound ? styles.tabActive : ""}`}
            onClick={() => setSelectedRound(round)}
          >
            {ROUND_LABEL[round]}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {matches.map((match) => {
          const home = resolveTeam(match.home);
          const away = resolveTeam(match.away);
          const score = formatScore(match);
          return (
            <button
              key={match.id}
              className={styles.row}
              onClick={() => onSelectMatch(match)}
            >
              <span className={styles.team}>
                <span className={styles.flag}>{home?.flagEmoji ?? ""}</span>
                <span className={styles.teamName}>{home?.name ?? "TBD"}</span>
              </span>

              <span className={styles.score}>
                {score ? score.main : "vs"}
              </span>

              <span className={`${styles.team} ${styles.teamAway}`}>
                <span className={styles.teamName}>{away?.name ?? "TBD"}</span>
                <span className={styles.flag}>{away?.flagEmoji ?? ""}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
