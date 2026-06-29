import { prisma } from './db';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Calculates and updates points for all users based on match results and predictions.
 * Rule 1: +1 Point for predicting the correct advancing team.
 * Rule 2: +1 Extra Point if the scoreline AND penalty state match the live result perfectly.
 */
export async function runScoringEngine(trigger: string = 'cron') {
  try {
    // 1. Fetch all completed matches
    const completedMatches = await prisma.match.findMany({
      where: { isCompleted: true },
    });

    if (completedMatches.length === 0) {
      console.log('No completed matches to calculate scores.');
      return { success: true, message: 'No completed matches found.' };
    }

    // Map matches by ID for fast lookup
    const matchesMap = new Map(completedMatches.map((m) => [m.id, m]));

    // 2. Fetch all users and their predictions
    const users = await prisma.user.findMany({
      include: {
        predictions: true,
      },
    });

    console.log(`Calculating scores for ${users.length} users...`);

    // 3. Evaluate points for each user
    for (const user of users) {
      let points = 0;

      for (const prediction of user.predictions) {
        const match = matchesMap.get(prediction.matchId);
        if (!match) {
          // Match is either not completed or not found in completed list
          continue;
        }

        // Calculate points based on new rules
        const predictedWinnerCode = prediction.predictedWinnerCode?.toUpperCase().trim();
        const actualWinnerCode = match.actualWinnerCode?.toUpperCase().trim();

        if (predictedWinnerCode && actualWinnerCode && predictedWinnerCode === actualWinnerCode) {
          if (match.round === 'ROUND_OF_32') {
            points += 1;
          } else if (match.round === 'ROUND_OF_16') {
            points += 2;
          } else if (match.round === 'QUARTER_FINALS') {
            points += 4;
          } else if (match.round === 'SEMI_FINALS') {
            points += 8;
          } else if (match.round === 'FINALS') {
            points += 16;
          }

          const scorelineMatches =
            prediction.predictedHomeScore === match.homeScore &&
            prediction.predictedAwayScore === match.awayScore;
          
          const penaltyStateMatches = prediction.predictPenalties === match.wentToPenalties;

          if (scorelineMatches && penaltyStateMatches) {
            points += 1;
          }
        }
      }

      // Log score change before updating
      if (points !== user.totalPoints) {
        await turso.execute({
          sql: 'INSERT INTO ScoreLog (userId, username, previousPoints, newPoints, trigger) VALUES (?, ?, ?, ?, ?)',
          args: [user.id, user.username, user.totalPoints, points, trigger],
        });
      }

      // Update totalPoints for this user
      await prisma.user.update({
        where: { id: user.id },
        data: { totalPoints: points },
      });
    }

    console.log('Scores updated successfully.');
    return { success: true, count: users.length };
  } catch (error) {
    console.error('Error running scoring engine:', error);
    throw error;
  }
}
