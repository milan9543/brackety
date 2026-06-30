# World Cup Bracket Visualizer — Implementation Plan

## Project State

What exists: `src/types/index.ts`, `src/data/teams.ts`, `src/data/bracket.ts`, `flags/*.svg` (32 files). No `package.json`, no Vite config, no scaffold whatsoever.

The bracket is a perfectly balanced binary tree of 5 levels: 16 round32 matches → 8 round16 → 4 quarter → 2 semi → 1 final. The 16 round32 MatchNodes are the leaf nodes of the layout graph (their `home` and `away` children are Teams, not MatchNodes). This yields **31 MatchNodes** in the layout map.

---

## Phase 1 — Vite Project Scaffold

**Goal:** Runnable shell with hot reload before any real code.

**Files to create:**

`package.json`
```json
{
  "name": "brackety",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "eslint": "^9.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

- `vite.config.ts` — minimal React + TS config
- `tsconfig.json` — target ES2020, `jsx: "react-jsx"`, strict mode, `moduleResolution: bundler`
- `index.html` — Vite entry HTML pointing at `src/main.tsx`
- `src/main.tsx` — `ReactDOM.createRoot(...).render(<App />)`
- `src/App.tsx` — placeholder initially; updated in Phase 5

**Asset path:** The `flags/` folder needs to be served at `/flags/*.svg` to match `badgeUrl` in `teams.ts`. Move or copy `flags/` into `public/flags/`.

---

## Phase 2 — Layout Layer

**Goal:** Pure math module. No React, no rendering. Fully unit-testable in isolation.

### 2a — `src/layout/constants.ts`

```ts
export const SVG_SIZE = 900;
export const CENTER = { x: 450, y: 450 };
export const RADII: Record<Round, number> = {
  final: 0, semi: 90, quarter: 175, round16: 260, round32: 355, round48: 440,
};
export const BADGE_RADIUS = 22;
export const INNER_BADGE_RADIUS = 16;
```

### 2b — `src/layout/polar.ts`

Implement in this order:

**`polarToCartesian(angleDeg, radius, cx?, cy?)`** — the `-90` offset makes 0° point upward (12-o'clock).

**`lerp(a: Point, b: Point, t: number): Point`** — linear interpolation helper used by `Connector`.

**Type guard:**
```ts
export function isTeam(node: MatchNode | Team): node is Team {
  return !('round' in node);
}
```

**`BracketLayout` return type:**
```ts
export type TeamSlot = {
  teamId: string;
  angle: number;
  position: { x: number; y: number };
  matchId: string;  // which r32 match this team belongs to
};

export type BracketLayout = {
  nodes: Map<string, LayoutNode>;
  teamSlots: Map<string, TeamSlot>;  // key: "team-MEX", etc.
  parentMap: Map<string, string>;    // childMatchId → parentMatchId
};
```

**`buildLayout(root: MatchNode): BracketLayout`**

Algorithm — recursive DFS with angle slices:

```
walk(node, startAngle, endAngle, parentId):
  midAngle = (startAngle + endAngle) / 2
  position = polarToCartesian(midAngle, RADII[node.round])

  if isTeam(node.home) && isTeam(node.away):
    // r32 leaf: place two team badges within the slice
    homeAngle = startAngle + (endAngle - startAngle) * 0.25
    awayAngle = startAngle + (endAngle - startAngle) * 0.75
    teamSlots.set("team-" + node.home.id, { ..., angle: homeAngle })
    teamSlots.set("team-" + node.away.id, { ..., angle: awayAngle })
    nodes.set(node.id, { ..., children: null })
  else:
    walk(node.home, startAngle, midAngle, node.id)
    walk(node.away, midAngle, endAngle, node.id)
    nodes.set(node.id, { ..., children: [node.home.id, node.away.id] })

  if parentId: parentMap.set(node.id, parentId)

walk(root, 0, 360, null)
```

Each r32 node controls a 22.5° slice (360/16). Home badge sits at the first quarter-point, away at the third — so all 32 badges are spaced 11.25° apart.

**`getHighlightedIds(layout: BracketLayout, startId: string): Set<string>`**

Walk `parentMap` upward from `startId`, collecting match IDs, team slot IDs, and connector IDs (`"childId→parentId"` for each hop).

---

## Phase 3 — Hooks

### 3a — `src/hooks/useBracketLayout.ts`

```ts
export function useBracketLayout(bracket: MatchNode): BracketLayout {
  return useMemo(() => buildLayout(bracket), [bracket]);
}
```

### 3b — `src/hooks/useHoveredMatch.ts`

```ts
type HoverTarget =
  | { kind: 'team'; teamSlotId: string }
  | { kind: 'match'; matchId: string }
  | null;

export function useHoveredMatch(layout: BracketLayout) {
  const [hovered, setHovered] = useState<HoverTarget>(null);
  const highlightedIds = useMemo(() => {
    if (!hovered) return new Set<string>();
    const startId = hovered.kind === 'team' ? hovered.teamSlotId : hovered.matchId;
    return getHighlightedIds(layout, startId);
  }, [hovered, layout]);
  return { hovered, setHovered, highlightedIds };
}
```

**Tricky point:** `highlightedIds` must include match node IDs, team slot IDs, and connector IDs (`"r32-1→r16-1"` etc.) so each layer can check its own ID against the set.

---

## Phase 4 — Components

Build in dependency order: TeamBadge → MatchNode → Connector → Trophy → Bracket.

### 4a — `src/components/TeamBadge/TeamBadge.tsx`

Props: `team`, `cx`, `cy`, `radius` (default `BADGE_RADIUS`), `isHighlighted`, `onHover`.

Renders:
1. `<clipPath>` + `<circle>` for circular masking
2. `<image href={team.badgeUrl}>` clipped to circle
3. Stroke ring: default `rgba(255,255,255,0.2)`, highlighted `#f5c518`
4. Fallback: if image errors, render a colored `<circle>` + `<text>` with `shortName`

**Fallback approach:** maintain `imgError` state; attach `onError` to `<image>` (React 18 passes it through for SVG elements). If that doesn't work, use a `ref` + native event listener.

### 4b — `src/components/MatchNode/MatchNode.tsx`

Two rendering modes:

- **r32 leaf** (`children: null`) — render two `<TeamBadge>` at positions from `teamSlots`
- **Inner node** (r16/quarter/semi/final) — render a small `<circle>` dot; if `layoutNode.team` (winner) is set, render a `<TeamBadge>` at the same position with glow filter (`filter="url(#glow)"` — filter defined once in `Bracket.tsx` defs)

Props: `matchNode` (raw data), `layoutNode` (position), `teamSlots`, `isHighlighted`, `onHoverTeam`, `onHoverMatch`.

### 4c — `src/components/Connector/Connector.tsx`

Props: `from`, `to`, `connectorId`, `isHighlighted`.

```ts
function cubicArc(from: Point, to: Point): string {
  const ctrl1 = lerp(from, CENTER, 0.4);
  const ctrl2 = lerp(to, CENTER, 0.4);
  return `M ${from.x} ${from.y} C ${ctrl1.x} ${ctrl1.y} ${ctrl2.x} ${ctrl2.y} ${to.x} ${to.y}`;
}
```

Styles:
- Default: `stroke: rgba(255,255,255,0.15)`, `strokeWidth: 1.5`
- Highlighted: `stroke: rgba(255,200,50,0.8)`, `strokeWidth: 2.5`

**Z-order within connectors:** render non-highlighted first, highlighted on top — so highlighted paths are never buried under dimmed ones.

### 4d — `src/components/Trophy/Trophy.tsx`

Renders the radial glow gradient + trophy at `CENTER`. If no `public/trophy.svg` exists, render an inline SVG trophy polygon rather than taking an external asset dependency.

### 4e — `src/components/Bracket/Bracket.tsx`

Root SVG. Draw order:

```tsx
<svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 900 900">
  <defs>
    <filter id="glow">…</filter>
  </defs>
  <rect width={SVG_SIZE} height={SVG_SIZE} fill="#0d0d0d" />
  {/* 1. Connectors (non-highlighted first, then highlighted) */}
  {/* 2. Inner match dots / winner badges */}
  {/* 3. r32 team badges (outermost) */}
  {/* 4. Trophy (top layer) */}
