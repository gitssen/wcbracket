'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { runScoringEngine } from '@/lib/scoring';

export interface PredictionInput {
  matchId: number;
  predictedWinner: string;
  predictedWinnerCode: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictPenalties: boolean;
}

export async function saveBracket(predictions: PredictionInput[]) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return { error: 'You must be logged in to save your bracket predictions.' };
  }

  const userId = (session.user as any).id;

  try {
    // Check if user has already submitted
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.hasSubmitted) {
      return { error: 'Predictions are locked. You have already submitted your bracket.' };
    }

    // Perform bulk upserts and lock the bracket in a transaction
    await prisma.$transaction([
      ...predictions.map((pred) =>
        prisma.prediction.upsert({
          where: {
            userId_matchId: {
              userId,
              matchId: pred.matchId,
            },
          },
          update: {
            predictedWinner: pred.predictedWinner,
            predictedWinnerCode: pred.predictedWinnerCode,
            predictedHomeScore: pred.predictedHomeScore,
            predictedAwayScore: pred.predictedAwayScore,
            predictPenalties: pred.predictPenalties,
          },
          create: {
            userId,
            matchId: pred.matchId,
            predictedWinner: pred.predictedWinner,
            predictedWinnerCode: pred.predictedWinnerCode,
            predictedHomeScore: pred.predictedHomeScore,
            predictedAwayScore: pred.predictedAwayScore,
            predictPenalties: pred.predictPenalties,
          },
        })
      ),
      prisma.user.update({
        where: { id: userId },
        data: { hasSubmitted: true },
      }),
    ]);

    // Run scoring immediately so points appear on leaderboard without waiting for cron
    try {
      await runScoringEngine();
    } catch (e) {
      console.error('Post-lock scoring failed:', e);
    }

    revalidatePath('/');
    revalidatePath('/leaderboard');
    return { success: true };
  } catch (error: any) {
    console.error('Save bracket error:', error);
    return { error: 'Failed to save predictions. Please try again.' };
  }
}
