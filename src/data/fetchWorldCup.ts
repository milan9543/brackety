import type { Goal, MatchNode, Round, Score, Team } from "../types";
import { isTeam } from "../layout/polar";

const STADIUMS_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.stadiums.json";
const TEAMS_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.teams.json";
const MATCHES_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.json";

type RawStadium = {
  city: string;
  name: string;
};

type RawTeam = {
  name: string;
  flag_icon: string;
  flag_unicode: string;
  fifa_code: string;
  group: string;
};

type RawScore = {
  ft?: [number, number];
  et?: [number, number];
  p?: [number, number];
};

type RawMatch = {
  round: string;
  num: number;
  date?: string;
  time?: string;
  team1: string;
  team2: string;
  score?: RawScore;
  goals1?: Goal[];
  goals2?: Goal[];
  ground?: string;
};

const ROUND_MAP: Record<string, Round> = {
  "Round of 32": "round32",
  "Round of 16": "round16",
  "Quarter-final": "quarter",
  "Semi-final": "semi",
  Final: "final",
};

// Subdivision flags (England, Scotland, Wales) are a black flag (U+1F3F4)
// followed by tag characters (U+E0061–U+E007A map to a–z) spelling an ISO
// 3166-2 code, e.g. "gbeng" — terminated by the cancel tag U+E007F. Insert a
// hyphen after the first two letters (country part) to match file names like
// "gb-eng.svg".
function tagSequenceToCode(flagUnicode: string): string | null {
  if (!/1F3F4/i.test(flagUnicode)) return null;
  const tags = [...flagUnicode.matchAll(/E00[0-9A-F]{2}/gi)].map((m) =>
    parseInt(m[0], 16),
  );
  const letters = tags
    .filter((cp) => cp >= 0xe0061 && cp <= 0xe007a)
    .map((cp) => String.fromCharCode(cp - 0xe0061 + 97));
  if (letters.length < 2) return null;
  return `${letters.slice(0, 2).join("")}-${letters.slice(2).join("")}`;
}

// Regional indicator symbols (U+1F1E6–U+1F1FF) map 1:1 to A–Z.
function flagUnicodeToIsoCode(flagUnicode: string): string | null {
  const tagCode = tagSequenceToCode(flagUnicode);
  if (tagCode) return tagCode;
  const codepoints = [...flagUnicode.matchAll(/1F1[E-F][0-9A-F]/gi)].map((m) =>
    parseInt(m[0], 16),
  );
  if (codepoints.length !== 2) return null;
  const letters = codepoints.map((cp) => String.fromCharCode(cp - 0x1f1e6 + 65));
  return letters.join("");
}

function buildTeam(raw: RawTeam): Team {
  const isoCode = flagUnicodeToIsoCode(raw.flag_unicode);
  return {
    id: raw.fifa_code,
    name: raw.name,
    shortName: raw.fifa_code,
    badgeUrl: isoCode ? `/flags/${isoCode.toLowerCase()}.svg` : "",
    flagEmoji: raw.flag_icon,
    group: raw.group,
  };
}

function computeWinner(home: Team | null, away: Team | null, score?: RawScore): Team | null {
  if (!home || !away || !score) return null;
  const shootout = score.p;
  if (shootout) {
    return shootout[0] > shootout[1] ? home : away;
  }
  const final = score.et ?? score.ft;
  if (!final) return null;
  if (final[0] === final[1]) return null;
  return final[0] > final[1] ? home : away;
}

function toScore(score?: RawScore): Score | undefined {
  const final = score?.et ?? score?.ft;
  if (!final) return undefined;
  const hasExtraTime = Boolean(score?.et);
  return {
    home: final[0],
    away: final[1],
    extraTime: hasExtraTime || undefined,
    homePens: score?.p?.[0],
    awayPens: score?.p?.[1],
  };
}

// raw.time looks like "13:00 UTC-6"; parse the offset so we can build a true UTC instant.
function toUtcDate(date?: string, time?: string): string | undefined {
  if (!date) return undefined;
  const offsetMatch = time?.match(/UTC([+-]\d+)/);
  const [hhmm] = time?.split(" ") ?? [];
  if (!hhmm || !offsetMatch) return new Date(date).toISOString();
  const offsetHours = Number(offsetMatch[1]);
  const sign = offsetHours >= 0 ? "+" : "-";
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  return new Date(`${date}T${hhmm}:00${sign}${pad(offsetHours)}:00`).toISOString();
}

