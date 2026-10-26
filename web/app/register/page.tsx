'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /register is no longer used — we use Google OAuth exclusively.
 * Redirect anyone who navigates here to /login immediately.
 */
export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
