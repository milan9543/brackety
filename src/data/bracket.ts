import { MatchNode } from "../types";
import { TEAMS } from "./teams";

// ─── Round of 32 ─────────────────────────────────────────────────────────────
// Matches 73–88, played June 28 – July 3

// Left half of bracket (feeds semi m101)

const m73: MatchNode = {
  id: "m73",
  round: "round32",
  home: TEAMS.ZAF,
  away: TEAMS.CAN,
  winner: TEAMS.CAN,
  score: { home: 0, away: 1 },
  utcDate: "2026-06-28T19:00:00Z",
  venue: "SoFi Stadium, Inglewood",
};

const m75: MatchNode = {
  id: "m75",
  round: "round32",
  home: TEAMS.NED,
  away: TEAMS.MAR,
  winner: TEAMS.MAR,
  score: { home: 1, away: 1, extraTime: true, homePens: 2, awayPens: 3 },
  utcDate: "2026-06-30T01:00:00Z",
  venue: "Estadio BBVA, Guadalupe",
};

const m74: MatchNode = {
  id: "m74",
  round: "round32",
  home: TEAMS.GER,
  away: TEAMS.PAR,
  winner: TEAMS.PAR,
  score: { home: 1, away: 1, extraTime: true, homePens: 3, awayPens: 4 },
  utcDate: "2026-06-29T20:30:00Z",
  venue: "Gillette Stadium, Foxborough",
};

const m77: MatchNode = {
  id: "m77",
  round: "round32",
  home: TEAMS.FRA,
  away: TEAMS.SWE,
  winner: null,
  score: null,
  utcDate: "2026-06-30T21:00:00Z",
  venue: "MetLife Stadium, East Rutherford",
};

const m76: MatchNode = {
  id: "m76",
  round: "round32",
  home: TEAMS.BRA,
  away: TEAMS.JPN,
  winner: TEAMS.BRA,
  score: { home: 2, away: 1 },
  utcDate: "2026-06-29T17:00:00Z",
  venue: "NRG Stadium, Houston",
};

const m78: MatchNode = {
  id: "m78",
  round: "round32",
  home: TEAMS.CIV,
  away: TEAMS.NOR,
  winner: null,
  score: null,
  utcDate: "2026-06-30T17:00:00Z",
  venue: "AT&T Stadium, Arlington",
};

const m79: MatchNode = {
  id: "m79",
  round: "round32",
  home: TEAMS.MEX,
  away: TEAMS.ECU,
  winner: null,
  score: null,
  utcDate: "2026-07-01T01:00:00Z",
  venue: "Estadio Azteca, Mexico City",
};

const m80: MatchNode = {
  id: "m80",
  round: "round32",
  home: TEAMS.ENG,
  away: TEAMS.COD,
  winner: null,
  score: null,
  utcDate: "2026-07-01T16:00:00Z",
  venue: "Mercedes-Benz Stadium, Atlanta",
};

// Right half of bracket (feeds semi m102)

const m81: MatchNode = {
  id: "m81",
  round: "round32",
  home: TEAMS.USA,
  away: TEAMS.BIH,
  winner: null,
  score: null,
  utcDate: "2026-07-02T00:00:00Z",
  venue: "Levi's Stadium, Santa Clara",
};

const m82: MatchNode = {
  id: "m82",
  round: "round32",
  home: TEAMS.BEL,
  away: TEAMS.SEN,
  winner: null,
  score: null,
  utcDate: "2026-07-01T20:00:00Z",
  venue: "Lumen Field, Seattle",
};

const m83: MatchNode = {
  id: "m83",
  round: "round32",
  home: TEAMS.POR,
  away: TEAMS.CRO,
  winner: null,
  score: null,
  utcDate: "2026-07-02T23:00:00Z",
  venue: "BMO Field, Toronto",
};

const m84: MatchNode = {
  id: "m84",
  round: "round32",
  home: TEAMS.ESP,
  away: TEAMS.AUT,
  winner: null,
  score: null,
  utcDate: "2026-07-02T19:00:00Z",
  venue: "SoFi Stadium, Inglewood",
};

const m85: MatchNode = {
  id: "m85",
  round: "round32",
  home: TEAMS.COL,
  away: TEAMS.GHA,
  winner: null,
  score: null,
  utcDate: "2026-07-04T01:30:00Z",
  venue: "Arrowhead Stadium, Kansas City",
};

const m86: MatchNode = {
  id: "m86",
  round: "round32",
  home: TEAMS.SUI,
  away: TEAMS.ALG,
  winner: null,
  score: null,
  utcDate: "2026-07-03T03:00:00Z",
  venue: "BC Place, Vancouver",
};

const m87: MatchNode = {
  id: "m87",
  round: "round32",
  home: TEAMS.ARG,
  away: TEAMS.CPV,
  winner: null,
  score: null,
  utcDate: "2026-07-03T22:00:00Z",
  venue: "Hard Rock Stadium, Miami Gardens",
};

