'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface NavbarProps {
  user: {
    username: string;
    totalPoints: number;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl transition-transform duration-300 group-hover:scale-110">🏆</span>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 tracking-wider text-lg sm:text-xl">
                WC2026 BRACKET
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                isActive('/')
                  ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Tournament Bracket
            </Link>
            <Link
              href="/leaderboard"
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                isActive('/leaderboard')
                  ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Leaderboard
            </Link>
            <Link
              href="/rules"
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                isActive('/rules')
                  ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Rules
            </Link>
            <Link
              href="/games"
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                isActive('/games')
                  ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Games
            </Link>
          </div>

          {/* User Auth Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium text-slate-200">{user.username}</span>
                  <span className="text-xs text-slate-400">Predictor</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {user.totalPoints} PTS
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-400 hover:bg-red-950/20 text-xs sm:text-sm font-medium transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation footer/bar for small screens */}
      <div className="md:hidden flex justify-around border-t border-slate-800/60 bg-slate-950/95 py-2">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${
            isActive('/') ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>⚽</span>
          <span>Bracket</span>
        </Link>
        <Link
          href="/leaderboard"
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${
            isActive('/leaderboard') ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📊</span>
          <span>Leaderboard</span>
        </Link>
        <Link
          href="/rules"
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${
            isActive('/rules') ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📋</span>
          <span>Rules</span>
        </Link>
        <Link
          href="/games"
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${
            isActive('/games') ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🏟️</span>
          <span>Games</span>
        </Link>
      </div>
    </nav>
  );
}
