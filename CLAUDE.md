# World Cup Bracket Visualizer

A radial, interactive World Cup bracket rendered in React + SVG. Teams are positioned around a circle, with match connectors radiating inward toward a central trophy. No D3 or external layout libraries — all coordinate math is hand-rolled.

## Stack

- **React** (functional components + hooks)
- **SVG** (rendered inline, no canvas)
- **TypeScript**
- **Vite** (dev server + build)
- **CSS Modules** (scoped styles per component)
- No D3, no animation libraries, no UI component libraries

## Project Structure

```
src/
  data/
    fetchWorldCup.ts    # Fetches + transforms live openfootball/worldcup.json data (source of truth)
  types/
    index.ts            # Team, MatchNode, Round types
  layout/
    polar.ts            # polarToCartesian(), assignAngles(), buildLayout()
    constants.ts        # RADII per round, TOTAL_TEAMS, CENTER_X/Y, SVG_SIZE
    match.ts            # ROUND_LABEL, resolveTeam(), formatScore() — shared by Bracket/MatchPanel/MatchListPanel
  components/
    Bracket/
      Bracket.tsx       # Root SVG container, renders all layers
      Bracket.module.css
    MatchNode/
      MatchNode.tsx     # Renders one match dot + winner badge
      MatchNode.module.css
    TeamBadge/
      TeamBadge.tsx     # Circular badge (img or fallback initials)
      TeamBadge.module.css
    Connector/
      Connector.tsx     # SVG <path> cubic bezier between two nodes
      Connector.module.css
    Trophy/
      Trophy.tsx        # Central trophy image at (CENTER_X, CENTER_Y)
    MatchListPanel/
      MatchListPanel.tsx # Side panel: round tabs + full match list per round
      MatchListPanel.module.css
  hooks/
    useHoveredMatch.ts  # Track which match is hovered (for highlight)
    useBracketLayout.ts # Memoized layout computation from bracket data
    useWorldCupData.ts  # Fetches live data on mount; loading/error/ready state
  App.tsx
  main.tsx
```

## Core Types

```ts
// types/index.ts

export type Team = {
  id: string;
  name: string;
  shortName: string; // e.g. "FRA", "BRA" — used in fallback badge
  badgeUrl: string;
  flagEmoji?: string;
};

export type Round =
  | "final"
  | "semi"
  | "quarter"
  | "round16"
  | "round32"
  | "round48"; // for 48-team editions

export type Score = {
  home: number;
  away: number;
  extraTime?: boolean;
  homePens?: number;
  awayPens?: number;
};

export type MatchNode = {
  id: string;
  round: Round;
  home: MatchNode | Team; // recursive: prior match, or a seeded team
  away: MatchNode | Team;
  winner: Team | null; // null = TBD
  score?: Score;        // undefined = not yet played
};
```

## Layout System

All positioning lives in `src/layout/`. Nothing else should do coordinate math.

```ts
// layout/constants.ts
export const SVG_SIZE = 900;
export const CENTER = { x: 450, y: 450 };

export const RADII: Record<Round, number> = {
  final: 0,
  semi: 90,
  quarter: 175,
  round16: 260,
  round32: 355,
  round48: 440, // outer ring for 48-team bracket
};

export const BADGE_RADIUS = 22; // px, size of each team circle
```

```ts
// layout/polar.ts

/** Convert polar (angle in degrees, radius) → SVG x/y */
export function polarToCartesian(
  angleDeg: number,
  radius: number,
  cx = CENTER.x,
  cy = CENTER.y,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export type LayoutNode = {
  matchId: string;
  round: Round;
  angle: number; // degrees, 0–360
  position: { x: number; y: number };
  team: Team | null; // winner badge drawn here; null = TBD
  children: [string, string] | null; // child matchIds, or null if leaf
};

/** Walk the bracket tree, assign angles evenly, return flat map of all nodes */
export function buildLayout(root: MatchNode): Map<string, LayoutNode>;
```

**Rule:** angles are distributed evenly among leaf slots first, then parent angles are the midpoint of their two children's angles. This keeps the bracket symmetric.

## Connector Rendering

Each `<Connector>` draws a cubic bezier from a child node to its parent:

```ts
// Connector.tsx
function cubicArc(from: Point, to: Point): string {
  // control points pulled toward center — creates the inward curve
  const ctrl1 = lerp(from, CENTER, 0.4);
  const ctrl2 = lerp(to, CENTER, 0.4);
  return `M ${from.x} ${from.y} C ${ctrl1.x} ${ctrl1.y} ${ctrl2.x} ${ctrl2.y} ${to.x} ${to.y}`;
}
```

