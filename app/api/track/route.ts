import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';

const ALLOWED_ACTIONS = ['page_view', 'bracket_view', 'login', 'signup', 'bracket_lock'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, path, meta } = await request.json();

    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const username = (session.user as any).username;

    await turso.execute({
      sql: 'INSERT INTO ActivityLog (userId, username, action, path, meta) VALUES (?, ?, ?, ?, ?)',
      args: [userId, username, action, path ?? null, meta ? JSON.stringify(meta) : null],
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
