// src/app/main/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { catalogApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import ContentCard from '@/components/ui/ContentCard';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TvOffIcon from '@mui/icons-material/TvOff';
import toast from 'react-hot-toast';
import DisplayAdBanner from '@/components/DisplayAdBanner';
import Focusable from '@/components/ui/Focusable';

// Quantidade de itens pedidos por linha — antes era 12 buscados (com só 8
// mostrados), agora busca-se mais para preencher a linha inteira, igual
// densidade ao grid do catálogo (ver /main/catalog/page.tsx, limit: 24).
const ROW_FETCH_LIMIT = 24;

// Embaralha uma cópia do array (Fisher-Yates) — chamado a cada montagem do
// HomePage (ou seja, a cada entrada do user no /main), pra dar sensação de
// catálogo sempre a mudar sem depender de nenhuma ordenação nova no backend.
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// FIX: pedido explícito — tanto no hero (mostrador que roda os destaques)
// quanto nas linhas de cards do /main, os primeiros itens mostrados devem
// ser especificamente da categoria "video", seguidos pelo resto. Partição
// estável: mantém a ordem relativa dentro de cada grupo (vídeos primeiro,
// depois tudo o resto), sem re-embaralhar nada que já tenha sido decidido
// antes desta função.
function videoFirst<T extends { type?: string }>(arr: T[]): T[] {
  const videos = arr.filter(item => item.type === 'video');
  const rest   = arr.filter(item => item.type !== 'video');
  return [...videos, ...rest];
}

