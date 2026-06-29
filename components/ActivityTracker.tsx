'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

export default function ActivityTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.user || !pathname || pathname === lastTrackedPath.current) return;
    lastTrackedPath.current = pathname;

    // Determine action type
    const bracketMatch = pathname.match(/^\/bracket\/(.+)$/);
    const action = bracketMatch ? 'bracket_view' : 'page_view';
    const meta = bracketMatch ? { targetUserId: bracketMatch[1] } : undefined;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, path: pathname, meta }),
    }).catch(() => {});
  }, [pathname, session]);

  return null;
}
