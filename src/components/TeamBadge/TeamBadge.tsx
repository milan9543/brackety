import { useState, useEffect, useRef } from "react";
import type { Team } from "../../types";
import { BADGE_RADIUS } from "../../layout/constants";

type Props = {
  team: Team;
  cx: number;
  cy: number;
  radius?: number;
  isHighlighted: boolean;
  isEliminated?: boolean;
  /** Polar angle (degrees) of this badge — used to orient the name label */
  angle?: number;
  onHover: (entering: boolean) => void;
  onClick?: () => void;
};

export function TeamBadge({
  team,
  cx,
  cy,
  radius = BADGE_RADIUS,
  isHighlighted,
  isEliminated = false,
  angle,
  onHover,
  onClick,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const imageRef = useRef<SVGImageElement>(null);
  const clipId = `clip-${team.id}-${cx.toFixed(0)}-${cy.toFixed(0)}`;
  const filterId = `filter-${team.id}-${cx.toFixed(0)}-${cy.toFixed(0)}`;

  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;
    const handler = () => setImgError(true);
    el.addEventListener("error", handler);
    return () => el.removeEventListener("error", handler);
  }, []);

  const strokeColor = isHighlighted
    ? "#f5c518"
    : isEliminated
      ? "rgba(255,255,255,0.08)"
      : "rgba(255,255,255,0.2)";
  const strokeWidth = isHighlighted ? 2.5 : 1.5;

  return (
    <g
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      transform={`translate(${cx} ${cy}) scale(${isHighlighted ? 1.1 : 1}) translate(${-cx} ${-cy})`}
      style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={radius} />
        </clipPath>
        {isEliminated && (
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feColorMatrix type="saturate" values="0" result="gray" />
            <feComponentTransfer in="gray">
              <feFuncR type="linear" slope="0.5" />
              <feFuncG type="linear" slope="0.5" />
              <feFuncB type="linear" slope="0.5" />
            </feComponentTransfer>
          </filter>
        )}
      </defs>

      {imgError ? (
        <>
          <circle cx={cx} cy={cy} r={radius} fill="#1a1a2e" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill={isEliminated ? "rgba(255,255,255,0.5)" : "white"}
            fontSize={radius * 0.55}
            fontFamily="system-ui, sans-serif"
            fontWeight="600"
          >
            {team.shortName}
          </text>
        </>
      ) : (
        <image
          ref={imageRef}
          href={team.badgeUrl}
          x={cx - radius}
          y={cy - radius}
          width={radius * 2}
          height={radius * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
          onError={() => setImgError(true)}
          filter={isEliminated ? `url(#${filterId})` : undefined}
        />
      )}

      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {angle !== undefined && isHighlighted && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill={
            isEliminated
              ? "rgba(255,255,255,0.25)"
              : isHighlighted
                ? "#f5c518"
                : "rgba(255,255,255,0.7)"
          }
          fontSize={9}
          fontFamily="system-ui, sans-serif"
          fontWeight="500"
          letterSpacing="0.04em"
          style={{ pointerEvents: "none", userSelect: "none" }}
          transform={(() => {
            const labelRadius = radius + 22;
            const rad = ((angle - 90) * Math.PI) / 180;
            const lx = cx + labelRadius * Math.cos(rad);
            const ly = cy + labelRadius * Math.sin(rad);
            return `translate(${lx - cx}, ${ly - cy})`;
          })()}
        >
          {team.shortName}
        </text>
      )}
    </g>
  );
}
