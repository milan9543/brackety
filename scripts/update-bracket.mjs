/**
 * Fetches live WC 2026 knockout results from football-data.org and rewrites
 * src/data/bracket.ts in place.
 *
 * Usage:
 *   FOOTBALL_DATA_API_KEY=<key> node scripts/update-bracket.mjs
 *
 * Exit codes:
 *   0 — success (file written or already up-to-date)
 *   1 — fatal error (API failure, bad map, etc.)
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAP_PATH = join(ROOT, "scripts", "match-map.json");
const BRACKET_PATH = join(ROOT, "src", "data", "bracket.ts");

// ─── API ──────────────────────────────────────────────────────────────────────

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
if (!API_KEY) {
  console.error("FOOTBALL_DATA_API_KEY is not set.");
  process.exit(1);
}

async function fetchMatches() {
  const url =
    "https://api.football-data.org/v4/competitions/WC/matches";
  const res = await fetch(url, { headers: { "X-Auth-Token": API_KEY } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.matches; // array of match objects
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** football-data.org uses ISO 3166-1 alpha-3 but with some quirks. Map to our keys. */
const TLA_TO_OUR_ID = {
  // Add overrides here only where the API's TLA differs from ours.
  // Most three-letter codes match directly (FRA→FRA, BRA→BRA, etc.)
  RSA: "ZAF", // South Africa: API uses RSA, we use ZAF
  CRC: "CRC",
  BIH: "BIH",
  CPV: "CPV",
};

function toOurTeamId(tla) {
  if (!tla) return null;
  return TLA_TO_OUR_ID[tla] ?? tla;
}

/**
 * Given an API match, return all fields we care about.
 * score/winner are null if the match hasn't been played yet.
 */
function extractResult(apiMatch, mapEntry) {
  const { status, score, homeTeam, awayTeam, utcDate } = apiMatch;

  const finished = status === "FINISHED";

  let winnerId = null;
  let scoreObj = null;

  if (finished) {
    const hadExtraTime = score.duration === "EXTRA_TIME" || score.duration === "PENALTY_SHOOTOUT";
    const hadPens = score.duration === "PENALTY_SHOOTOUT";
    // Use regularTime for the displayed score (fullTime is cumulative incl. pens)
    const home = (hadExtraTime ? score.regularTime.home : score.fullTime.home);
    const away = (hadExtraTime ? score.regularTime.away : score.fullTime.away);

    if (hadPens) {
      winnerId =
        score.penalties.home > score.penalties.away
          ? toOurTeamId(homeTeam.tla)
          : toOurTeamId(awayTeam.tla);
    } else {
      const etHome = hadExtraTime ? score.extraTime.home : null;
      const etAway = hadExtraTime ? score.extraTime.away : null;
      const finalHome = etHome ?? home;
      const finalAway = etAway ?? away;
      winnerId =
        finalHome > finalAway
          ? toOurTeamId(homeTeam.tla)
          : toOurTeamId(awayTeam.tla);
    }

    scoreObj = {
      home,
      away,
      ...(hadExtraTime && { extraTime: true }),
      ...(hadPens && {
        homePens: score.penalties.home,
        awayPens: score.penalties.away,
      }),
    };
  }

  return {
    winnerId,
    score: scoreObj,
    utcDate: utcDate ?? null,
    venue: mapEntry.venue ?? null,
  };
}

// ─── Code generation ──────────────────────────────────────────────────────────

/**
 * Serialise a score object to a TS literal, e.g.:
 *   { home: 1, away: 0 }
 *   { home: 1, away: 1, extraTime: true, homePens: 4, awayPens: 3 }
 */
function scoreToTs(s) {
  if (!s) return "null";
  const parts = [`home: ${s.home}`, `away: ${s.away}`];
  if (s.extraTime) parts.push("extraTime: true");
  if (s.homePens != null) parts.push(`homePens: ${s.homePens}`);
  if (s.awayPens != null) parts.push(`awayPens: ${s.awayPens}`);
  return `{ ${parts.join(", ")} }`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const mapFile = JSON.parse(readFileSync(MAP_PATH, "utf8"));
const mapEntries = mapFile.matches; // array of { apiId, bracketId, home, away }

// Index map by apiId for quick lookup
const byApiId = new Map();
for (const entry of mapEntries) {
  if (entry.apiId != null) byApiId.set(String(entry.apiId), entry);
}

// Fetch live data
let apiMatches;
try {
  apiMatches = await fetchMatches();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

// Build a results map: bracketId → { winnerId, score, utcDate, venue }
const results = new Map();

for (const apiMatch of apiMatches) {
  const entry = byApiId.get(String(apiMatch.id));
  if (!entry) continue; // not a match we track (e.g. 3rd place)

  results.set(entry.bracketId, extractResult(apiMatch, entry));
}

// ─── Read the current bracket.ts and patch only winner/score lines ────────────
//
// Strategy: replace the winner: and score: lines independently using
// line-oriented regexes. Each pattern matches exactly one line to avoid
// any cross-field bleed.

let src = readFileSync(BRACKET_PATH, "utf8");
const original = src;

for (const [bracketId, result] of results) {
  const { winnerId, score, utcDate, venue } = result;
  const winnerTs = winnerId ? `TEAMS.${winnerId}` : "null";
  const scoreTs = scoreToTs(score);
  const utcDateTs = utcDate ? `"${utcDate}"` : "undefined";
  const venueTs = venue ? `"${venue}"` : "undefined";

  // Find the block for this match and do targeted single-line replacements.
  const blockStart = src.indexOf(`const ${bracketId}:`);
  if (blockStart === -1) continue;
  const blockEnd = src.indexOf("};", blockStart) + 2;

  let block = src.slice(blockStart, blockEnd);

  block = block.replace(/^(\s*winner:\s*).*$/m,  (_, p) => `${p}${winnerTs},`);
  block = block.replace(/^(\s*score:\s*).*$/m,   (_, p) => `${p}${scoreTs},`);
  block = block.replace(/^(\s*utcDate:\s*).*$/m, (_, p) => `${p}${utcDateTs},`);
  block = block.replace(/^(\s*venue:\s*).*$/m,   (_, p) => `${p}${venueTs},`);

  src = src.slice(0, blockStart) + block + src.slice(blockEnd);
}

if (src === original) {
  console.log("No changes — bracket already up to date.");
  process.exit(0);
}

writeFileSync(BRACKET_PATH, src, "utf8");
console.log("bracket.ts updated with latest results.");
