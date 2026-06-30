import { useState } from "react";
import styles from "./App.module.css";
import { Bracket } from "./components/Bracket/Bracket";
import { MatchListPanel } from "./components/MatchListPanel/MatchListPanel";
import { MatchPanel } from "./components/MatchPanel/MatchPanel";
import { useWorldCupData } from "./hooks/useWorldCupData";
import type { MatchNode } from "./types";

export function App() {
  const state = useWorldCupData();
  const [selectedMatch, setSelectedMatch] = useState<MatchNode | null>(null);

  if (state.status === "loading") {
    return (
      <div className={styles.app}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontFamily: "system-ui, sans-serif" }}>
          Loading World Cup data…
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={styles.app}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontFamily: "system-ui, sans-serif" }}>
          Failed to load World Cup data: {state.error.message}
        </p>
      </div>
    );
  }

  const { bracket, matchesByRound } = state.data;

  return (
    <div className={styles.app}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Bracket bracket={bracket} onSelectMatch={setSelectedMatch} />
        <MatchListPanel matchesByRound={matchesByRound} onSelectMatch={setSelectedMatch} />
      </div>

      {selectedMatch && (
        <MatchPanel match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}