const m88: MatchNode = {
  id: "m88",
  round: "round32",
  home: TEAMS.AUS,
  away: TEAMS.EGY,
  winner: null,
  score: null,
  utcDate: "2026-07-03T18:00:00Z",
  venue: "AT&T Stadium, Arlington",
};

// ─── Round of 16 ─────────────────────────────────────────────────────────────
// Matches 89–96, played July 4–7

// Left half
const m89: MatchNode = {
  id: "m89",
  round: "round16",
  home: m74, // GER or PAR
  away: m77, // FRA or SWE
  winner: null,
  score: null,
  utcDate: "2026-07-04T21:00:00Z",
  venue: "Lincoln Financial Field, Philadelphia",
};

const m90: MatchNode = {
  id: "m90",
  round: "round16",
  home: m73, // CAN
  away: m75, // NED or MAR
  winner: null,
  score: null,
  utcDate: "2026-07-04T17:00:00Z",
  venue: "NRG Stadium, Houston",
};

const m91: MatchNode = {
  id: "m91",
  round: "round16",
  home: m76, // BRA
  away: m78, // CIV or NOR
  winner: null,
  score: null,
  utcDate: "2026-07-05T20:00:00Z",
  venue: "MetLife Stadium, East Rutherford",
};

const m92: MatchNode = {
  id: "m92",
  round: "round16",
  home: m79, // MEX or ECU
  away: m80, // ENG or COD
  winner: null,
  score: null,
  utcDate: "2026-07-06T00:00:00Z",
  venue: "Estadio Azteca, Mexico City",
};

// Right half
const m93: MatchNode = {
  id: "m93",
  round: "round16",
  home: m81, // USA or BIH
  away: m82, // BEL or SEN
  winner: null,
  score: null,
  utcDate: "2026-07-06T19:00:00Z",
  venue: "AT&T Stadium, Arlington",
};

const m94: MatchNode = {
  id: "m94",
  round: "round16",
  home: m83, // POR or CRO
  away: m84, // ESP or AUT
  winner: null,
  score: null,
  utcDate: "2026-07-07T00:00:00Z",
  venue: "Lumen Field, Seattle",
};

const m95: MatchNode = {
  id: "m95",
  round: "round16",
  home: m85, // COL or GHA
  away: m86, // SUI or ALG
  winner: null,
  score: null,
  utcDate: "2026-07-07T16:00:00Z",
  venue: "Mercedes-Benz Stadium, Atlanta",
};

const m96: MatchNode = {
  id: "m96",
  round: "round16",
  home: m87, // ARG or CPV
  away: m88, // AUS or EGY
  winner: null,
  score: null,
  utcDate: "2026-07-07T20:00:00Z",
  venue: "BC Place, Vancouver",
};

// ─── Quarterfinals ────────────────────────────────────────────────────────────
// Matches 97–100, played July 9–11

const m97: MatchNode = {
  id: "m97",
  round: "quarter",
  home: m89,
  away: m90,
  winner: null,
  score: null,
  utcDate: "2026-07-09T20:00:00Z",
  venue: "Gillette Stadium, Foxborough",
};

const m98: MatchNode = {
  id: "m98",
  round: "quarter",
  home: m91,
  away: m92,
  winner: null,
  score: null,
  utcDate: "2026-07-10T19:00:00Z",
  venue: "SoFi Stadium, Inglewood",
};

const m99: MatchNode = {
  id: "m99",
  round: "quarter",
  home: m93,
  away: m94,
  winner: null,
  score: null,
  utcDate: "2026-07-11T21:00:00Z",
  venue: "Hard Rock Stadium, Miami Gardens",
};

const m100: MatchNode = {
  id: "m100",
  round: "quarter",
  home: m95,
  away: m96,
  winner: null,
  score: null,
  utcDate: "2026-07-12T01:00:00Z",
  venue: "Arrowhead Stadium, Kansas City",
};

// ─── Semifinals ───────────────────────────────────────────────────────────────
// Matches 101–102, played July 14–15

const m101: MatchNode = {
  id: "m101",
  round: "semi",
  home: m97,
  away: m98,
  winner: null,
  score: null,
  utcDate: "2026-07-14T19:00:00Z",
  venue: "AT&T Stadium, Arlington",
};

const m102: MatchNode = {
  id: "m102",
  round: "semi",
  home: m99,
  away: m100,
  winner: null,
  score: null,
  utcDate: "2026-07-15T19:00:00Z",
  venue: "Mercedes-Benz Stadium, Atlanta",
};

// ─── Final ────────────────────────────────────────────────────────────────────
// July 19, MetLife Stadium, East Rutherford, NJ

export const BRACKET: MatchNode = {
  id: "final",
  round: "final",
  home: m101,
  away: m102,
  winner: null,
  score: null,
  utcDate: undefined,
  venue: "MetLife Stadium, East Rutherford",
};
