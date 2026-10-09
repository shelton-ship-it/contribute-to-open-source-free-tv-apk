'use client';
/**
 * /baixar — página PÚBLICA (sem login, sem header) com as instruções de
 * instalação do app Android. Fica fora de /main e /auth, por isso nenhum guard
 * de autenticação a toca.
 *
 * Só existe no SITE (pixgo.qzz.io / www.pixgo.qzz.io): noutros hosts redireciona para /main.
 * Dois links: APK mobile (NEXT_PUBLIC_APK_URL) e APK TV (NEXT_PUBLIC_APK_TV_URL, cartão
 * "Baixe a Pixgo na sua TV Box, Android TV e outros" — só aparece aqui, nunca no modal).
 *
 * Foco de TV: o conteúdo está dentro de [data-tv-container]; botões via <Focusable> e links
 * nativos (focusáveis pelo motor de lib/tv-navigation.ts). Numa TV (ou com teclado/comando) o
 * foco vai logo para o botão principal ([data-tv-primary]): o da TV, se existir.
 *
 * Dois cards (mobile + TV) no topo; depois, o passo-a-passo de instalação Android com 2 imagens.
 *
 * Imagens das instruções: colocar em  public/install-1.jpg  e  public/install-2.jpg
 * (enquanto não existirem, aparece um espaço reservado).
 */
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import TvIcon from '@mui/icons-material/Tv';
import AndroidIcon from '@mui/icons-material/Android';
import Focusable from '@/components/ui/Focusable';
import { APK_URL, APK_TV_URL, isApkSiteHost, startApkDownload } from '@/lib/apk';
import { isLikelyTV, shouldAutoFocus } from '@/lib/tv-navigation';

function StepImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{
      marginTop: 14, borderRadius: 12, overflow: 'hidden',
      border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.03)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: failed ? 180 : undefined,
    }}>
      {failed ? (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
          <ImageOutlinedIcon style={{ fontSize: 30, opacity: 0.6, marginBottom: 6 }} />
          <div>{src}</div>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} onError={() => setFailed(true)}
             style={{ display: 'block', width: '100%', maxWidth: 360, height: 'auto', margin: '0 auto' }} />
      )}
    </div>
  );
}

function Step({ n, title, text, img }: { n: number; title: string; text: string; img: string }) {
  return (
    <section style={{
      background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
      borderRadius: 16, padding: '20px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--color-primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem',
        }}>{n}</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem', fontWeight: 800, margin: 0 }}>{title}</h2>
      </div>
      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.65, margin: '10px 0 0' }}>{text}</p>
      <StepImage src={img} alt={title} />
    </section>
  );
}

/**
 * Cartão de download (há dois, sempre visíveis): APK mobile e APK TV.
 * O da TV é o branding "Baixe a Pixgo na sua TV Box, Android TV e outros" — só existe nesta
 * página (o modal aponta sempre para o APK mobile). Sem URL no env, o botão fica desativado.
 */
function DlCard({ kind, url, started, primary, order, onDownload }: {
  kind: 'mobile' | 'tv'; url: string; started: boolean; primary: boolean; order: number; onDownload: () => void;
}) {
  const { t } = useTranslation();
  const isTv = kind === 'tv';
  const Icon = isTv ? TvIcon : AndroidIcon;
  const chips = isTv ? ['Android TV', 'TV Box', 'Google TV'] : ['Android 8+', 'APK'];
  return (
    <section id={isTv ? 'tv' : 'mobile'} style={{
      order, scrollMarginTop: 24, display: 'flex', flexDirection: 'column',
      background: isTv
        ? 'linear-gradient(135deg, rgba(229,9,20,0.14) 0%, rgba(229,9,20,0.04) 55%, var(--color-card-bg) 100%)'
        : 'var(--color-card-bg)',
      border: isTv ? '1px solid rgba(229,9,20,0.28)' : '1px solid var(--color-border)',
      borderRadius: 18, padding: '22px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{
          width: 46, height: 46, borderRadius: 13, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(229,9,20,0.14)', border: '1px solid rgba(229,9,20,0.3)',
        }}>
          <Icon style={{ fontSize: 26, color: 'var(--color-primary)' }} />
        </span>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
          {t(isTv ? 'apk.tvBadge' : 'apk.mobileBadge')}
        </span>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.25 }}>
        {t(isTv ? 'apk.tvTitle' : 'apk.mobileTitle')}
      </h2>
      <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.65, margin: '0 0 14px', flex: 1 }}>
        {t(isTv ? 'apk.tvText' : 'apk.mobileText')}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {chips.map(label => (
          <span key={label} style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '5px 11px', borderRadius: 999,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)',
          }}>{label}</span>
        ))}
      </div>

      {url ? (
        <Focusable as="button" className="btn btn-primary btn-lg" onEnterPress={onDownload}
                   {...(primary ? { 'data-tv-primary': 'true' } : {})}
                   style={{ justifyContent: 'center', width: '100%' }}>
          <DownloadIcon style={{ fontSize: 20 }} />
          {started ? t(isTv ? 'apk.tvAgain' : 'apk.again') : t(isTv ? 'apk.tvCta' : 'apk.download')}
        </Focusable>
      ) : (
        <button className="btn btn-primary btn-lg" disabled
                style={{ justifyContent: 'center', width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
          <DownloadIcon style={{ fontSize: 20 }} />
          {t(isTv ? 'apk.tvCta' : 'apk.download')}
        </button>
      )}
      <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: '12px 0 0', textAlign: 'center' }}>
        {url ? (isTv ? t('apk.tvHint') : '') : t('apk.soon')}
      </p>
    </section>
  );
}

