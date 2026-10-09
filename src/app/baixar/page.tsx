'use client';
/**
 * /baixar — página PÚBLICA (sem login, sem header) com as instruções de
 * instalação do app Android. Fica fora de /main e /auth, por isso nenhum guard
 * de autenticação a toca.
 *
 * Imagens das instruções: colocar em  public/install-1.jpg  e  public/install-2.jpg
 * (enquanto não existirem, aparece um espaço reservado).
 */
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { APK_URL, startApkDownload } from '@/lib/apk';

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

function BaixarContent() {
  const { t } = useTranslation();
  const started = useSearchParams().get('started') === '1';

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg, #0a0a0c)', padding: '34px 16px 56px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Link href="/main" style={{ alignSelf: 'center' }} aria-label="Pixgo">
          <img src="/logo.svg" alt="Pixgo" style={{ height: 38, width: 'auto', display: 'block' }} />
        </Link>

        <div style={{ textAlign: 'center', margin: '14px 0 6px' }}>
          <CheckCircleIcon style={{ fontSize: 54, color: 'var(--color-secondary, #1ce783)' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 800, margin: '10px 0 8px', lineHeight: 1.2 }}>
            {started ? t('apk.startedTitle') : t('apk.pageTitle')}
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
            {t('apk.pageSubtitle')}
          </p>
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
          {APK_URL && (
            <button className="btn btn-primary btn-lg" onClick={() => startApkDownload()} style={{ justifyContent: 'center' }}>
              <DownloadIcon style={{ fontSize: 20 }} />
              {started ? t('apk.again') : t('apk.download')}
            </button>
          )}
          <Link href="/main" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
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
