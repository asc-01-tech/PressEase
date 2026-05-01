'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?from=' + encodeURIComponent(pathname));
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Spinner size={32} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading PressEase…</p>
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}
