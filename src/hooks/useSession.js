'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { THEMES } from '../lib/themes';
import { getOperatorProfile, clearSession } from '../lib/auth';

export function useSession() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) {
        if (alive) { setSession(null); router.replace('/login'); }
        return;
      }
      try {
        const profile = await getOperatorProfile(user.uid);
        const role = profile?.department || profile?.role;
        if (!alive) return;
        if (!profile || !['APPROVED', 'ACTIVE'].includes(profile.approvalStatus) || !THEMES[role]) {
          await clearSession();
          if (alive) router.replace('/login');
          return;
        }
        setSession({ ...profile, role, email: user.email || profile.email });
      } catch (error) {
        console.error('Unable to load operator profile:', error);
        if (alive) { setSession(null); router.replace('/login'); }
      }
    });
    return () => { alive = false; unsubscribe(); };
  }, [router]);

  const logout = async () => {
    await clearSession();
    router.replace('/');
  };

  return { session, logout };
}
