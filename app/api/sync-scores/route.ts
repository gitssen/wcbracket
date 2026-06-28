import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runScoringEngine } from '@/lib/scoring';
import { fetchWCMatches, parseMatchResult, parseScheduledMatch } from '@/lib/footballApi';

/** Find a DB match by comparing home/away TLA codes (case-insensitive) */
function findDbMatch(
  dbMatches: { id: number; homeCode: string; awayCode: string }[],
  homeTla: string | null,
  awayTla: string | null
) {
  if (!homeTla || !awayTla) return undefined;
  const h = homeTla.toUpperCase();
  const a = awayTla.toUpperCase();
  return dbMatches.find(
    (m) => m.homeCode.toUpperCase() === h && m.awayCode.toUpperCase() === a
  );
}

export async function GET(request: NextRequest) {
  // 1. Secret validation
  const syncSecret = process.env.SYNC_SECRET || 'wcbracket-cron-secret-2026';
  const urlSecret = request.nextUrl.searchParams.get('secret');
  const headerSecret = request.headers.get('x-sync-secret');

  if (urlSecret !== syncSecret && headerSecret !== syncSecret) {
    return NextResponse.json({ error: 'Unauthorized: Invalid secret key.' }, { status: 401 });
  }

  try {
    // Fetch all DB matches once for lookups
    const allDbMatches = await prisma.match.findMany();
    const updatedMatches: number[] = [];
    let scheduledUpdated = 0;

    // 2. Process FINISHED matches — update scores, winner, propagate
    const finishedApiMatches = await fetchWCMatches('FINISHED');
    for (const apiMatch of finishedApiMatches) {
      const result = parseMatchResult(apiMatch);
      if (!result) continue;

      const dbMatch = findDbMatch(allDbMatches, result.homeTeamTla, result.awayTeamTla);
      if (!dbMatch) continue;

      // Fetch latest state (may have been updated by a previous iteration)
      const match = await prisma.match.findUnique({ where: { id: dbMatch.id } });
      if (!match || match.isCompleted) continue;

      // Update match as completed
      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          wentToPenalties: result.wentToPenalties,
          actualWinner: result.winnerName,
          actualWinnerCode: result.winnerTla,
          isCompleted: true,
          kickoffTime: result.kickoffTime,
        },
      });
      updatedMatches.push(match.id);

      // Propagate winner to next round
      if (match.nextMatchId) {
        const dataToUpdate = match.isHomeInNext
          ? { homeTeam: result.winnerName, homeCode: result.winnerTla }
          : { awayTeam: result.winnerName, awayCode: result.winnerTla };

        await prisma.match.update({
          where: { id: match.nextMatchId },
          data: dataToUpdate,
        });
      }
    }

    // 3. Process SCHEDULED/TIMED matches — populate kickoffTime for upcoming games
    const scheduledApiMatches = await fetchWCMatches('SCHEDULED,TIMED');
    for (const apiMatch of scheduledApiMatches) {
      const scheduled = parseScheduledMatch(apiMatch);
      if (!scheduled) continue;

      const dbMatch = findDbMatch(allDbMatches, scheduled.homeTeamTla, scheduled.awayTeamTla);
      if (!dbMatch) continue;

      const match = await prisma.match.findUnique({ where: { id: dbMatch.id } });
      if (!match || match.isCompleted) continue;

      // Only update if kickoffTime has changed or is not set
      if (match.kickoffTime !== scheduled.kickoffTime) {
        await prisma.match.update({
          where: { id: match.id },
          data: { kickoffTime: scheduled.kickoffTime },
        });
        scheduledUpdated++;
      }
    }

    // 4. Run scoring engine
    const scoringResult = await runScoringEngine();

    return NextResponse.json({
      success: true,
      message: 'Scores synced and user points updated.',
      matchesUpdated: updatedMatches.length,
      scheduledUpdated,
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

export async function POST(request: NextRequest) {
  return GET(request);
}
