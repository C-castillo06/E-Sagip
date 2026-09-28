'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { THEMES } from '../lib/themes';
import { getSession, clearSession } from '../lib/auth';

// ========================================
// SESSION
//
// Loads the session from storage, validates
// it against known roles/themes, and redirects
// to /login if it's missing or invalid.
// ========================================

export function useSession() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const s = getSession();

    if (!s || !THEMES[s.role]) {
      clearSession();
      router.replace('/login');
      return;
    }

    setSession(s);
  }, [router]);

  const logout = () => {
    clearSession();
    router.replace('/');
  };

  return { session, logout };
}
