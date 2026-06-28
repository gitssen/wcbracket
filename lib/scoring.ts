import { prisma } from './db';

/**
 * Calculates and updates points for all users based on match results and predictions.
 * Rule 1: +1 Point for predicting the correct advancing team.
 * Rule 2: +1 Extra Point if the scoreline AND penalty state match the live result perfectly.
 */
export async function runScoringEngine() {
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

        // Rule 1: Correct advancing team (winner code matches)
        const predictedWinnerCode = prediction.predictedWinnerCode?.toUpperCase().trim();
        const actualWinnerCode = match.actualWinnerCode?.toUpperCase().trim();

        if (predictedWinnerCode && actualWinnerCode && predictedWinnerCode === actualWinnerCode) {
          points += 1;

          // Rule 2: Perfect scoreline AND penalty state match
          const scorelineMatches =
            prediction.predictedHomeScore === match.homeScore &&
            prediction.predictedAwayScore === match.awayScore;
          
          const penaltyStateMatches = prediction.predictPenalties === match.wentToPenalties;

          if (scorelineMatches && penaltyStateMatches) {
            points += 1;
          }
        }
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
