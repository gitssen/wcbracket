import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runScoringEngine } from '@/lib/scoring';

// Mock sports feed data for demonstration/cron execution
const MOCK_SPORTS_FEED = [
  // Round of 32 (Matches 1 to 16) — LEFT HALF
  { matchId: 1, homeScore: 3, awayScore: 1, wentToPenalties: false, winnerCode: 'DE', winnerName: 'Germany' },       // GER vs PAR
  { matchId: 2, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'FR', winnerName: 'France' },         // FRA vs SWE
  { matchId: 3, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'CA', winnerName: 'Canada' },         // RSA vs CAN
  { matchId: 4, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'NL', winnerName: 'Netherlands' },    // NED vs MAR
  { matchId: 5, homeScore: 1, awayScore: 1, wentToPenalties: true, winnerCode: 'PT', winnerName: 'Portugal' },        // POR vs CRO
  { matchId: 6, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'ES', winnerName: 'Spain' },          // ESP vs AUT
  { matchId: 7, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'US', winnerName: 'USA' },            // USA vs BIH
  { matchId: 8, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'BE', winnerName: 'Belgium' },        // BEL vs SEN
  // Round of 32 — RIGHT HALF
  { matchId: 9, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'BR', winnerName: 'Brazil' },         // BRA vs JPN
  { matchId: 10, homeScore: 1, awayScore: 0, wentToPenalties: false, winnerCode: 'CI', winnerName: 'Ivory Coast' },   // CIV vs NOR
  { matchId: 11, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'MX', winnerName: 'Mexico' },        // MEX vs ECU
  { matchId: 12, homeScore: 3, awayScore: 0, wentToPenalties: false, winnerCode: 'GB', winnerName: 'England' },       // ENG vs COD
  { matchId: 13, homeScore: 3, awayScore: 0, wentToPenalties: false, winnerCode: 'AR', winnerName: 'Argentina' },     // ARG vs CPV
  { matchId: 14, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'AU', winnerName: 'Australia' },     // AUS vs EGY
  { matchId: 15, homeScore: 1, awayScore: 0, wentToPenalties: false, winnerCode: 'CH', winnerName: 'Switzerland' },   // SUI vs ALG
  { matchId: 16, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'CO', winnerName: 'Colombia' },      // COL vs GHA

  // Round of 16 (Matches 17 to 24)
  { matchId: 17, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'DE', winnerName: 'Germany' },       // GER vs FRA
  { matchId: 18, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'NL', winnerName: 'Netherlands' },   // CAN vs NED
  { matchId: 19, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'PT', winnerName: 'Portugal' },      // POR vs ESP
  { matchId: 20, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'BE', winnerName: 'Belgium' },       // USA vs BEL
  { matchId: 21, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'BR', winnerName: 'Brazil' },        // BRA vs CIV
  { matchId: 22, homeScore: 1, awayScore: 3, wentToPenalties: false, winnerCode: 'GB', winnerName: 'England' },       // MEX vs ENG
  { matchId: 23, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'AR', winnerName: 'Argentina' },     // ARG vs AUS
  { matchId: 24, homeScore: 1, awayScore: 0, wentToPenalties: false, winnerCode: 'CH', winnerName: 'Switzerland' },   // SUI vs COL

  // Quarter-Finals (Matches 25 to 28)
  { matchId: 25, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'DE', winnerName: 'Germany' },       // GER vs NED
  { matchId: 26, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'BE', winnerName: 'Belgium' },       // POR vs BEL
  { matchId: 27, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'BR', winnerName: 'Brazil' },        // BRA vs ENG
  { matchId: 28, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'AR', winnerName: 'Argentina' },     // ARG vs SUI

  // Semi-Finals (Matches 29 to 30)
  { matchId: 29, homeScore: 3, awayScore: 2, wentToPenalties: false, winnerCode: 'DE', winnerName: 'Germany' },       // GER vs BEL
  { matchId: 30, homeScore: 1, awayScore: 1, wentToPenalties: true, winnerCode: 'AR', winnerName: 'Argentina' },      // BRA vs ARG

  // Finals (Match 31)
  { matchId: 31, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'AR', winnerName: 'Argentina' }      // GER vs ARG
];

export async function GET(request: NextRequest) {
  // 1. Secret variable protection
  const syncSecret = process.env.SYNC_SECRET || 'wcbracket-cron-secret-2026';
  const urlSecret = request.nextUrl.searchParams.get('secret');
  const headerSecret = request.headers.get('x-sync-secret');

  if (urlSecret !== syncSecret && headerSecret !== syncSecret) {
    return NextResponse.json({ error: 'Unauthorized: Invalid secret key.' }, { status: 401 });
  }

  try {
    const updatedMatches = [];

    // 2. Loop through and apply match outcomes
    for (const feedMatch of MOCK_SPORTS_FEED) {
      const match = await prisma.match.findUnique({ where: { id: feedMatch.matchId } });

      if (match && !match.isCompleted) {
        // Update the match as completed with scores
        const updated = await prisma.match.update({
          where: { id: feedMatch.matchId },
          data: {
            homeScore: feedMatch.homeScore,
            awayScore: feedMatch.awayScore,
            wentToPenalties: feedMatch.wentToPenalties,
            actualWinner: feedMatch.winnerName,
            actualWinnerCode: feedMatch.winnerCode,
            isCompleted: true,
          },
        });

        updatedMatches.push(updated);

        // Propagate the winning team to the next round match slot
        if (match.nextMatchId) {
          const nextMatch = await prisma.match.findUnique({ where: { id: match.nextMatchId } });
          if (nextMatch) {
            const dataToUpdate = match.isHomeInNext
              ? { homeTeam: feedMatch.winnerName, homeCode: feedMatch.winnerCode }
              : { awayTeam: feedMatch.winnerName, awayCode: feedMatch.winnerCode };

            await prisma.match.update({
              where: { id: match.nextMatchId },
              data: dataToUpdate,
            });
          }
        }
      }
    }

    // 3. Run scoring engine to update all user totalPoints
    const scoringResult = await runScoringEngine();

    return NextResponse.json({
      success: true,
      message: 'Scores synced and user points updated.',
      matchesUpdated: updatedMatches.length,
      scoringResult,
    });
  } catch (error: any) {
    console.error('API sync-scores error:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync.', details: error.message },
      { status: 500 }
    );
  }
}

// Support POST requests for trigger flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