</svg>
```

**Building connectors:** for each layout node with `children: [a, b]`, create two connectors: node→childA and node→childB.

**Separating layers:** `innerNodes = nodes filtered by round !== 'round32'`, `r32Nodes = nodes filtered by round === 'round32'`.

---

## Phase 5 — App and Global Styles

`src/App.tsx`:
```tsx
import { BRACKET } from './data/bracket';
export function App() {
  return <div className={styles.app}><Bracket bracket={BRACKET} /></div>;
}
```

`src/App.module.css` — `background: #0d0d0d`, center SVG, `min-height: 100vh`.

`src/index.css` — box-sizing reset, `body { margin: 0 }`.

---

## Phase 6 — Tooltip (Enhancement)

On match hover, show "MEX vs ZAF" tooltip. Render as a `<div>` portal into `document.body`, positioned via `onMouseMove` coordinates tracked on the SVG root. Avoids SVG text clipping issues.

---

## Phase 7 — Click Detail Panel (Enhancement)

On match click, open a panel with score, date, venue. Requires extending the data model — stub with placeholders until data is available.

---

## Implementation Sequence

```
Phase 1  Scaffold            → npm install + dev server works
Phase 2a constants.ts        → required by all layout code
Phase 2b polar.ts            → buildLayout, polarToCartesian, lerp, isTeam, getHighlightedIds
Phase 3a useBracketLayout    → memoized layout hook
Phase 3b useHoveredMatch     → hover + highlight state
Phase 4a TeamBadge           → leaf badge component
Phase 4b MatchNode           → match dot + winner badge
Phase 4c Connector           → bezier path between nodes
Phase 4d Trophy              → center trophy
Phase 4e Bracket             → root SVG, wires all layers
Phase 5  App + styles        → runnable, styled app
Phase 6  Tooltip             → enhancement
Phase 7  Detail panel        → enhancement
```

