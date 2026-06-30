import { useState } from "react";
import type { BracketLayout } from "../layout/polar";

type HoverTarget =
  | { kind: "team"; teamSlotId: string }
  | { kind: "match"; matchId: string }
  | null;

export function useHoveredMatch(_layout: BracketLayout) {
  const [hovered, setHovered] = useState<HoverTarget>(null);
  const highlightedIds = new Set<string>();
  return { hovered, setHovered, highlightedIds };
}
