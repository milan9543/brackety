import type { MatchNode, Team } from "../types";
import { CENTER, TEAM_RADIUS, RADII } from "./constants";

export type Point = { x: number; y: number };

export function polarToCartesian(
  angleDeg: number,
  radius: number,
  cx = CENTER.x,
  cy = CENTER.y,
): Point {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

export function isTeam(node: MatchNode | Team): node is Team {
  return !("round" in node);
}

export type FlagEntry = {
  teamId: string;
  team: Team;
  position: Point;
  angle: number;
  isHighlighted: boolean;
  isEliminated: boolean;
  match: MatchNode; // the match this team feeds into
};

export type MatchEntry = {
  matchId: string;
  match: MatchNode;
  // the match played at the ring where this badge is drawn
  matchAtRing: MatchNode;
  // winner or null (TBD)
  winner: Team | null;
  position: Point;
  angle: number;
  // depth from root (0 = final, 1 = semi, 2 = quarter, 3 = r16, 4 = r32)
  depth: number;
};

export type Edge = {
  edgeId: string;
  arc: { radius: number; fromDegree: number; toDegree: number };
  spoke: { degree: number; fromRadius: number; toRadius: number };
};

export type ChampionEntry = {
  team: Team;
  // finalist position the champion advanced from (start of the connector line)
  fromPosition: Point;
  // fixed display position above the trophy
  position: Point;
};

export type BracketLayout = {
  flags: FlagEntry[];
  matches: MatchEntry[];
  edges: Edge[];
  // maps teamId → edge IDs on that team's path from leaf to center
  teamEdgeIds: Map<string, Set<string>>;
  // edge IDs where the winner has actually advanced (result confirmed)
  advancedEdgeIds: Set<string>;
  champion: ChampionEntry | null;
};

const ROUND_TO_DEPTH: Record<string, number> = {
  final: 0,
  semi: 1,
  quarter: 2,
  round16: 3,
  round32: 4,
  round48: 5,
};

/**
 * Recursively walk the tree. Leaf teams get evenly-spaced angles within their
 * half. Each match node's angle is the midpoint of its two children's angles.
 * Returns flat lists of flags (outer ring) and match nodes (inner rings).
 */
export function buildLayout(root: MatchNode): BracketLayout {
  const flags: FlagEntry[] = [];
  const matches: MatchEntry[] = [];
  const edges: Edge[] = [];
  const eliminatedTeamIds = new Set<string>();
  const teamEdgeIds = new Map<string, Set<string>>();
  const advancedEdgeIds = new Set<string>();

  function addEdgeToSubtree(node: MatchNode | Team, edgeId: string) {
    if (isTeam(node)) {
      if (!teamEdgeIds.has(node.id)) teamEdgeIds.set(node.id, new Set());
      teamEdgeIds.get(node.id)!.add(edgeId);
      return;
    }
    addEdgeToSubtree(node.home, edgeId);
    addEdgeToSubtree(node.away, edgeId);
  }

  // Returns the angle and radius assigned to this node (team → its slot, match → midpoint)
  function walk(
    node: MatchNode | Team,
    startDeg: number,
    endDeg: number,
    totalLeaves: number,
    parentMatch: MatchNode | null,
  ): { angle: number; radius: number } {
    if (isTeam(node)) {
      // leaf: place at midpoint of its slot
      const angle = (startDeg + endDeg) / 2;
      flags.push({
        teamId: node.id,
        team: node,
        position: polarToCartesian(angle, TEAM_RADIUS),
        angle,
        isHighlighted: false,
        isEliminated: false,
        match: parentMatch!,
      });
      return { angle, radius: TEAM_RADIUS };
    }

    // split the arc proportionally by leaf count
    const homeLeafCount = countLeaves(node.home);
    const awayLeafCount = countLeaves(node.away);
    const total = homeLeafCount + awayLeafCount;
    const mid = startDeg + (homeLeafCount / total) * (endDeg - startDeg);

    const home = walk(node.home, startDeg, mid, totalLeaves, node);
    const away = walk(node.away, mid, endDeg, totalLeaves, node);

    if (node.winner) {
      const winnerInHome = isTeamInSubtree(node.home, node.winner.id);
      const loser = winnerInHome ? node.away : node.home;
      collectLeafTeamIds(loser, eliminatedTeamIds);
    }

    const angle = (home.angle + away.angle) / 2;
    const depth = ROUND_TO_DEPTH[node.round] ?? 4;
    // winner of this match advances to the next inward ring; all rings are
    // evenly spaced (RADII), so the semi-final ring (radius 100) is the
    // first ring out from center.
    const radius = RADII[depth - 1] ?? RADII[0];

    matches.push({
      matchId: node.id,
      match: node,
      matchAtRing: parentMatch ?? node,
      winner: node.winner,
      position: polarToCartesian(angle, radius),
      angle,
      depth,
    });

    edges.push(
      makeEdge(`${node.id}-home`, home.angle, home.radius, angle, radius),
      makeEdge(`${node.id}-away`, away.angle, away.radius, angle, radius),
    );
    addEdgeToSubtree(node.home, `${node.id}-home`);
    addEdgeToSubtree(node.away, `${node.id}-away`);

    if (node.winner) {
      const winnerInHome = isTeamInSubtree(node.home, node.winner.id);
      advancedEdgeIds.add(winnerInHome ? `${node.id}-home` : `${node.id}-away`);
    }

    return { angle, radius };
  }

  const homeLeafCount = countLeaves(root.home);
  const awayLeafCount = countLeaves(root.away);
  const totalLeaves = homeLeafCount + awayLeafCount;

  // home half: left (180°–360°), away half: right (0°–180°)
  const home = walk(root.home, 180, 360, totalLeaves, root);
  const away = walk(root.away, 0, 180, totalLeaves, root);

  // root (final) has no ring of its own — both finalists are already drawn
  // by the semi-final entries above (their winner badge sits at the finalist
  // slot, RADII[1]/2, on their own home/away side). The trophy occupies dead
  // center, so the final match node itself gets no badge.
  const finalAngle = (home.angle + away.angle) / 2;
  matches.push({
    matchId: root.id,
    match: root,
    matchAtRing: root,
    winner: root.winner,
    position: CENTER,
    angle: finalAngle,
    depth: 0,
  });

  // The final pairing is shown as an arc between the two finalist positions,
  // meeting at their angular midpoint; no radial spoke down to center, since
  // no badge sits there (trophy occupies it).
  edges.push(
    makeEdge(`${root.id}-home`, home.angle, home.radius, finalAngle, home.radius),
    makeEdge(`${root.id}-away`, away.angle, away.radius, finalAngle, away.radius),
  );
  addEdgeToSubtree(root.home, `${root.id}-home`);
  addEdgeToSubtree(root.away, `${root.id}-away`);

  let champion: ChampionEntry | null = null;
  if (root.winner) {
    const winnerInHome = isTeamInSubtree(root.home, root.winner.id);
    collectLeafTeamIds(winnerInHome ? root.away : root.home, eliminatedTeamIds);
    advancedEdgeIds.add(winnerInHome ? `${root.id}-home` : `${root.id}-away`);

    // champion badge sits straight up (12 o'clock), between the semi-final
    // ring and the quarter-final ring, closer to center
    champion = {
      team: root.winner,
      fromPosition: CENTER,
      position: polarToCartesian(0, RADII[1] + (RADII[2] - RADII[1]) * 0.3),
    };
  }

  for (const flag of flags) {
    flag.isEliminated = eliminatedTeamIds.has(flag.teamId);
  }

  return { flags, matches, edges, teamEdgeIds, advancedEdgeIds, champion };
}

function isTeamInSubtree(node: MatchNode | Team, teamId: string): boolean {
  if (isTeam(node)) return node.id === teamId;
  return (
    isTeamInSubtree(node.home, teamId) || isTeamInSubtree(node.away, teamId)
  );
}

function collectLeafTeamIds(node: MatchNode | Team, into: Set<string>): void {
  if (isTeam(node)) {
    into.add(node.id);
    return;
  }
  collectLeafTeamIds(node.home, into);
  collectLeafTeamIds(node.away, into);
}

/**
 * Builds an "elbow" connector: an axial arc at the child's radius sweeping
 * from the child's angle to the parent's angle, then a radial segment at the
 * parent's angle running from the child's radius in to the parent's radius.
 */
function makeEdge(
  edgeId: string,
  childAngle: number,
  childRadius: number,
  parentAngle: number,
  parentRadius: number,
): Edge {
  // AxialLine always sweeps clockwise from fromDegree to toDegree, so order
  // the two angles to take the short way around rather than the long way.
  const delta = (((parentAngle - childAngle) % 360) + 360) % 360;
  const [fromDegree, toDegree] =
    delta <= 180 ? [childAngle, parentAngle] : [parentAngle, childAngle];

  return {
    edgeId,
    arc: { radius: childRadius, fromDegree, toDegree },
    spoke: { degree: parentAngle, fromRadius: childRadius, toRadius: parentRadius },
  };
}

function countLeaves(node: MatchNode | Team): number {
  if (isTeam(node)) return 1;
  return countLeaves(node.home) + countLeaves(node.away);
}