function BaixarContent() {
  const { t } = useTranslation();
  const router  = useRouter();
  const started = useSearchParams().get('started') === '1';
  const [allowed, setAllowed]     = useState(false);
  const [tvStarted, setTvStarted] = useState(false);
  const [onTV, setOnTV]           = useState(false);

  // Só no site: noutros hosts (hub, resumeforge, previews) a página não existe.
  useEffect(() => {
    if (!isApkSiteHost()) { router.replace('/main'); return; }
    setAllowed(true);
    setOnTV(isLikelyTV());
  }, []);

  // Foco inicial em TV / teclado: botão principal (o da TV, se esta for uma TV com link da TV).
  useEffect(() => {
    if (!allowed || !shouldAutoFocus()) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-tv-primary]')?.focus();
    }); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [allowed, onTV]);

  const [mobileStarted, setMobileStarted] = useState(false);
  const downloadTv     = () => { if (startApkDownload('tv'))     setTvStarted(true); };
  const downloadMobile = () => { if (startApkDownload('mobile')) setMobileStarted(true); };
  // Foco inicial: numa TV (com link da TV) o botão da TV; senão o do APK mobile.
  const tvPrimary = onTV && !!APK_TV_URL;

  if (!allowed) return null;

  return (
    <main data-tv-container style={{ minHeight: '100vh', background: 'var(--color-bg, #0a0a0c)', padding: '34px 16px 56px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Link href="/main" style={{ alignSelf: 'center' }} aria-label="Pixgo">
          <img src="/logo.svg" alt="Pixgo" style={{ height: 38, width: 'auto', display: 'block' }} />
        </Link>

        <div style={{ textAlign: 'center', margin: '14px 0 6px' }}>
          <CheckCircleIcon style={{ fontSize: 54, color: 'var(--color-secondary, #1ce783)' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 800, margin: '10px 0 8px', lineHeight: 1.2 }}>
            {(started || mobileStarted || tvStarted) ? t('apk.startedTitle') : t('apk.pageTitle')}
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
            {t('apk.pageSubtitle')}
          </p>
        </div>

        {/* Dois cards prontos: mobile e TV. Numa TV, o da TV passa para a frente (order). */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
          <DlCard kind="mobile" url={APK_URL} started={started || mobileStarted} primary={!tvPrimary}
                  order={onTV ? 2 : 1} onDownload={downloadMobile} />
          <DlCard kind="tv" url={APK_TV_URL} started={tvStarted} primary={tvPrimary}
                  order={onTV ? 1 : 2} onDownload={downloadTv} />
        </div>

        <div style={{
          background: 'rgba(229,9,20,0.06)', border: '1px solid rgba(229,9,20,0.18)',
          borderRadius: 12, padding: '12px 14px', fontSize: '0.84rem', lineHeight: 1.6,
        }}>
          {t('apk.before')}
        </div>

        <Step n={1} title={t('apk.step1Title')} text={t('apk.step1Text')} img="/install-1.jpg" />
        <Step n={2} title={t('apk.step2Title')} text={t('apk.step2Text')} img="/install-2.jpg" />

        <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.6, textAlign: 'center', margin: '4px 0 0' }}>
          {t('apk.done')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <Link href="/main" className="btn btn-secondary" data-tv-focusable style={{ justifyContent: 'center' }}>
            {t('apk.backToSite')}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BaixarPage() {
  // useSearchParams exige Suspense no App Router.
  return (
    <Suspense fallback={null}>
      <BaixarContent />
    </Suspense>
  );
}
