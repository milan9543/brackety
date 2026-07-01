import { useState } from "react";
import type { MatchNode } from "../../types";
import { SVG_SIZE, BADGE_RADIUS } from "../../layout/constants";
import { useBracketLayout } from "../../hooks/useBracketLayout";
import { TeamBadge } from "../TeamBadge/TeamBadge";
import { Connector } from "../Connector/Connector";

type Props = {
  bracket: MatchNode;
  onSelectMatch: (match: MatchNode) => void;
};

export function Bracket({ bracket, onSelectMatch }: Props) {
  const layout = useBracketLayout(bracket);
  const { flags, matches, edges, teamEdgeIds, advancedEdgeIds, champion } =
    layout;
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const eliminatedTeamIds = new Set(
    flags.filter((f) => f.isEliminated).map((f) => f.teamId),
  );
  // once a champion is decided, they stay highlighted permanently and hover
  // no longer changes the highlight
  const activeTeamId = champion ? champion.team.id : hoveredTeamId;
  const handleHover = champion
    ? () => {}
    : (entering: boolean, teamId: string) =>
        setHoveredTeamId(entering ? teamId : null);
  const hoveredIsEliminated =
    activeTeamId !== null && eliminatedTeamIds.has(activeTeamId);

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
            activeTeamId !== null &&
            (teamEdgeIds.get(activeTeamId)?.has(edge.edgeId) ?? false)
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
          isHighlighted={!hoveredIsEliminated && activeTeamId === flag.teamId}
          isEliminated={flag.isEliminated}
          onHover={(entering) => handleHover(entering, flag.teamId)}
          onClick={() => onSelectMatch(flag.match)}
        />
      ))}

      {/* Inner rings: winner badge (or TBD dot) at each match node */}
      {matches
        .filter((e) => e.matchId !== "final")
        .map((entry) => {
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
                  !hoveredIsEliminated && activeTeamId === entry.winner.id
                }
                isEliminated={eliminatedTeamIds.has(entry.winner.id)}
                onHover={(entering) => handleHover(entering, entry.winner!.id)}
                onClick={() => onSelectMatch(entry.matchAtRing)}
              />
            );
          }
          return (
            <circle key={entry.matchId} cx={x} cy={y} r={4} fill="#4d4d4d" />
          );
        })}

      {/* Connector from center to the champion badge, drawn under the trophy */}
      {champion && (
        <line
          x1={champion.fromPosition.x}
          y1={champion.fromPosition.y}
          x2={champion.position.x}
          y2={champion.position.y}
          stroke="rgba(255,200,50,0.8)"
          strokeWidth={2}
        />
      )}

      {/* Trophy — behind winner flag */}
      <ellipse
        cx={cx}
        cy={cy + 105}
        rx={60}
        ry={20}
        fill="url(#trophy-shadow)"
      />
      <image
        href={`${import.meta.env.BASE_URL}trophy.webp`}
        x={cx - 115}
        y={cy - 115}
        width={230}
        height={230}
        preserveAspectRatio="xMidYMid meet"
        style={{ pointerEvents: "none" }}
      />

      {champion && (
        <g>
          <TeamBadge
            team={champion.team}
            cx={champion.position.x}
            cy={champion.position.y}
            radius={BADGE_RADIUS * 1.8}
            isHighlighted
            isEliminated={false}
            onHover={() => {}}
          />
          <text
            x={champion.position.x}
            y={champion.position.y - BADGE_RADIUS * 1.8 - 36}
            textAnchor="middle"
            fill="#f5c518"
            fontSize={12}
            fontFamily="system-ui, sans-serif"
            fontWeight="700"
            letterSpacing="0.08em"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            WINNER
          </text>
          <text
            x={champion.position.x}
            y={champion.position.y - BADGE_RADIUS * 1.8 - 22}
            textAnchor="middle"
            fill="white"
            fontSize={13}
            fontFamily="system-ui, sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {champion.team.name}
          </text>
        </g>
      )}
    </svg>
  );
}
