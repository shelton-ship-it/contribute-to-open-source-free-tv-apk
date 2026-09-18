// lib/auth-redirect.ts
// ── Redirecionamento para login preservando a página actual ─────────────────
//
// FIX: todos os pontos que mandavam o utilizador para /auth/login faziam
// router.push('/auth/login') sem return_to. O stub em app/auth/login/page.tsx
// já sabe reencaminhar de volta para return_to depois do login no hub
// (app.pixgo.qzz.io) — mas sem este parâmetro ele caía sempre no fallback
// (${origin}/main), perdendo a página onde o utilizador estava (ex.: a
// meio de um vídeo, num canal específico, etc.).
//
// Uso: loginRedirectUrl() devolve o caminho local com return_to já
// preenchido com a URL actual completa — usar com router.push(...).

export function loginRedirectUrl(path: '/auth/login' | '/auth/register' = '/auth/login'): string {
  if (typeof window === 'undefined') return path;
  const returnTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  return `${path}?return_to=${encodeURIComponent(returnTo)}`;
}
