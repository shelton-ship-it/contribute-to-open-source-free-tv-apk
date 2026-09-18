'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import AppShell from '@/components/layout/AppShell';
import MobileNav from '@/components/layout/MobileNav';
import PixelChatbot from '@/components/PixelChatbot';
import AdblockGuard from '@/components/AdblockGuard';
import { loginRedirectUrl } from '@/lib/auth-redirect';
import { resumeInterruptedDownloads } from '@/lib/downloads-resume';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const token    = useAuthStore(s => s.token);
  const hydrated = useAuthStore(s => s.hydrated);

  useEffect(() => {
    // FIX: preserva a página actual (ex.: /main/watch/123) no return_to,
    // para o hub devolver o utilizador exactamente aqui depois do login —
    // antes caía sempre em /main (ver src/lib/auth-redirect.ts).
    if (hydrated && !token) router.replace(loginRedirectUrl());
  }, [hydrated, token]);

  useEffect(() => {
    // FIX: retoma automaticamente qualquer download que tenha ficado a
    // meio (refresh, fecho da aba, queda de rede) assim que há sessão —
    // sem isto, o download ficava parado para sempre em X% até o
    // utilizador reabrir manualmente o título e clicar em Baixar de novo.
    if (hydrated && token) resumeInterruptedDownloads();
  }, [hydrated, token]);

  if (!hydrated) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg-dark)' }}>
      <div className="loading-ring" />
    </div>
  );

  if (!token) return null;

  return (
    <>
      <AppShell>{children}</AppShell>
      {/* Bottom nav only on mobile */}
      <MobileNav />
      <PixelChatbot />
      <AdblockGuard />
    </>
  );
}
