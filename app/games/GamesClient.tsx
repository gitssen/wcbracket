'use client';

import React, { useState } from 'react';
import Flag from 'react-world-flags';
import { getIsoCode } from '@/lib/teamCodeMap';

interface Match {
  id: number;
  round: string;
  homeTeam: string;
  homeCode: string;
  awayTeam: string;
  awayCode: string;
  homeScore: number | null;
  awayScore: number | null;
  wentToPenalties: boolean;
  actualWinner: string | null;
  actualWinnerCode: string | null;
  isCompleted: boolean;
  kickoffTime: string | null;
}

const ROUND_ORDER = [
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'FINALS',
] as const;

const ROUND_LABELS: Record<string, string> = {
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-Finals',
  SEMI_FINALS: 'Semi-Finals',
  FINALS: 'Final',
};

function formatKickoff(utcDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(utcDate)) + ' PT';
}

function RenderFlag({ code }: { code: string }) {
  if (!code || code.trim() === '') {
    return (
      <div className="w-7 h-5 bg-slate-800 border border-slate-700 flex items-center justify-center rounded-sm text-[10px] text-slate-500">
        TBD
      </div>
    );
  }
  return (
    <Flag
      code={getIsoCode(code)}
      className="w-7 h-5 object-cover rounded-sm shadow-sm border border-slate-800/40"
      fallback={
        <div className="w-7 h-5 bg-slate-800 border border-slate-700 flex items-center justify-center rounded-sm text-[10px] text-slate-500">
          {code}
        </div>
      }
    />
  );
}

function GameCard({ match }: { match: Match }) {
  const isHomeWinner = match.isCompleted && match.actualWinnerCode === match.homeCode;
  const isAwayWinner = match.isCompleted && match.actualWinnerCode === match.awayCode;
  const hasTBD = !match.homeCode || !match.awayCode || match.homeTeam === 'TBD' || match.awayTeam === 'TBD';

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${
      match.isCompleted
        ? 'bg-slate-900/60 border-emerald-500/15'
        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Header row: match number + status/time */}
      <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>{match.homeTeam} vs {match.awayTeam}</span>
        {match.isCompleted ? (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px]">
            Full Time
          </span>
        ) : match.kickoffTime ? (
          <span className="normal-case text-slate-400 font-medium tracking-normal text-[11px]">
            {formatKickoff(match.kickoffTime)}
          </span>
        ) : (
          <span className="text-slate-600">TBD</span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="flex flex-col gap-2">
        {/* Home team */}
        <div className={`flex items-center justify-between px-2.5 py-2 rounded-lg ${
          isHomeWinner ? 'bg-emerald-950/25 border border-emerald-500/20' : 'border border-transparent'
        }`}>
          <div className="flex items-center gap-2.5">
            <RenderFlag code={match.homeCode} />
            <span className={`text-sm font-semibold ${isHomeWinner ? 'text-white' : 'text-slate-300'}`}>
              {match.homeTeam}
            </span>
            {isHomeWinner && (
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-extrabold uppercase">
                WIN
              </span>
            )}
          </div>
          {match.isCompleted && (
            <span className={`text-lg font-black tabular-nums ${isHomeWinner ? 'text-emerald-400' : 'text-slate-400'}`}>
              {match.homeScore}
            </span>
          )}
        </div>

        {/* Away team */}
        <div className={`flex items-center justify-between px-2.5 py-2 rounded-lg ${
          isAwayWinner ? 'bg-emerald-950/25 border border-emerald-500/20' : 'border border-transparent'
        }`}>
          <div className="flex items-center gap-2.5">
            <RenderFlag code={match.awayCode} />
            <span className={`text-sm font-semibold ${isAwayWinner ? 'text-white' : 'text-slate-300'}`}>
              {match.awayTeam}
            </span>
            {isAwayWinner && (
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-extrabold uppercase">
                WIN
              </span>
            )}
          </div>
          {match.isCompleted && (
            <span className={`text-lg font-black tabular-nums ${isAwayWinner ? 'text-emerald-400' : 'text-slate-400'}`}>
              {match.awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Penalties badge */}
      {match.isCompleted && match.wentToPenalties && (
        <div className="mt-2 text-center">
          <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            After Penalties
          </span>
        </div>
      )}

      {/* Upcoming match with no teams yet */}
      {hasTBD && !match.isCompleted && (
        <div className="mt-1 text-center">
          <span className="text-[10px] text-slate-600 italic">Teams TBD</span>
        </div>
      )}
    </div>
  );
}

export default function GamesClient({ matches }: { matches: Match[] }) {
  const [activeRound, setActiveRound] = useState<string>('ROUND_OF_32');

  const matchesByRound = ROUND_ORDER.reduce((acc, round) => {
    acc[round] = matches
      .filter((m) => m.round === round)
      .sort((a, b) => {
        if (a.kickoffTime && b.kickoffTime) return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
        if (a.kickoffTime) return -1;
        if (b.kickoffTime) return 1;
        return a.id - b.id;
      });
    return acc;
  }, {} as Record<string, Match[]>);

  const completedCount = matches.filter((m) => m.isCompleted).length;

  return (
    <div className="py-6 sm:py-8 max-w-4xl mx-auto px-4">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Games
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          {completedCount} of {matches.length} matches completed
        </p>
      </div>

      {/* Round Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {ROUND_ORDER.map((round) => {
          const roundMatches = matchesByRound[round];
          const roundCompleted = roundMatches.filter((m) => m.isCompleted).length;
          return (
            <button
              key={round}
              onClick={() => setActiveRound(round)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                activeRound === round
                  ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border-transparent'
              }`}
            >
              {ROUND_LABELS[round]}
              {roundCompleted > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {roundCompleted}/{roundMatches.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {matchesByRound[activeRound]?.map((match) => (
          <GameCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
