const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC';

interface ApiTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

interface ApiScore {
  home: number | null;
  away: number | null;
}

interface ApiMatch {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score: {
    winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
    fullTime: ApiScore;
    halfTime: ApiScore;
    regularTime: ApiScore;
    extraTime: ApiScore;
    penalties: ApiScore;
  };
}

interface ApiResponse {
  count: number;
  matches: ApiMatch[];
}

export interface ParsedMatchResult {
  homeTeamTla: string;
  awayTeamTla: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  wentToPenalties: boolean;
  winnerTla: string;
  winnerName: string;
  kickoffTime: string; // ISO 8601 UTC
}

export interface ParsedScheduledMatch {
  homeTeamTla: string;
  awayTeamTla: string;
  kickoffTime: string;
}

/** Fetch World Cup matches from football-data.org, optionally filtered by status */
export async function fetchWCMatches(status?: string): Promise<ApiMatch[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY is not set');
  }

  const url = new URL(`${API_BASE}/competitions/${COMPETITION}/matches`);
  if (status) {
    url.searchParams.set('status', status);
  }

  const res = await fetch(url.toString(), {
    headers: { 'X-Auth-Token': apiKey },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data.org API error ${res.status}: ${text}`);
  }

  const data: ApiResponse = await res.json();
  return data.matches;
}

/** Parse a FINISHED match into our scoring format */
export function parseMatchResult(apiMatch: ApiMatch): ParsedMatchResult | null {
  if (apiMatch.status !== 'FINISHED') return null;

  const { score, homeTeam, awayTeam } = apiMatch;
  const wentToPenalties = score.duration === 'PENALTY_SHOOTOUT';

  // Determine the stored score: regulation+ET for penalty matches, fullTime otherwise
  let homeScore: number;
  let awayScore: number;

  if (wentToPenalties) {
    // Store the score after extra time (before penalties) for correct bonus point matching
    const regHome = score.regularTime?.home ?? 0;
    const regAway = score.regularTime?.away ?? 0;
    const etHome = score.extraTime?.home ?? 0;
    const etAway = score.extraTime?.away ?? 0;
    homeScore = regHome + etHome;
    awayScore = regAway + etAway;
  } else {
    if (score.fullTime.home === null || score.fullTime.away === null) return null;
    homeScore = score.fullTime.home;
    awayScore = score.fullTime.away;
  }

  // Determine winner
  let winnerTla: string;
  let winnerName: string;
  if (score.winner === 'HOME_TEAM') {
    winnerTla = homeTeam.tla;
    winnerName = homeTeam.name;
  } else if (score.winner === 'AWAY_TEAM') {
    winnerTla = awayTeam.tla;
    winnerName = awayTeam.name;
  } else if (wentToPenalties && score.fullTime.home !== null && score.fullTime.away !== null) {
    // API returns winner=null for penalty shootouts — infer from fullTime totals
    if (score.fullTime.home > score.fullTime.away) {
      winnerTla = homeTeam.tla;
      winnerName = homeTeam.name;
    } else {
      winnerTla = awayTeam.tla;
      winnerName = awayTeam.name;
    }
  } else {
    return null;
  }

  return {
    homeTeamTla: homeTeam.tla,
    awayTeamTla: awayTeam.tla,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    homeScore,
    awayScore,
    wentToPenalties,
    winnerTla,
    winnerName,
    kickoffTime: apiMatch.utcDate,
  };
}

/** Parse a SCHEDULED/TIMED match for kickoff time population */
export function parseScheduledMatch(apiMatch: ApiMatch): ParsedScheduledMatch | null {
  if (apiMatch.status !== 'SCHEDULED' && apiMatch.status !== 'TIMED') return null;
  if (!apiMatch.homeTeam.tla || !apiMatch.awayTeam.tla) return null;

  return {
    homeTeamTla: apiMatch.homeTeam.tla,
    awayTeamTla: apiMatch.awayTeam.tla,
    kickoffTime: apiMatch.utcDate,
  };
}
