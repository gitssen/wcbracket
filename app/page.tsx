import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import BracketPredictor from '@/components/BracketPredictor';

export const revalidate = 0; // Disable server cache to ensure fresh state

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Fetch all matches from the database sorted by ID
  const matches = await prisma.match.findMany({
    orderBy: { id: 'asc' },
  });

  // Fetch user predictions and lock status if logged in
  let predictions: any[] = [];
  let isLocked = false;
  if (session?.user && (session.user as any).id) {
    const [userPredictions, user] = await Promise.all([
      prisma.prediction.findMany({
        where: { userId: (session.user as any).id },
      }),
      prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { hasSubmitted: true },
      }),
    ]);
    predictions = userPredictions;
    isLocked = user?.hasSubmitted ?? false;
  }

  console.log('--- ROOT PAGE REQUEST ---');
  console.log('Session user:', session?.user);
  console.log('Loaded predictions count:', predictions.length);

  // Map database model fields to predictions array
  const formattedPredictions = predictions.map((p) => ({
    matchId: p.matchId,
    predictedWinner: p.predictedWinner,
    predictedWinnerCode: p.predictedWinnerCode,
    predictedHomeScore: p.predictedHomeScore,
    predictedAwayScore: p.predictedAwayScore,
    predictPenalties: p.predictPenalties,
  }));

  // Map database matches to match representation
  const formattedMatches = matches.map((m) => ({
    id: m.id,
    round: m.round,
    homeTeam: m.homeTeam,
    homeCode: m.homeCode,
    awayTeam: m.awayTeam,
    awayCode: m.awayCode,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    wentToPenalties: m.wentToPenalties,
    actualWinner: m.actualWinner,
    actualWinnerCode: m.actualWinnerCode,
    isCompleted: m.isCompleted,
    nextMatchId: m.nextMatchId,
    isHomeInNext: m.isHomeInNext,
  }));

  return (
    <div className="py-2 w-full max-w-[200rem] mx-auto px-4 sm:px-8 lg:px-12">
      <BracketPredictor
        key={(session.user as any).id}
        initialMatches={formattedMatches}
        initialPredictions={formattedPredictions}
        isLocked={isLocked}
      />
    </div>
  );
}
