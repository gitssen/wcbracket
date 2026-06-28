import { prisma } from '@/lib/db';
import GamesClient from './GamesClient';

export const revalidate = 0;

export default async function GamesPage() {
  const matches = await prisma.match.findMany({
    orderBy: { id: 'asc' },
  });

  return <GamesClient matches={matches} />;
}