export async function fetchWorldCupData(): Promise<{
  bracket: MatchNode;
  teams: Record<string, Team>;
  matchesByRound: Record<Round, MatchNode[]>;
}> {
  const [stadiumsRes, teamsRes, matchesRes] = await Promise.all([
    fetch(STADIUMS_URL),
    fetch(TEAMS_URL),
    fetch(MATCHES_URL),
  ]);

  const stadiumsData: { stadiums: RawStadium[] } = await stadiumsRes.json();
  const rawTeams: RawTeam[] = await teamsRes.json();
  const matchesData: { matches: RawMatch[] } = await matchesRes.json();

  const teams: Record<string, Team> = {};
  const teamsByName = new Map<string, Team>();
  for (const raw of rawTeams) {
    const team = buildTeam(raw);
    teams[team.id] = team;
    teamsByName.set(raw.name, team);
  }

  const venueByCity = new Map<string, string>();
  for (const stadium of stadiumsData.stadiums) {
    venueByCity.set(stadium.city, stadium.name);
  }

  const rawMatchesByNum = new Map<number, RawMatch>();
  for (const match of matchesData.matches) {
    if (match.round in ROUND_MAP) {
      rawMatchesByNum.set(match.num, match);
    }
  }

  // Some feeds substitute the literal team name into a later round's team1/team2
  // once that team's advancement is effectively certain, instead of leaving the
  // "W##" reference in place. Detect those cases by finding, for each team name,
  // the earliest knockout match (by num) where that name appears — any later
  // round referencing that name by literal string should link back to that match
  // instead of being treated as a fresh leaf, so the bracket tree stays connected.
  const earliestMatchNumByTeamName = new Map<string, number>();
  for (const match of rawMatchesByNum.values()) {
    for (const name of [match.team1, match.team2]) {
      if (!teamsByName.has(name)) continue;
      const existingNum = earliestMatchNumByTeamName.get(name);
      if (existingNum === undefined || match.num < existingNum) {
        earliestMatchNumByTeamName.set(name, match.num);
      }
    }
  }

  const builtByNum = new Map<number, MatchNode>();

  function resolveSide(value: string, currentNum: number): MatchNode | Team {
    const ref = value.match(/^[WL](\d+)$/);
    if (ref) return buildMatch(Number(ref[1]));
    const team = teamsByName.get(value);
    if (team) {
      const earliestNum = earliestMatchNumByTeamName.get(value);
      if (earliestNum !== undefined && earliestNum < currentNum) {
        return buildMatch(earliestNum);
      }
      return team;
    }
    throw new Error(`Unresolvable match participant: ${value}`);
  }

  function buildMatch(num: number): MatchNode {
    const existing = builtByNum.get(num);
    if (existing) return existing;

    const raw = rawMatchesByNum.get(num);
    if (!raw) throw new Error(`Unknown match num: ${num}`);

    const placeholder: Team = { id: "", name: "", shortName: "", badgeUrl: "" };
    const node: MatchNode = {
      id: `m${num}`,
      round: ROUND_MAP[raw.round],
      home: placeholder,
      away: placeholder,
      winner: null,
    };
    builtByNum.set(num, node);

    node.home = resolveSide(raw.team1, num);
    node.away = resolveSide(raw.team2, num);

    const homeTeam = isTeam(node.home) ? node.home : node.home.winner;
    const awayTeam = isTeam(node.away) ? node.away : node.away.winner;

    node.winner = computeWinner(homeTeam, awayTeam, raw.score);
    node.score = toScore(raw.score);
    node.utcDate = toUtcDate(raw.date, raw.time);
    node.venue = raw.ground
      ? `${venueByCity.get(raw.ground) ?? raw.ground}, ${raw.ground}`
      : undefined;
    if (raw.goals1?.length || raw.goals2?.length) {
      node.goals = { home: raw.goals1 ?? [], away: raw.goals2 ?? [] };
    }

    return node;
  }

  const matchesByRound: Record<Round, MatchNode[]> = {
    final: [],
    semi: [],
    quarter: [],
    round16: [],
    round32: [],
    round48: [],
  };

  for (const num of rawMatchesByNum.keys()) {
    const node = buildMatch(num);
    matchesByRound[node.round].push(node);
  }

  const bracket = buildMatch(104);

  return { bracket, teams, matchesByRound };
}
