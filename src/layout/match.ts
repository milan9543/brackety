import type { MatchNode, Team } from "../types";
import { isTeam } from "./polar";

export const ROUND_LABEL: Record<string, string> = {
  final: "Final",
  semi: "Semi-final",
  quarter: "Quarter-final",
  round16: "Round of 16",
  round32: "Round of 32",
  round48: "Round of 48",
};

export const KNOCKOUT_ROUNDS = [
  "round32",
  "round16",
  "quarter",
  "semi",
  "final",
] as const;

export function resolveTeam(node: MatchNode | Team): Team | null {
  if (isTeam(node)) return node;
  return node.winner ?? null;
}

export function formatScore(
  match: MatchNode,
): { main: string; suffix: string | null } | null {
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
