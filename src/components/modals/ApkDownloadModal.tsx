'use client';
/**
 * ApkDownloadModal — convite para baixar a app Android (APK MOBILE).
 *
 * Só existe no SITE (pixgo.qzz.io / www.pixgo.qzz.io — ver isApkSiteHost em lib/apk.ts).
 * No hub (app.pixgo.qzz.io), resumeforge e outras plataformas nada disto aparece.
 *
 * Dois pontos de entrada:
 *  1) Montado globalmente em Providers (sem props): aparece a quem JÁ TEM SESSÃO.
 *  2) <ApkDownloadModal standalone onFinish={...} /> no stub /auth/login: aparece a quem
 *     chega ao site SEM sessão, ANTES de seguir para o login do hub. "Continuar no site"
 *     chama onFinish (que faz o redirecionamento para o hub).
 *
 * Condições (shouldOfferApkModal): host do site, browser Android, fora de TV e da app
 * instalada, NEXT_PUBLIC_APK_URL definida, 1x por sessão (cookie pixgo_apk_seen).
 * O botão "Baixar" aponta SEMPRE para o APK mobile; o da TV só existe dentro de /baixar.
 *
 * Dois botões (Baixar APK mobile · Continuar no site) + caixa "Não mostrar novamente":
 * marcada, a escolha fica guardada para sempre; desmarcada, só vale nesta sessão.
 *
 * Foco (TV/teclado): botões via <Focusable> + autoFocus quando shouldAutoFocus().
 */
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AndroidIcon from '@mui/icons-material/Android';
import DownloadIcon from '@mui/icons-material/Download';
import Focusable from '@/components/ui/Focusable';
import { useAuthStore } from '@/store/auth';
import { shouldOfferApkModal, startApkDownload, markApkSeen, markApkNever } from '@/lib/apk';
import { shouldAutoFocus } from '@/lib/tv-navigation';

// Páginas onde o convite global não faz sentido (a própria página de instruções, embeds,
// player offline e /auth — o stub de login usa a variante `standalone`).
const EXCLUDED = ['/baixar', '/embed', '/offline', '/offline-player', '/auth'];

interface Props {
  /** Variante do stub de login: ignora sessão/rota e delega o "continuar" ao pai. */
  standalone?: boolean;
  onFinish?: () => void;
}

export default function ApkDownloadModal({ standalone = false, onFinish }: Props) {
  const { t }    = useTranslation();
  const router   = useRouter();
  const pathname = usePathname() || '';
  const user     = useAuthStore(s => s.user);
  const [show, setShow] = useState(false);
  const [dontShow, setDontShow] = useState(false);   // caixa "Não mostrar novamente"

  useEffect(() => {
    if (standalone) { setShow(shouldOfferApkModal()); return; }
    if (!user) { setShow(false); return; }   // sem sessão → o convite aparece no stub de login
    if (EXCLUDED.some(p => pathname === p || pathname.startsWith(p + '/'))) { setShow(false); return; }
    setShow(shouldOfferApkModal());
  }, [standalone, pathname, user?.id]);

  // Marca como visto: só nesta sessão — ou para sempre, se a caixa "Não mostrar novamente"
  // estiver marcada (persistente; a página /baixar e o link do menu lateral continuam disponíveis).
  const remember = () => { if (dontShow) markApkNever(); else markApkSeen(); };

  const close = () => {
    remember();
    setShow(false);
    onFinish?.();
  };

  const download = () => {
    startApkDownload();               // APK mobile, dentro do clique (gesto do utilizador)
    remember();
    setShow(false);
    router.push('/baixar?started=1'); // na standalone NÃO chama onFinish: a pessoa fica na página de passos
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
          <Focusable as="button" className="btn btn-primary btn-lg" onEnterPress={download}
                     autoFocus={shouldAutoFocus()} style={{ justifyContent: 'center', width: '100%' }}>
            <DownloadIcon style={{ fontSize: 20 }} />
            {t('apk.download')}
          </Focusable>
          <Focusable as="button" className="btn btn-secondary" onEnterPress={close} data-modal-close
                     style={{ justifyContent: 'center', width: '100%' }}>
            {t('apk.continueSite')}
          </Focusable>
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: '0.82rem', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px 0',
          }}>
            <input type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)}
                   style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
            {t('apk.neverShow')}
          </label>
        </div>
      </div>
    </div>
  );
}
