import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import Navbar from '@/components/Navbar';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'World Cup 2026 Bracket Predictor',
  description: 'Predict the outcomes of the FIFA World Cup 2026 matches and compete on the global leaderboard!',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  let user = null;

  if (session?.user) {
    const dbUser = await prisma.user.findUnique({
      where: { username: (session.user as any).username },
      select: { username: true, totalPoints: true },
    });
    if (dbUser) {
      user = {
        username: dbUser.username,
        totalPoints: dbUser.totalPoints,
      };
    }
  }

  return (
    <html lang="en" className="dark h-full bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      <body className={`${inter.className} flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black`}>
        <SessionProvider>
          <Navbar user={user} />
          <main className="flex-1 w-full py-6">
            {children}
          </main>
          <footer className="w-full py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              <p>© {new Date().getFullYear()} World Cup 2026 Bracket Predictor. Built for FIFA World Cup 2026. All rights reserved.</p>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
