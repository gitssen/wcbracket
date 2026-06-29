import { prisma } from '@/lib/db';
import GamesClient from './GamesClient';

export const revalidate = 0;

export default async function GamesPage() {
  const [matches, predictions] = await Promise.all([
    prisma.match.findMany({ orderBy: { id: 'asc' } }),
    prisma.prediction.findMany({
      where: { user: { hasSubmitted: true } },
      include: { user: { select: { username: true } } },
    }),
  ]);

  const predictionsByMatch: Record<number, Array<{
    username: string;
    predictedWinner: string;
    predictedWinnerCode: string;
    predictedHomeScore: number;
    predictedAwayScore: number;
    predictPenalties: boolean;
  }>> = {};

  for (const p of predictions) {
    if (!predictionsByMatch[p.matchId]) predictionsByMatch[p.matchId] = [];
    predictionsByMatch[p.matchId].push({
      username: p.user.username,
      predictedWinner: p.predictedWinner,
      predictedWinnerCode: p.predictedWinnerCode,
      predictedHomeScore: p.predictedHomeScore,
      predictedAwayScore: p.predictedAwayScore,
      predictPenalties: p.predictPenalties,
    });
  }

  return <GamesClient matches={matches} predictionsByMatch={predictionsByMatch} />;
}
