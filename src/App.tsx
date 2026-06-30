import { useState } from "react";
import { Bracket } from "./components/Bracket/Bracket";
import { MatchListPanel } from "./components/MatchListPanel/MatchListPanel";
import { useWorldCupData } from "./hooks/useWorldCupData";
import { isTeam } from "./layout/polar";
import type { MatchNode, Round } from "./types";

function findNextMatch(
  matchesByRound: Record<Round, MatchNode[]>,
): MatchNode | null {
  const now = Date.now();
  let next: MatchNode | null = null;
  for (const matches of Object.values(matchesByRound)) {
    for (const m of matches) {
      if (m.score || !m.utcDate) continue;
      if (!isTeam(m.home) || !isTeam(m.away)) continue;
      if (new Date(m.utcDate).getTime() < now) continue;
      if (!next || new Date(m.utcDate) < new Date(next.utcDate!)) next = m;
    }
  }
  return next;
}

const APP_SHELL_CLASS =
  "app-noise-overlay relative isolate flex min-h-screen items-start justify-center overflow-auto pt-6 md:items-center md:py-0 " +
  "bg-[#0a0a0f] bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(20,10,40,0.85)_0%,transparent_70%),radial-gradient(ellipse_55%_45%_at_25%_75%,rgba(0,20,50,0.5)_0%,transparent_65%),radial-gradient(ellipse_60%_50%_at_78%_20%,rgba(30,5,20,0.5)_0%,transparent_60%)]";

export function App() {
  const state = useWorldCupData();
  const [selectedMatch, setSelectedMatch] = useState<MatchNode | null>(null);

  if (state.status === "loading") {
    return (
      <div className={APP_SHELL_CLASS}>
        <p className="font-sans text-white/60">Loading World Cup data…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={APP_SHELL_CLASS}>
        <p className="font-sans text-white/60">
          Failed to load World Cup data: {state.error.message}
        </p>
      </div>
    );
  }

  const { bracket, matchesByRound } = state.data;
  const nextMatch = findNextMatch(matchesByRound);

  return (
    <div className={APP_SHELL_CLASS}>
      <div className="flex flex-col items-center gap-8 md:flex-row">
        <Bracket bracket={bracket} onSelectMatch={setSelectedMatch} />
        <MatchListPanel
          matchesByRound={matchesByRound}
          selectedMatch={selectedMatch}
          nextMatch={nextMatch}
          onSelectMatch={setSelectedMatch}
        />
      </div>
    </div>
  );
}
