const TEAM_IDS = [
  "MEX",
  "ZAF",
  "SUI",
  "CAN",
  "BRA",
  "MAR",
  "USA",
  "AUS",
  "GER",
  "CIV",
  "NED",
  "JPN",
  "BEL",
  "EGY",
  "ESP",
  "CPV",
  "FRA",
  "NOR",
  "ARG",
  "AUT",
  "COL",
  "POR",
  "ENG",
  "CRO",
  "BIH",
  "PAR",
  "ECU",
  "SWE",
  "SEN",
  "ALG",
  "COD",
  "GHA",
] as const;

export type TeamId = (typeof TEAM_IDS)[number];

export type Team = {
  id: TeamId;
  name: string;
  shortName: string;
  badgeUrl: string;
  flagEmoji?: string;
};

export type Round =
  | "final"
  | "semi"
  | "quarter"
  | "round16"
  | "round32"
  | "round48";

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
  home: MatchNode | Team;
  away: MatchNode | Team;
  winner: Team | null;
  score?: Score | null;
  utcDate?: string;  // ISO 8601 kick-off time, e.g. "2026-06-28T19:00:00Z"
  venue?: string;    // stadium name, hardcoded (API returns null)
};
