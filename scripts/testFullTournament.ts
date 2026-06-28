import { prisma } from '../lib/db';
import { runScoringEngine } from '../lib/scoring';

const testPredictions = [
  // Round of 32 (Matches 1 to 16)
  // Let's predict South Africa (ZA) to win Match 1 (Incorrect! Canada won in reality)
  { matchId: 1, predictedWinner: 'South Africa', predictedWinnerCode: 'ZA', predictedHomeScore: 2, predictedAwayScore: 0, predictPenalties: false },
  // Predict Brazil (BR) to win Match 2 (Correct winner, different score: predicted 3-1, actual 2-0)
  { matchId: 2, predictedWinner: 'Brazil', predictedWinnerCode: 'BR', predictedHomeScore: 3, predictedAwayScore: 1, predictPenalties: false },
  // Predict Germany (DE) to win Match 3 (Correct winner, different score: predicted 2-1, actual 3-1)
  { matchId: 3, predictedWinner: 'Germany', predictedWinnerCode: 'DE', predictedHomeScore: 2, predictedAwayScore: 1, predictPenalties: false },
  // Predict Netherlands (NL) to win Match 4 (Correct winner, perfect score: 2-1)
  { matchId: 4, predictedWinner: 'Netherlands', predictedWinnerCode: 'NL', predictedHomeScore: 2, predictedAwayScore: 1, predictPenalties: false },
  // Predict Norway (NO) to win Match 5 (Incorrect! Ivory Coast won in reality)
  { matchId: 5, predictedWinner: 'Norway', predictedWinnerCode: 'NO', predictedHomeScore: 1, predictedAwayScore: 3, predictPenalties: false },
  // Predict France (FR) to win Match 6 (Correct winner, different score: predicted 3-0, actual 2-1)
  { matchId: 6, predictedWinner: 'France', predictedWinnerCode: 'FR', predictedHomeScore: 3, predictedAwayScore: 0, predictPenalties: false },
  // Predict Mexico (MX) to win Match 7 (Correct winner, perfect score: 2-1)
  { matchId: 7, predictedWinner: 'Mexico', predictedWinnerCode: 'MX', predictedHomeScore: 2, predictedAwayScore: 1, predictPenalties: false },
  // Predict England (GB) to win Match 8 (Correct winner, perfect score: 3-0)
  { matchId: 8, predictedWinner: 'England', predictedWinnerCode: 'GB', predictedHomeScore: 3, predictedAwayScore: 0, predictPenalties: false },
  // Predict Belgium (BE) to win Match 9 (Correct winner, different score: predicted 1-0, actual 2-0)
  { matchId: 9, predictedWinner: 'Belgium', predictedWinnerCode: 'BE', predictedHomeScore: 1, predictedAwayScore: 0, predictPenalties: false },
  // Predict USA (US) to win Match 10 (Correct winner, perfect score: 2-1)
  { matchId: 10, predictedWinner: 'USA', predictedWinnerCode: 'US', predictedHomeScore: 2, predictedAwayScore: 1, predictPenalties: false },
  // Predict Spain (ES) to win Match 11 (Correct winner, different score: predicted 4-0, actual 2-0)
  { matchId: 11, predictedWinner: 'Spain', predictedWinnerCode: 'ES', predictedHomeScore: 4, predictedAwayScore: 0, predictPenalties: false },
  // Predict Portugal (PT) to win Match 12 (Correct winner, incorrect score: predicted 2-0, actual 1-1 PEN)
  { matchId: 12, predictedWinner: 'Portugal', predictedWinnerCode: 'PT', predictedHomeScore: 2, predictedAwayScore: 0, predictPenalties: false },
  // Predict Algeria (DZ) to win Match 13 (Incorrect! Switzerland won in reality)
  { matchId: 13, predictedWinner: 'Algeria', predictedWinnerCode: 'DZ', predictedHomeScore: 1, predictedAwayScore: 2, predictPenalties: false },
  // Predict Egypt (EG) to win Match 14 (Incorrect! Australia won in reality)
  { matchId: 14, predictedWinner: 'Egypt', predictedWinnerCode: 'EG', predictedHomeScore: 0, predictedAwayScore: 1, predictPenalties: false },
  // Predict Argentina (AR) to win Match 15 (Correct winner, perfect score: 3-0)
  { matchId: 15, predictedWinner: 'Argentina', predictedWinnerCode: 'AR', predictedHomeScore: 3, predictedAwayScore: 0, predictPenalties: false },
  // Predict Ghana (GH) to win Match 16 (Incorrect! Colombia won in reality)
  { matchId: 16, predictedWinner: 'Ghana', predictedWinnerCode: 'GH', predictedHomeScore: 1, predictedAwayScore: 2, predictPenalties: false },

  // Round of 16 (Matches 17 to 24)
  // Match 17 user matchup: South Africa (ZA) vs Brazil (BR). (ZA is busted!). Predict ZA to win.
  { matchId: 17, predictedWinner: 'South Africa', predictedWinnerCode: 'ZA', predictedHomeScore: 2, predictedAwayScore: 1, predictPenalties: false },
  // Match 18 user matchup: Germany (DE) vs Netherlands (NL). (Correct matchup!). Predict Germany to win (actual 2-1). Correct score!
  { matchId: 18, predictedWinner: 'Germany', predictedWinnerCode: 'DE', predictedHomeScore: 2, predictedAwayScore: 1, predictPenalties: false },
  // Match 19 user matchup: Norway (NO) vs France (FR). (NO is busted!). Predict France to win.
  { matchId: 19, predictedWinner: 'France', predictedWinnerCode: 'FR', predictedHomeScore: 1, predictedAwayScore: 3, predictPenalties: false },
  // Match 20 user matchup: Mexico (MX) vs England (GB). (Correct matchup!). Predict England to win (actual 1-3). Correct score!
  { matchId: 20, predictedWinner: 'England', predictedWinnerCode: 'GB', predictedHomeScore: 1, predictedAwayScore: 3, predictPenalties: false },
  // Match 21 user matchup: Belgium (BE) vs USA (US). (Correct matchup!). Predict USA to win (actual 1-2). Correct score!
  { matchId: 21, predictedWinner: 'USA', predictedWinnerCode: 'US', predictedHomeScore: 1, predictedAwayScore: 2, predictPenalties: false },
  // Match 22 user matchup: Spain (ES) vs Portugal (PT). (Correct matchup!). Predict Spain to win (actual 2-1). Correct score!
  { matchId: 22, predictedWinner: 'Spain', predictedWinnerCode: 'ES', predictedHomeScore: 2, predictedAwayScore: 1, predictPenalties: false },
  // Match 23 user matchup: Algeria (DZ) vs Egypt (EG). (Both busted!). Predict Algeria to win.
  { matchId: 23, predictedWinner: 'Algeria', predictedWinnerCode: 'DZ', predictedHomeScore: 1, predictedAwayScore: 0, predictPenalties: false },
  // Match 24 user matchup: Argentina (AR) vs Ghana (GH). (GH is busted!). Predict Argentina to win (actual 2-0). Correct score!
  { matchId: 24, predictedWinner: 'Argentina', predictedWinnerCode: 'AR', predictedHomeScore: 2, predictedAwayScore: 0, predictPenalties: false },

  // Quarter-Finals (Matches 25 to 28)
  // Match 25 user matchup: South Africa vs Germany. (ZA is busted!).
  { matchId: 25, predictedWinner: 'Germany', predictedWinnerCode: 'DE', predictedHomeScore: 1, predictedAwayScore: 2, predictPenalties: false },
  // Match 26 user matchup: France vs England. (Correct matchup!). Predict England to win (actual 1-2). Correct score!
  { matchId: 26, predictedWinner: 'England', predictedWinnerCode: 'GB', predictedHomeScore: 1, predictedAwayScore: 2, predictPenalties: false },
  // Match 27 user matchup: USA vs Spain. (Correct matchup!). Predict Spain to win (actual 1-2). Correct score!
  { matchId: 27, predictedWinner: 'Spain', predictedWinnerCode: 'ES', predictedHomeScore: 1, predictedAwayScore: 2, predictPenalties: false },
  // Match 28 user matchup: Algeria vs Argentina. (Algeria is busted!).
  { matchId: 28, predictedWinner: 'Argentina', predictedWinnerCode: 'AR', predictedHomeScore: 0, predictedAwayScore: 3, predictPenalties: false },

  // Semi-Finals (Matches 29 to 30)
  // Match 29 user matchup: Germany vs England. (Germany is busted!).
  { matchId: 29, predictedWinner: 'England', predictedWinnerCode: 'GB', predictedHomeScore: 1, predictedAwayScore: 2, predictPenalties: false },
  // Match 30 user matchup: Spain vs Argentina. (Correct matchup!). Predict Argentina to win (actual 1-1 PEN). Correct score!
  { matchId: 30, predictedWinner: 'Argentina', predictedWinnerCode: 'AR', predictedHomeScore: 1, predictedAwayScore: 1, predictPenalties: true },

  // Finals (Match 31)
  // Match 31 user matchup: England vs Argentina. (England is busted! Actual was Brazil vs Argentina).
  { matchId: 31, predictedWinner: 'Argentina', predictedWinnerCode: 'AR', predictedHomeScore: 1, predictedAwayScore: 2, predictPenalties: false }
];

async function main() {
  let user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found, creating testing user: insen');
    user = await prisma.user.create({
      data: {
        username: 'insen',
        password: '$2b$10$FBel8xh/AAbmLDv1.nlBH.R1euucvvtqW.Y0HMLIpHTt.PskWiuUG', // 'password' hashed
        totalPoints: 0
      }
    });
  }

  console.log(`Setting up mixed predictions for user: ${user.username}`);
  await prisma.prediction.deleteMany({ where: { userId: user.id } });

  for (const p of testPredictions) {
    await prisma.prediction.create({
      data: {
        userId: user.id,
        matchId: p.matchId,
        predictedWinner: p.predictedWinner,
        predictedWinnerCode: p.predictedWinnerCode,
        predictedHomeScore: p.predictedHomeScore,
        predictedAwayScore: p.predictedAwayScore,
        predictPenalties: p.predictPenalties,
      }
    });
  }

  console.log('Predictions created. Running scoring engine...');
  await runScoringEngine();

  const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
  console.log(`Final total points for user ${user.username}: ${updatedUser?.totalPoints} PTS`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
