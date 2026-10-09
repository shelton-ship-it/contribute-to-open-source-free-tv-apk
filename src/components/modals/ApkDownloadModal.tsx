'use client';
/**
 * ApkDownloadModal — convite para baixar a app Android.
 *
 * Aparece logo à entrada no site (uma vez por sessão do navegador), só em:
 *  - browsers Android (não faz sentido em desktop/iOS);
 *  - fora de TV e fora da app instalada;
 *  - quando NEXT_PUBLIC_APK_URL está definida.
 * "Continuar no site" fecha e não volta a aparecer nesta sessão.
 * "Baixar" inicia o download e abre a página pública /baixar com as instruções.
 */
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AndroidIcon from '@mui/icons-material/Android';
import DownloadIcon from '@mui/icons-material/Download';
import { APK_URL, isAndroidBrowser, isStandalone, startApkDownload } from '@/lib/apk';
import { isLikelyTV } from '@/lib/tv-navigation';

const SEEN_KEY = 'pixgo_apk_modal_seen';
// Páginas onde o convite não faz sentido (a própria página de instruções, embeds e player offline).
const EXCLUDED = ['/baixar', '/embed', '/offline', '/offline-player'];

export default function ApkDownloadModal() {
  const { t }    = useTranslation();
  const router   = useRouter();
  const pathname = usePathname() || '';
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!APK_URL) return;
    if (EXCLUDED.some(p => pathname === p || pathname.startsWith(p + '/'))) { setShow(false); return; }
    if (!isAndroidBrowser() || isLikelyTV() || isStandalone()) return;
    try { if (sessionStorage.getItem(SEEN_KEY) === '1') return; } catch {}
    setShow(true);
  }, [pathname]);

  const close = () => {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch {}
    setShow(false);
  };

  const download = () => {
    startApkDownload();          // dentro do clique (gesto do utilizador)
    close();
    router.push('/baixar?started=1');
  };

  if (!show) return null;

  return (
    <div role="dialog" aria-modal="true" data-modal="true" className="modal-overlay" style={{ zIndex: 99990 }}>
      <div className="modal" style={{ maxWidth: 420, animation: 'scaleIn 0.2s ease', textAlign: 'center' }}>
        <div style={{ padding: '26px 22px 8px' }}>
          <img src="/logo.svg" alt="Pixgo" style={{ height: 34, width: 'auto', display: 'block', margin: '0 auto 18px' }} />
          <div style={{
            width: 58, height: 58, borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.22)',
          }}>
            <AndroidIcon style={{ fontSize: 32, color: 'var(--color-primary)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.25 }}>
            {t('apk.modalTitle')}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
            {t('apk.modalText')}
          </p>
        </div>

        <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary btn-lg" onClick={download} style={{ justifyContent: 'center', width: '100%' }}>
            <DownloadIcon style={{ fontSize: 20 }} />
            {t('apk.download')}
          </button>
          <button className="btn btn-secondary" onClick={close} style={{ justifyContent: 'center', width: '100%' }}>
            {t('apk.continueSite')}
          </button>
        </div>
      </div>
    </div>
  );
}
