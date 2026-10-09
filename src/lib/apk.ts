// lib/apk.ts — download do app Android (APK)
//
// O URL de download directo vem da variável de ambiente NEXT_PUBLIC_APK_URL
// (definir no painel de envs do EdgeOne Pages; como é NEXT_PUBLIC_*, é lida no
// BUILD — depois de a alterar é preciso fazer um novo deploy).

export const APK_URL: string = (process.env.NEXT_PUBLIC_APK_URL || '').trim();

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

/**
 * Inicia o download do APK SEM sair da página (precisa de ser chamado a partir
 * de um gesto do utilizador, p.ex. onClick). Devolve false se não há URL.
 */
export function startApkDownload(): boolean {
  if (!APK_URL || typeof document === 'undefined') return false;
  const a = document.createElement('a');
  a.href = APK_URL;
  a.download = 'pixgo.apk';
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 1000);
  return true;
}
