import type { MatchNode as MatchNodeData } from "../../types";
import type { LayoutNode, TeamSlot } from "../../layout/polar";
import { isTeam } from "../../layout/polar";
import { BADGE_RADIUS, INNER_BADGE_RADIUS } from "../../layout/constants";
import { TeamBadge } from "../TeamBadge/TeamBadge";

type Props = {
  matchNode: MatchNodeData;
  layoutNode: LayoutNode;
  teamSlots: Map<string, TeamSlot>;
  nodes: Map<string, LayoutNode>;
  highlightedIds: Set<string>;
  onHoverTeam: (teamSlotId: string, entering: boolean) => void;
  onHoverMatch: (matchId: string, entering: boolean) => void;
};

export function MatchNode({
  matchNode,
  layoutNode,
  teamSlots,
  highlightedIds,
  onHoverTeam,
  onHoverMatch,
}: Props) {
  const { position } = layoutNode;
  const isHighlighted = highlightedIds.has(layoutNode.matchId);

  // Leaf (r32): render two team badges at their slot positions
  if (layoutNode.children === null) {
    const homeTeam = isTeam(matchNode.home) ? matchNode.home : null;
    const awayTeam = isTeam(matchNode.away) ? matchNode.away : null;

    return (
      <g>
        {homeTeam &&
          (() => {
            const slotId = `team-${homeTeam.id}`;
            const slot = teamSlots.get(slotId);
            if (!slot) return null;
            const eliminated =
              matchNode.winner !== null && matchNode.winner.id !== homeTeam.id;
            return (
              <TeamBadge
                key={slotId}
                team={homeTeam}
                cx={slot.position.x}
                cy={slot.position.y}
                radius={BADGE_RADIUS}
                isHighlighted={highlightedIds.has(slotId)}
                isEliminated={eliminated}
                onHover={(entering) => onHoverTeam(slotId, entering)}
              />
            );
          })()}
        {awayTeam &&
          (() => {
            const slotId = `team-${awayTeam.id}`;
            const slot = teamSlots.get(slotId);
            if (!slot) return null;
            const eliminated =
              matchNode.winner !== null && matchNode.winner.id !== awayTeam.id;
            return (
              <TeamBadge
                key={slotId}
                team={awayTeam}
                cx={slot.position.x}
                cy={slot.position.y}
                radius={BADGE_RADIUS}
                isHighlighted={highlightedIds.has(slotId)}
                isEliminated={eliminated}
                onHover={(entering) => onHoverTeam(slotId, entering)}
              />
            );
          })()}
      </g>
    );
  }

  // Inner node: small dot (or winner badge at final)
  const isFinal = matchNode.round === "final";
  const dotColor = isHighlighted
    ? "rgba(255,200,50,0.9)"
    : "rgba(255,255,255,0.35)";

  return (
    <g
      onMouseEnter={() => onHoverMatch(layoutNode.matchId, true)}
      onMouseLeave={() => onHoverMatch(layoutNode.matchId, false)}
      style={{ cursor: "pointer" }}
    >
      {matchNode.winner ? (
        <TeamBadge
          team={matchNode.winner}
          cx={position.x}
          cy={position.y}
          radius={isFinal ? BADGE_RADIUS : INNER_BADGE_RADIUS} // smaller at inner rings
          isHighlighted={isHighlighted}
          onHover={(entering) => onHoverMatch(layoutNode.matchId, entering)}
        />
      ) : (
        <circle
          cx={position.x}
          cy={position.y}
          r={5}
          fill="#1c1c1c"
          stroke={dotColor}
          strokeWidth={isHighlighted ? 2 : 1}
          filter={isHighlighted ? "url(#glow)" : undefined}
        />
      )}
    </g>
  );
}

export { BADGE_RADIUS };
