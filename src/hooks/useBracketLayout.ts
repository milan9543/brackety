import { useMemo } from "react";
import type { MatchNode } from "../types";
import { buildLayout, type BracketLayout } from "../layout/polar";

export function useBracketLayout(bracket: MatchNode): BracketLayout {
  return useMemo(() => buildLayout(bracket), [bracket]);
}