// FIX: linhas do /main ficavam limitadas a 8 cards (slice fixo), enquanto
// o catálogo mostrava grids cheios de 24. O pedido era o /main ser "a
// cereja do bolo" — linhas tão cheias quanto o catálogo, não uma amostra
// pequena. Removido o slice(0,8): mostra tudo o que foi buscado por linha
// (ver ROW_FETCH_LIMIT abaixo, já pede mais itens por categoria à API).
function ContentRow({ label, items, onSeeAll, router, t }: any) {
  if (!items?.length) return null;
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">{label}</h2>
        {onSeeAll && <Focusable as="span" className="section-link" onClick={onSeeAll}>{t('common.seeAll')} →</Focusable>}
      </div>
      <div className="content-grid" data-tv-container>
        {items.map((item: any, i: number) => {
          const title  = item.meta?.title  || item.title  || '—';
          const poster = item.meta?.poster || item.poster;
          const rating = item.meta?.rating || item.rating;
          return (
            <ContentCard
              key={item.id}
              id={item.id}
              title={title}
              poster={poster}
              year={item.year}
              type={item.type}
              rating={rating}
              onClick={() => router.push(`/main/watch/${item.id}`)}
              style={{ animationDelay: `${i * 0.04}s` }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { t }  = useTranslation();

  const [featured,  setFeatured]  = useState<any[]>([]);
  const [heroIdx,   setHeroIdx]   = useState(0);
  const [movies,    setMovies]    = useState<any[]>([]);
  const [series,    setSeries]    = useState<any[]>([]);
  const [anime,     setAnime]     = useState<any[]>([]);
  const [videos,    setVideos]    = useState<any[]>([]);
  const [popular,   setPopular]   = useState<any[]>([]);
  const [continueW, setContinueW] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  const activeProfileId = useAuthStore(s => s.activeProfileId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Rodada 2 (set/2026): antes eram 5 pedidos separados
        // (featured+latest×3+popular) sempre disparados juntos aqui — agora
        // é 1 só (GET /api/catalog/home), que já devolve tudo consolidado.
        const home = await catalogApi.home({
          limit: ROW_FETCH_LIMIT,
          featuredLimit: 6,
          profileId: activeProfileId,
        });
        if (cancelled) return;
        const arr = (v: any) => Array.isArray(v) ? v : [];
        // Embaralhado a cada entrada nesta página — cada linha fica numa
        // ordem diferente sempre que o user volta ao /main. FIX: o hero
        // (mostrador) deve mostrar primeiro os itens da categoria "video",
        // depois o restante — ver videoFirst() acima.
        setFeatured(videoFirst(arr(home.featured)));
        setMovies(shuffle(arr(home.latest?.movie)));
        setSeries(shuffle(arr(home.latest?.series)));
        setAnime(shuffle(arr(home.latest?.anime)));
        setVideos(shuffle(arr(home.latest?.video)));
        setPopular(shuffle(arr(home.popular)));
        progressApi.continue({ limit: 6 })
          .then((r: any) => { if (!cancelled) setContinueW(Array.isArray(r) ? r : []); })
          .catch(() => {});
      } catch {
        toast.error(t('errors.networkError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeProfileId]);

  // Hero rotation
  useEffect(() => {
    if (featured.length < 2) return;
    const id = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 7000);
    return () => clearInterval(id);
  }, [featured.length]);

  if (loading) return (
    <div className="page-loading">
      <div className="loading-ring" />
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        {t('common.loading')}
      </span>
    </div>
  );

  const hasAny = featured.length || movies.length || series.length || anime.length || videos.length || popular.length;

  // Empty state
  if (!hasAny) return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="empty-icon">
        <TvOffIcon style={{ fontSize: 30 }} />
      </div>
      <div className="empty-title">{t('home.noContent')}</div>
      <div className="empty-desc">{t('home.noContentDesc')}</div>
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
        {t('common.retry')}
      </button>
    </div>
  );

  const hero = featured[heroIdx];

  return (
    <div>
      {/* ── Hero ── */}
      {hero && (() => {
        const heroTitle  = hero.meta?.title  || hero.title  || '';
        const heroPoster = hero.meta?.poster || hero.poster || '';
        const heroDesc   = hero.meta?.description || hero.description || '';
        return (
          <div className="hero-banner">
            {heroPoster && (
              <div
                className="hero-backdrop"
                style={{ backgroundImage: `url(${heroPoster})`, filter: 'blur(1px) brightness(0.45)' }}
              />
            )}
            <div className="hero-gradient" />
            <div className="hero-content">
              <p className="hero-type">{hero.type?.toUpperCase()} {hero.year && `· ${hero.year}`}</p>
              <h1 className="hero-title">{heroTitle}</h1>
              {heroDesc && <p className="hero-desc">{heroDesc}</p>}
              <div className="hero-actions">
                <button className="hero-btn-play" onClick={() => router.push(`/main/watch/${hero.id}`)}>
                  <PlayArrowIcon style={{ fontSize: 20 }} />
                  {t('home.playNow')}
                </button>
                <button className="hero-btn-info" onClick={() => router.push(`/main/content/${hero.id}`)}>
                  <InfoOutlinedIcon style={{ fontSize: 18 }} />
                  {t('home.moreInfo')}
                </button>
              </div>
            </div>
            {featured.length > 1 && (
              <div className="hero-dots">
                {featured.map((_, i) => (
                  <button
                    key={i}
                    className={`hero-dot ${i === heroIdx ? 'active' : ''}`}
                    onClick={() => setHeroIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Continue Watching ── */}
      {continueW.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">{t('home.continueWatching')}</h2>
          </div>
          <div data-tv-container style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {continueW.map((item: any) => (
              <Focusable
                key={item.content_id}
                className="cw-card"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/main/watch/${item.content_id}`)}
              >
                {item.content?.poster ? (
                  <img
                    src={item.content.poster}
                    alt={item.content.title}
                    className="cw-thumb"
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  <div className="cw-thumb" style={{ background: 'var(--color-card-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayArrowIcon style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}
                <div className="progress-bar" style={{ marginTop: 5 }}>
                  <div className="progress-fill" style={{ width: `${item.progress || 0}%` }} />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.content?.title}
                </div>
              </Focusable>
            ))}
          </div>
        </div>
      )}

      {/* FIX: pedido explícito — a linha "Vídeos" deve ser a primeira a
          aparecer nos cards do /main, antes de Popular/Filmes/Séries/Anime,
          que seguem depois na mesma ordem de sempre. */}
      <ContentRow label={t('home.videos')}       items={videos}  router={router} t={t} onSeeAll={() => router.push('/main/catalog?type=video')} />
      <ContentRow label={t('home.popularNow')}   items={popular} router={router} t={t} onSeeAll={() => router.push('/main/catalog?sort=popular')} />
      <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
        <DisplayAdBanner />
      </div>
      <ContentRow label={t('home.latestMovies')} items={movies}  router={router} t={t} onSeeAll={() => router.push('/main/catalog?type=movie')} />
      <ContentRow label={t('home.series')}       items={series}  router={router} t={t} onSeeAll={() => router.push('/main/catalog?type=series')} />
      <ContentRow label={t('home.anime')}        items={anime}   router={router} t={t} onSeeAll={() => router.push('/main/catalog?type=anime')} />
    </div>
  );
}
