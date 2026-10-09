// lib/apk.ts — download dos apps Android (APK)
//
// Variáveis de ambiente (definir no painel de envs do EdgeOne Pages; como são
// NEXT_PUBLIC_*, são lidas no BUILD — depois de as alterar é preciso novo deploy):
//   NEXT_PUBLIC_APK_URL     → APK Android MOBILE (modal + página /baixar)
//   NEXT_PUBLIC_APK_TV_URL  → APK Android TV / TV Box (SÓ dentro da página /baixar)
//   NEXT_PUBLIC_APK_HOSTS   → hosts onde o modal e a página existem (padrão:
//                             pixgo.qzz.io,www.pixgo.qzz.io). Noutros hosts (hub,
//                             resumeforge, previews) nada disto aparece.

import { isLikelyTV } from './tv-navigation';

export const APK_URL: string    = (process.env.NEXT_PUBLIC_APK_URL || '').trim();
export const APK_TV_URL: string = (process.env.NEXT_PUBLIC_APK_TV_URL || '').trim();

export type ApkTarget = 'mobile' | 'tv';

const DEFAULT_APK_HOSTS = 'pixgo.qzz.io,www.pixgo.qzz.io';

/** true só no site pixgo.qzz.io / www.pixgo.qzz.io (e em localhost fora de produção). */
export function isApkSiteHost(): boolean {
  if (typeof location === 'undefined') return false;
  const host = location.hostname.toLowerCase();
  const allowed = (process.env.NEXT_PUBLIC_APK_HOSTS || DEFAULT_APK_HOSTS)
    .split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
  if (allowed.includes(host)) return true;
  return process.env.NODE_ENV !== 'production' && (host === 'localhost' || host === '127.0.0.1');
}

/** true quando o browser corre num telemóvel/tablet Android. */
export function isAndroidBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

/** true quando o site já corre como app instalada (PWA standalone). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// Marca "já viu o convite": sessionStorage (este separador) + cookie de sessão
// partilhado em *.pixgo.qzz.io — o hub (app.pixgo.qzz.io) mostra o mesmo convite
// no ecrã de login e escreve este cookie, para a pessoa não o ver duas vezes.
const SEEN_KEY    = 'pixgo_apk_modal_seen';
const SEEN_COOKIE = 'pixgo_apk_seen';

export function hasApkSeen(): boolean {
  try { if (sessionStorage.getItem(SEEN_KEY) === '1') return true; } catch {}
  try { return document.cookie.split('; ').some(c => c === `${SEEN_COOKIE}=1`); } catch { return false; }
}

export function markApkSeen(): void {
  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch {}
  try {
    const shared = /(^|\.)pixgo\.qzz\.io$/.test(location.hostname) ? '; Domain=.pixgo.qzz.io' : '';
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${SEEN_COOKIE}=1; Path=/; SameSite=Lax${shared}${secure}`;
  } catch {}
}

// "Não mostrar novamente": persistente (localStorage + cookie de 1 ano partilhado em
// *.pixgo.qzz.io, para valer também entre pixgo.qzz.io e www.pixgo.qzz.io).
const NEVER_KEY    = 'pixgo_apk_modal_never';
const NEVER_COOKIE = 'pixgo_apk_never';

export function hasApkNever(): boolean {
  try { if (localStorage.getItem(NEVER_KEY) === '1') return true; } catch {}
  try { return document.cookie.split('; ').some(c => c === `${NEVER_COOKIE}=1`); } catch { return false; }
}

export function markApkNever(): void {
  try { localStorage.setItem(NEVER_KEY, '1'); } catch {}
  try {
    const shared = /(^|\.)pixgo\.qzz\.io$/.test(location.hostname) ? '; Domain=.pixgo.qzz.io' : '';
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${NEVER_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax${shared}${secure}`;
  } catch {}
  markApkSeen();
}

/**
 * Convite do modal: só no site, em browsers Android (telemóvel/tablet), fora de
 * TV e da app instalada, com URL do APK mobile definido e 1x por sessão.
 */
export function shouldOfferApkModal(): boolean {
  if (typeof window === 'undefined') return false;
  if (!APK_URL || !isApkSiteHost()) return false;
  if (!isAndroidBrowser() || isLikelyTV() || isStandalone()) return false;
  return !hasApkNever() && !hasApkSeen();
}

/**
 * Inicia o download do APK SEM sair da página (precisa de ser chamado a partir
 * de um gesto do utilizador, p.ex. onClick). Devolve false se não há URL.
 *
 *  - startApkDownload()      → APK mobile (é o que o modal usa)
 *  - startApkDownload('tv')  → APK Android TV / TV Box (só na página /baixar)
 */
export function startApkDownload(target: ApkTarget = 'mobile'): boolean {
  const url  = target === 'tv' ? APK_TV_URL : APK_URL;
  const name = target === 'tv' ? 'pixgo-tv.apk' : 'pixgo.apk';
  if (!url || typeof document === 'undefined') return false;
  const a = document.createElement('a');
  a.href = url;
  a.download = name;   // ignorado em links de outro domínio; quem força o download é o Content-Disposition do Cloudflare Pages (_headers)
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 1000);
  return true;
}
