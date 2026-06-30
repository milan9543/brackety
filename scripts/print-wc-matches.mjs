/**
 * One-time helper: prints all WC 2026 knockout matches with their API IDs.
 * Run once after getting your key to fill in match-map.json:
 *
 *   FOOTBALL_DATA_API_KEY=your_key node scripts/print-wc-matches.mjs
 */

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
if (!API_KEY) {
  console.error("Set FOOTBALL_DATA_API_KEY env var first.");
  process.exit(1);
}

// Fetch all matches (no stage filter) so we can see what stages exist
const res = await fetch(
  "https://api.football-data.org/v4/competitions/WC/matches",
  { headers: { "X-Auth-Token": API_KEY } },
);

if (!res.ok) {
  console.error(`API error ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const { matches } = data;

if (!matches?.length) {
  console.log("No matches returned. Raw response:");
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

// Print unique stages first so we know what to filter on
const stages = [...new Set(matches.map((m) => m.stage))];
console.log("Stages found:", stages.join(", "));
console.log("");

// Print all matches grouped by stage
for (const stage of stages) {
  const group = matches.filter((m) => m.stage === stage);
  console.log(`── ${stage} (${group.length} matches) ──`);
  for (const m of group) {
    const home = m.homeTeam?.tla ?? m.homeTeam?.name ?? "TBD";
    const away = m.awayTeam?.tla ?? m.awayTeam?.name ?? "TBD";
    console.log(`  ${m.id}\t${home} vs ${away}\t${m.status}`);
  }
  console.log("");
}
