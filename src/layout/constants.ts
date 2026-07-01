export const SVG_SIZE = 900;
export const CENTER = { x: 450, y: 450 };

// Badges live here — one ring outside RADII.round32
// Max safe value: CENTER.x - BADGE_RADIUS - 8px margin = 425
export const TEAM_RADIUS = 425;

// evenly spaced from 85 (final) to 425 (round32)
export const RADII = [
  85, // final
  170, // semi
  255, // quarter
  340, // round16
  425, // round32
];

export const BADGE_RADIUS = 17;
export const INNER_BADGE_RADIUS = 13;
