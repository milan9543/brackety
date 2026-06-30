/**
 * Dumps the raw API response for one match to inspect available fields.
 * Usage: FOOTBALL_DATA_API_KEY=<key> node scripts/dump-match.mjs <matchId>
 */
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const matchId = process.argv[2] ?? "537417";

const res = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
  headers: { "X-Auth-Token": API_KEY },
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
