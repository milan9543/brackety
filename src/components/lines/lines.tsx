// ─── pure geometry ────────────────────────────────────────────────────────────

import { polarToCartesian } from "../../layout/polar";

/**
 * Returns the four SVG coordinates for a straight line drawn at a fixed angle,
 * moving between two radii (inward or outward).
 *
 *   degree      — the angle (0 = 12 o'clock, clockwise)
 *   fromRadius  — starting distance from centre
 *   toRadius    — ending distance from centre
 */
export function radialSegment(
  degree: number,
  fromRadius: number,
  toRadius: number,
) {
  const p1 = polarToCartesian(degree, fromRadius);
  const p2 = polarToCartesian(degree, toRadius);
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

/**
 * Returns an SVG path string for an arc drawn at a fixed radius,
 * sweeping clockwise from one angle to another.
 *
 *   radius      — distance from centre (constant along the arc)
 *   fromDegree  — starting angle
 *   toDegree    — ending angle (clockwise from fromDegree)
 */
export function axialArcPath(
  radius: number,
  fromDegree: number,
  toDegree: number,
): string {
  const p1 = polarToCartesian(fromDegree, radius);
  const p2 = polarToCartesian(toDegree, radius);

  // Normalize delta to [0, 360) so the arc always sweeps clockwise
  const delta = (((toDegree - fromDegree) % 360) + 360) % 360;
  const largeArcFlag = delta > 180 ? 1 : 0;
  const sweepFlag = 1; // 1 = clockwise, matches our angle convention

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${p2.x} ${p2.y}`,
  ].join(" ");
}

// ─── shared stroke props ──────────────────────────────────────────────────────

type StrokeProps = {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
};

const DEFAULT_STROKE = "rgba(255,255,255)";
const DEFAULT_WIDTH = 1.5;

// ─── React components ─────────────────────────────────────────────────────────

type RadialLineProps = StrokeProps & {
  degree: number;
  fromRadius: number;
  toRadius: number;
};

/**
 * Renders a straight SVG <line> along a fixed angle between two radii.
 *
 * <RadialLine degree={45} fromRadius={TEAM_RADIUS} toRadius={RADII.round32} />
 */
export function RadialLine({
  degree,
  fromRadius,
  toRadius,
  stroke = DEFAULT_STROKE,
  strokeWidth = DEFAULT_WIDTH,
  strokeDasharray,
  opacity,
}: RadialLineProps) {
  const { x1, y1, x2, y2 } = radialSegment(degree, fromRadius, toRadius);
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      opacity={opacity}
      fill="none"
    />
  );
}

type AxialLineProps = StrokeProps & {
  radius: number;
  fromDegree: number;
  toDegree: number;
};

/**
 * Renders an SVG <path> arc at a fixed radius, sweeping clockwise.
 *
 * <AxialLine radius={RADII.round32} fromDegree={10} toDegree={45} />
 */
export function AxialLine({
  radius,
  fromDegree,
  toDegree,
  stroke = DEFAULT_STROKE,
  strokeWidth = DEFAULT_WIDTH,
  strokeDasharray,
  opacity,
}: AxialLineProps) {
  const d = axialArcPath(radius, fromDegree, toDegree);
  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      opacity={opacity}
      fill="none"
    />
  );
}
