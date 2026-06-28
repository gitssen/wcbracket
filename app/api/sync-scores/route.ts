import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runScoringEngine } from '@/lib/scoring';

// Mock sports feed data for demonstration/cron execution
const MOCK_SPORTS_FEED = [
  // Round of 32 (Matches 1 to 16)
  { matchId: 1, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'CA', winnerName: 'Canada' },
  { matchId: 2, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'BR', winnerName: 'Brazil' },
  { matchId: 3, homeScore: 3, awayScore: 1, wentToPenalties: false, winnerCode: 'DE', winnerName: 'Germany' },
  { matchId: 4, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'NL', winnerName: 'Netherlands' },
  { matchId: 5, homeScore: 1, awayScore: 0, wentToPenalties: false, winnerCode: 'CI', winnerName: 'Ivory Coast' },
  { matchId: 6, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'FR', winnerName: 'France' },
  { matchId: 7, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'MX', winnerName: 'Mexico' },
  { matchId: 8, homeScore: 3, awayScore: 0, wentToPenalties: false, winnerCode: 'GB', winnerName: 'England' },
  { matchId: 9, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'BE', winnerName: 'Belgium' },
  { matchId: 10, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'US', winnerName: 'USA' },
  { matchId: 11, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'ES', winnerName: 'Spain' },
  { matchId: 12, homeScore: 1, awayScore: 1, wentToPenalties: true, winnerCode: 'PT', winnerName: 'Portugal' },
  { matchId: 13, homeScore: 1, awayScore: 0, wentToPenalties: false, winnerCode: 'CH', winnerName: 'Switzerland' },
  { matchId: 14, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'AU', winnerName: 'Australia' },
  { matchId: 15, homeScore: 3, awayScore: 0, wentToPenalties: false, winnerCode: 'AR', winnerName: 'Argentina' },
  { matchId: 16, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'CO', winnerName: 'Colombia' },

  // Round of 16 (Matches 17 to 24)
  { matchId: 17, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'BR', winnerName: 'Brazil' },
  { matchId: 18, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'DE', winnerName: 'Germany' },
  { matchId: 19, homeScore: 0, awayScore: 2, wentToPenalties: false, winnerCode: 'FR', winnerName: 'France' },
  { matchId: 20, homeScore: 1, awayScore: 3, wentToPenalties: false, winnerCode: 'GB', winnerName: 'England' },
  { matchId: 21, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'US', winnerName: 'USA' },
  { matchId: 22, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'ES', winnerName: 'Spain' },
  { matchId: 23, homeScore: 1, awayScore: 0, wentToPenalties: false, winnerCode: 'CH', winnerName: 'Switzerland' },
  { matchId: 24, homeScore: 2, awayScore: 0, wentToPenalties: false, winnerCode: 'AR', winnerName: 'Argentina' },

  // Quarter-Finals (Matches 25 to 28)
  { matchId: 25, homeScore: 2, awayScore: 1, wentToPenalties: false, winnerCode: 'BR', winnerName: 'Brazil' },
  { matchId: 26, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'GB', winnerName: 'England' },
  { matchId: 27, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'ES', winnerName: 'Spain' },
  { matchId: 28, homeScore: 0, awayScore: 2, wentToPenalties: false, winnerCode: 'AR', winnerName: 'Argentina' },

  // Semi-Finals (Matches 29 to 30)
  { matchId: 29, homeScore: 3, awayScore: 2, wentToPenalties: false, winnerCode: 'BR', winnerName: 'Brazil' },
  { matchId: 30, homeScore: 1, awayScore: 1, wentToPenalties: true, winnerCode: 'AR', winnerName: 'Argentina' },

  // Finals (Match 31)
  { matchId: 31, homeScore: 1, awayScore: 2, wentToPenalties: false, winnerCode: 'AR', winnerName: 'Argentina' }
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
