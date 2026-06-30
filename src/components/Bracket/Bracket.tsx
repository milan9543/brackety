import { useState } from "react";
import type { MatchNode } from "../../types";
import {
  SVG_SIZE,
  BADGE_RADIUS,
} from "../../layout/constants";
import { useBracketLayout } from "../../hooks/useBracketLayout";
import { TeamBadge } from "../TeamBadge/TeamBadge";
import { Connector } from "../Connector/Connector";

type Props = {
  bracket: MatchNode;
  onSelectMatch: (match: MatchNode) => void;
};

export function Bracket({ bracket, onSelectMatch }: Props) {
  const layout = useBracketLayout(bracket);
  const { flags, matches, edges, teamEdgeIds, advancedEdgeIds } = layout;
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const eliminatedTeamIds = new Set(
    flags.filter((f) => f.isEliminated).map((f) => f.teamId),
  );
  const hoveredIsEliminated =
    hoveredTeamId !== null && eliminatedTeamIds.has(hoveredTeamId);

  const cx = SVG_SIZE / 2;
  const cy = SVG_SIZE / 2;

  return (
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-225 md:w-225"
        style={{ display: "block" }}
      >
        <defs>
          <radialGradient id="trophy-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(240,185,40,0.22)" />
            <stop offset="55%" stopColor="rgba(220,140,20,0.08)" />
            <stop offset="100%" stopColor="rgba(200,100,0,0)" />
          </radialGradient>
          <radialGradient id="trophy-shadow" cx="50%" cy="20%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        <ellipse cx={cx} cy={cy} rx={110} ry={110} fill="url(#trophy-glow)" />

        {/* Connectors: drawn first so badges layer on top */}
        {edges.map((edge) => (
          <Connector
            key={edge.edgeId}
            edge={edge}
            isAdvanced={advancedEdgeIds.has(edge.edgeId)}
            isHighlighted={
              !hoveredIsEliminated &&
              hoveredTeamId !== null &&
              (teamEdgeIds.get(hoveredTeamId)?.has(edge.edgeId) ?? false)
            }
          />
        ))}

        {/* Outer ring: one flag per team */}
        {flags.map((flag) => (
          <TeamBadge
            key={flag.teamId}
            team={flag.team}
            cx={flag.position.x}
            cy={flag.position.y}
            radius={BADGE_RADIUS}
            angle={flag.angle}
            isHighlighted={!hoveredIsEliminated && hoveredTeamId === flag.teamId}
            isEliminated={flag.isEliminated}
            onHover={(entering) =>
              setHoveredTeamId(entering ? flag.teamId : null)
            }
            onClick={() => onSelectMatch(flag.match)}
          />
        ))}

        {/* Inner rings: winner badge (or TBD dot) at each match node */}
        {matches.filter((e) => e.matchId !== "final").map((entry) => {
          const { x, y } = entry.position;
          if (entry.winner) {
            return (
              <TeamBadge
                key={entry.matchId}
                team={entry.winner}
                cx={x}
                cy={y}
                radius={BADGE_RADIUS}
                isHighlighted={
                  !hoveredIsEliminated && hoveredTeamId === entry.winner.id
                }
                isEliminated={eliminatedTeamIds.has(entry.winner.id)}
                onHover={(entering) =>
                  setHoveredTeamId(entering ? entry.winner!.id : null)
                }
                onClick={() => onSelectMatch(entry.matchAtRing)}
              />
            );
          }
          return (
            <circle key={entry.matchId} cx={x} cy={y} r={4} fill="#4d4d4d" />
          );
        })}

        {/* Trophy — behind winner flag */}
        <ellipse
          cx={cx}
          cy={cy + 72}
          rx={38}
          ry={10}
          fill="url(#trophy-shadow)"
        />
        <image
          href={`${import.meta.env.BASE_URL}trophy.webp`}
          x={cx - 80}
          y={cy - 80}
          width={160}
          height={160}
          preserveAspectRatio="xMidYMid meet"
          style={{ pointerEvents: "none" }}
        />

        {/* Final winner badge — on top of trophy */}
        {matches.filter((e) => e.matchId === "final").map((entry) => {
          if (!entry.winner) return null;
          return (
            <TeamBadge
              key={entry.matchId}
              team={entry.winner}
              cx={entry.position.x}
              cy={entry.position.y}
              radius={BADGE_RADIUS}
              isHighlighted={
                !hoveredIsEliminated && hoveredTeamId === entry.winner.id
              }
              isEliminated={false}
              onHover={(entering) =>
                setHoveredTeamId(entering ? entry.winner!.id : null)
              }
              onClick={() => onSelectMatch(entry.matchAtRing)}
            />
          );
        })}

      </svg>
  );
}
