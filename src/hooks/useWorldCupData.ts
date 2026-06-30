import { useEffect, useState } from "react";
import type { MatchNode, Round, Team } from "../types";
import { fetchWorldCupData } from "../data/fetchWorldCup";

type WorldCupData = {
  bracket: MatchNode;
  teams: Record<string, Team>;
  matchesByRound: Record<Round, MatchNode[]>;
};

type State =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; data: WorldCupData };

export function useWorldCupData(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchWorldCupData()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "error", error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
