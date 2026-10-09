'use client';
import { useEffect } from 'react';
import { isLikelyTV } from '@/lib/tv-navigation';

/**
 * TVNativeShell — faz a app empacotada (APK Android TV: TWA ou WebView) comportar-se
 * como um programa nativo, ao estilo do VS Code / apps Electron: sem nenhum dos
 * "tiques" de página web. Só actua em TV (isLikelyTV()); em telemóvel/desktop não
 * faz nada. O visual vive em app/tv-native.css, escopado a `html.tv-app`.
 *
 *  - sem menu de contexto, sem selecção de texto (excepto em campos de escrita),
 *    sem arrastar imagens/links, sem zoom por gesto/teclado/roda;
 *  - sem recarregar com F5/Ctrl+R (a app não é uma página que se "atualiza");
 *  - cursor do rato escondido enquanto se navega com o comando (D-pad), e de volta
 *    assim que o rato/air-mouse se mexe — nunca fica uma TV sem cursor utilizável.
 */
const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

function inEditable(t: EventTarget | null): boolean {
  return t instanceof Element && !!t.closest(EDITABLE);
}

export default function TVNativeShell() {
  useEffect(() => {
    if (!isLikelyTV()) return;
    const root = document.documentElement;
    root.classList.add('tv-mode', 'tv-app', 'tv-kbd');

    const onContext = (e: Event) => { if (!inEditable(e.target)) e.preventDefault(); };
    const onSelect  = (e: Event) => { if (!inEditable(e.target)) e.preventDefault(); };
    const onDrag    = (e: Event) => e.preventDefault();
    const onGesture = (e: Event) => e.preventDefault();
    const onWheel   = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      root.classList.add('tv-kbd');
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === 'F5' || (mod && (e.key === 'r' || e.key === 'R'))) e.preventDefault();
      if (mod && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) e.preventDefault();
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') root.classList.remove('tv-kbd');
    };

    document.addEventListener('contextmenu', onContext);
    document.addEventListener('selectstart', onSelect);
    document.addEventListener('dragstart', onDrag);
    document.addEventListener('gesturestart', onGesture as EventListener);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('selectstart', onSelect);
      document.removeEventListener('dragstart', onDrag);
      document.removeEventListener('gesturestart', onGesture as EventListener);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);
  return null;
}
