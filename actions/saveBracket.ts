'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

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
    // Perform bulk upserts using a transaction
    await prisma.$transaction(
      predictions.map((pred) =>
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
      )
    );

    revalidatePath('/');
    revalidatePath('/leaderboard');
    return { success: true };
  } catch (error: any) {
    console.error('Save bracket error:', error);
    return { error: 'Failed to save predictions. Please try again.' };
  }
}