Connectors are rendered **before** badges (lower z-order in SVG).

## Data Source

There is no static bracket data file. All team, stadium, and match data is fetched live on app load from [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)'s 2026 dataset:

- `worldcup.teams.json` — 48 teams (name, group, confederation, flag emoji, fifa_code)
- `worldcup.stadiums.json` — stadium name/city, joined onto matches via `ground` (city) for `MatchNode.venue`
- `worldcup.json` — **the source of truth.** All 104 matches (group stage + knockout). This is the only one that changes over time and is always re-fetched fresh, never cached statically. Knockout matches not yet decided reference future results as `"W74"`/`"L101"` (winner/loser of match `num` 74/101) instead of a team name.

`src/data/fetchWorldCup.ts` exports `fetchWorldCupData()`, which fetches all three URLs in parallel and transforms the flat match list into the existing `MatchNode` tree shape by recursively resolving `team1`/`team2` strings — walking to the referenced match `num` when a `W`/`L` placeholder is found, building each match once (memoized by `num`), and reusing those same `MatchNode` objects in both the radial bracket tree and the per-round match list. Group-stage matches (`Matchday 1`–`17`) and the third-place match are not part of the rendered tree — only `Round of 32` through `Final` form the bracket.

```ts
// data/fetchWorldCup.ts
export async function fetchWorldCupData(): Promise<{
  bracket: MatchNode;                          // root = the Final, source of truth for the radial bracket
  teams: Record<string, Team>;                 // keyed by fifa_code
  matchesByRound: Record<Round, MatchNode[]>;  // for MatchListPanel's round tabs
}>;
```

`useWorldCupData()` (in `src/hooks/`) wraps this in a `loading` / `error` / `ready` state, fetched once on mount — no polling, no caching layer. To see updated results, reload the page.

## Rendering Layers (SVG draw order)

1. **Connectors** — all `<path>` elements (bottom layer)
2. **Match dots** — small circles at each inner node (semi, quarter, etc.)
3. **Team badges** — circular images at leaf nodes (outermost ring)
4. **Winner badges** — slightly larger, glowing ring, at the node the team advanced to
5. **Trophy** — `<image>` centered at (450, 450) (top layer)

## Interaction

- **Hover a team badge** → highlight that team's entire path to the center
- **Hover a match node** → show tooltip with matchup (home vs away)
- **Click a match** → (optional) open a detail panel with score, date, venue

Highlight state lives in `useHoveredMatch`. Connector and badge components read `isHighlighted` prop and apply a CSS class for the glow effect.

## Styling Rules

- Dark background: `#0d0d0d`
- Connector default: `rgba(255,255,255,0.15)`, `strokeWidth: 1.5`
- Connector highlighted: `rgba(255,200,50,0.8)`, `strokeWidth: 2.5`
- Badge border default: `rgba(255,255,255,0.2)`
- Badge border highlighted: `#f5c518` (gold)
- Trophy glow: radial gradient, `rgba(255,180,0,0.3)` → transparent
- Font: system-ui or Inter, white, small (11–13px for labels)

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # Production build → dist/
npm run typecheck # tsc --noEmit
npm run lint      # eslint src/
```

## Key Constraints

- **No D3.** All layout math is in `src/layout/`. If you need a utility (lerp, clamp, degreesToRad), add it to `layout/polar.ts`.
- **SVG only, no Canvas.** All rendering is declarative React/SVG.
- **Data is separate from layout.** `fetchWorldCup.ts` builds the `MatchNode` tree; `buildLayout()` computes positions. Never hardcode coordinates or bracket results.
- **`buildLayout()` is pure.** It takes a `MatchNode` tree and returns a flat `Map`. No side effects, fully memoizable.
- **No static bracket data file.** Do not reintroduce a hardcoded `bracket.ts`/`teams.ts` — `worldcup.json` is the single source of truth and must always be fetched fresh.
- **Badge images go in `public/flags/`** as SVGs named by ISO 3166-1 alpha-2 country code (e.g. `fr.svg`), derived from each team's `flag_unicode` in `worldcup.teams.json`. If a badge 404s, `<TeamBadge>` falls back to a colored circle with the team's `shortName` — expected for teams without a local flag SVG yet.
- **48-team support is opt-in.** The `Round` type includes `"round48"` and `RADII` has an entry for it, but the rendered bracket only covers the 32-team knockout stage (`round32` through `final`); the 48-team group stage feeds into it but isn't part of the radial tree.
