import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import BracketPredictor from '@/components/BracketPredictor';

export const revalidate = 0;

export default async function ViewBracketPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const session = await getServerSession(authOptions);

  // Access control: must be logged in
  if (!session?.user || !(session.user as any).id) {
    redirect('/leaderboard');
  }

  const viewerId = (session.user as any).id;

  // Access control: viewer must have submitted
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { hasSubmitted: true },
  });

  if (!viewer?.hasSubmitted) {
    redirect('/leaderboard');
  }

  // Access control: target user must exist and have submitted
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, hasSubmitted: true },
  });

  if (!targetUser || !targetUser.hasSubmitted) {
    redirect('/leaderboard');
  }

  // Fetch target user's predictions and all matches
  const [matches, predictions] = await Promise.all([
    prisma.match.findMany({ orderBy: { id: 'asc' } }),
    prisma.prediction.findMany({ where: { userId: targetUser.id } }),
  ]);

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

  const formattedPredictions = predictions.map((p) => ({
    matchId: p.matchId,
    predictedWinner: p.predictedWinner,
    predictedWinnerCode: p.predictedWinnerCode,
    predictedHomeScore: p.predictedHomeScore,
    predictedAwayScore: p.predictedAwayScore,
    predictPenalties: p.predictPenalties,
  }));

  return (
    <div className="py-2 w-full max-w-[200rem] mx-auto px-4 sm:px-8 lg:px-12">
      <BracketPredictor
        key={targetUser.id}
        initialMatches={formattedMatches}
        initialPredictions={formattedPredictions}
        isLocked={true}
        viewOnly={true}
        viewingUsername={targetUser.username}
      />
    </div>
  );
}
