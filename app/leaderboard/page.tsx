import React from 'react';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const revalidate = 0; // Disable caching for real-time points

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const currentUsername = session?.user?.name || null;
  const currentUserId = (session?.user as any)?.id || null;

  // Fetch current user's submission status
  let viewerHasSubmitted = false;
  if (currentUserId) {
    const viewer = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { hasSubmitted: true },
    });
    viewerHasSubmitted = viewer?.hasSubmitted ?? false;
  }

  // Query users from database ordered by totalPoints descending
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      totalPoints: true,
      hasSubmitted: true,
    },
    orderBy: {
      totalPoints: 'desc',
    },
  });

  return (
    <div className="py-6 sm:py-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          🏆 Global Predictor Leaderboard
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          See where you stand among all predictors. Scores are updated live as matches finish.
        </p>
      </div>

      {/* Podium for Top 3 */}
      {users.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-lg mx-auto mb-12 px-4">
          {/* 2nd Place */}
          {users[1] && (
            <div className="flex flex-col items-center">
              <div className="text-slate-400 font-extrabold text-sm mb-1">2nd</div>
              <div className="w-full bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-t-xl p-4 flex flex-col items-center text-center shadow-lg h-32 justify-center">
                <span className="text-2xl mb-1">🥈</span>
                <span className="text-xs sm:text-sm font-bold text-slate-200 truncate w-full max-w-[100px]">
                  {users[1].username}
                </span>
                <span className="text-emerald-400 font-extrabold text-xs mt-1">
                  {users[1].totalPoints} PTS
                </span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {users[0] && (
            <div className="flex flex-col items-center scale-105 sm:scale-110">
              <div className="text-amber-400 font-extrabold text-sm mb-1">1st</div>
              <div className="w-full bg-gradient-to-b from-amber-500/20 to-slate-900 border border-amber-500/40 backdrop-blur-md rounded-t-xl p-4 flex flex-col items-center text-center shadow-xl shadow-amber-500/5 h-36 justify-center">
                <span className="text-3xl mb-1">👑</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-200 truncate w-full max-w-[100px]">
                  {users[0].username}
                </span>
                <span className="text-amber-400 font-extrabold text-sm mt-1">
                  {users[0].totalPoints} PTS
                </span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {users[2] && (
            <div className="flex flex-col items-center">
              <div className="text-amber-700 font-extrabold text-sm mb-1">3rd</div>
              <div className="w-full bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-t-xl p-4 flex flex-col items-center text-center shadow-lg h-28 justify-center">
                <span className="text-2xl mb-1">🥉</span>
                <span className="text-xs sm:text-sm font-bold text-slate-300 truncate w-full max-w-[100px]">
                  {users[2].username}
                </span>
                <span className="text-emerald-400 font-extrabold text-xs mt-1">
                  {users[2].totalPoints} PTS
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Predictor Name
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Score Aggregate
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Bracket
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-transparent">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    No predictors have signed up yet. Be the first!
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const isCurrentUser = user.username === currentUsername;
                  const rank = index + 1;

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors duration-150 ${
                        isCurrentUser
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/15 font-semibold text-emerald-300'
                          : 'hover:bg-slate-800/20'
                      }`}
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          {rank === 1 && <span className="text-base">🥇</span>}
                          {rank === 2 && <span className="text-base">🥈</span>}
                          {rank === 3 && <span className="text-base">🥉</span>}
                          {rank > 3 && <span className="text-slate-400 pl-1">{rank}</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={isCurrentUser ? 'text-emerald-300 font-bold' : 'text-slate-200 font-medium'}>
                            {user.username}
                          </span>
                          {isCurrentUser && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-right">
                        <span className={`font-extrabold text-sm ${isCurrentUser ? 'text-emerald-300' : 'text-emerald-400'}`}>
                          {user.totalPoints} PTS
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-center">
                        {!currentUserId ? (
                          <span className="text-xs text-slate-600">Log in to view</span>
                        ) : !viewerHasSubmitted ? (
                          <span className="text-xs text-slate-500">Lock yours first</span>
                        ) : !user.hasSubmitted ? (
                          <span className="text-xs text-slate-600">Pending</span>
                        ) : isCurrentUser ? (
                          <a
                            href="/"
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                          >
                            Your Bracket
                          </a>
                        ) : (
                          <a
                            href={`/bracket/${user.id}`}
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors"
                          >
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