---

## Tricky Parts

### 1. `buildLayout` angle assignment
DFS slices `[0, 360]` at the root. At each inner node, home gets `[start, mid]`, away gets `[mid, end]`. r32 nodes each control 22.5° (360/16); home badge at `start + 5.625°`, away at `start + 16.875°` — all 32 badges exactly 11.25° apart.

### 2. Connector bezier factor
The 0.4 lerp pulls control points 40% toward center. For adjacent rings this creates a gentle inward bow. Do not change this value.

### 3. Connector z-order
SVG has no `z-index`. Within the connector layer, sort by `isHighlighted` so highlighted paths render on top of intersecting dimmed ones.

### 4. Highlight propagation
Hovering "team-MEX" → find its r32 match → walk parentMap to root → collect match IDs + connector IDs (`"r32-1→r16-1"` etc.). Highlight all ancestors regardless of winner state (all matches are TBD initially).

### 5. Type guard for Team vs MatchNode
`'round' in node` distinguishes them — `MatchNode` has `round`, `Team` does not.

### 6. Trophy asset
No `public/trophy.svg` exists yet. Prefer an inline SVG polygon in `Trophy.tsx` to avoid the external asset dependency.

### 7. Flag asset path
`flags/` is at project root, but Vite serves `public/` at `/`. Move `flags/` to `public/flags/` so `/flags/mx.svg` resolves correctly.

### 8. SVG `<image>` onError in React
React 18 passes `onError` through for SVG `<image>` elements. If it doesn't fire, fall back to a `ref` + native `addEventListener('error', ...)` in `useEffect`.
