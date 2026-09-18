'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { catalogApi, myListApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import ContentCard from '@/components/ui/ContentCard';
import AdsterraNative from '@/components/AdsterraNative';
import TvOffIcon from '@mui/icons-material/TvOff';
import PlansModal from '@/components/ui/PlansModal';

// FIX: este ficheiro estava, no upload original, a conter uma cópia
// acidental de content/[id]/page.tsx — a rota /main/catalog nunca teve
// uma listagem real, por isso ficava presa em "loading" para sempre
// (useParams() não tem `id` numa rota estática, contentApi.get(undefined)
// nunca resolve `content`, e o early-return `if (!content) return null`
// combinado com o loading inicial nunca sai do estado de carregamento).
// Reconstruída aqui como a listagem de catálogo real, usando o mesmo
// catalogApi/ContentCard/estilos já usados em main/page.tsx e
// main/search/page.tsx.

// FIX: pedido explícito — ordem das abas no header do catálogo deve ser
// "Todos" primeiro, depois "Vídeos", depois o resto (era all→movie→...→video,
// com "video" sempre por último).
const TYPES = ['all', 'video', 'movie', 'series', 'anime', 'documentary', 'dorama'];

// 1 bloco Native da Adsterra por página do catálogo, depois do 8º card
// (~2 fileiras em desktop) — ver AdsterraNative.tsx. Só aparece se a
// zona estiver configurada em ads.network.native (senão fica invisível,
// sem quebrar o grid).
const NATIVE_AD_AFTER_INDEX = 8;
const KID_TYPES = ['anime', 'dorama'];

// FIX: pedido explícito — na aba "Todos" o catálogo só mostrava filmes
// primeiro (consequência de sort=recent/popular do backend, que não agrupa
// por categoria). Reordena o array JÁ devolvido pela MESMA chamada a
// catalogApi.list() (nenhum request extra, nenhuma paginação nova) para que
// os itens da categoria "video" apareçam primeiro, seguidos do resto —
// idêntico ao videoFirst() já usado em main/page.tsx. É um no-op quando a
// aba já filtra por um tipo específico (ex.: type=movie), já que nesse caso
// não há itens "video" misturados para reordenar.
function videoFirst<T extends { type?: string }>(arr: T[]): T[] {
  const videos = arr.filter(item => item.type === 'video');
  const rest   = arr.filter(item => item.type !== 'video');
  return [...videos, ...rest];
}

export default function CatalogPage() {
  const router = useRouter();
  const sp     = useSearchParams();
  const { t }  = useTranslation();

  const profiles        = useAuthStore(s => s.profiles);
  const activeProfileId = useAuthStore(s => s.activeProfileId);
  const activeProfile   = profiles.find(p => p.id === activeProfileId) || null;
  const isKid           = !!activeProfile?.is_kid;
  const visibleTypes    = isKid ? KID_TYPES : TYPES;

  const [type,    setType]    = useState(() => {
    const fromUrl = sp.get('type') || 'all';
    return isKid && !KID_TYPES.includes(fromUrl) ? 'anime' : fromUrl;
  });
  const [sort,    setSort]    = useState<'recent' | 'popular'>('recent');
  const [items,   setItems]   = useState<any[]>([]);
  const [, setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);

  // Se o perfil activo mudar para um perfil infantil enquanto uma aba não
  // permitida está seleccionada (ex: "Filmes"), cai para "Anime" — evita
  // ficar preso numa aba que o backend vai sempre devolver vazia.
  useEffect(() => {
    if (isKid && !KID_TYPES.includes(type)) setType('anime');
  }, [isKid, type]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 24, page: p, sort };
      if (type !== 'all') params.type = type;
      if (activeProfileId) params.profile_id = activeProfileId;
      const res = await catalogApi.list(params);
      setItems(videoFirst(res.items ?? []));
      setTotal(res.pagination?.total ?? (res.items ?? []).length);
      setPages(res.pagination?.pages ?? 1);
      setPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type, sort, activeProfileId]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      {/* Pedido explícito: só no /catalogo, nunca na home (/main). O
          componente já se auto-gere (só free, 1x/dia, ver PlansModal.tsx). */}
      <PlansModal />

      <div className="page-header">
        <h1 className="page-title">{t('catalog.title')}</h1>
      </div>

      <div className="filter-bar">
        {visibleTypes.map(tp => (
          <button
            key={tp}
            className={`filter-chip ${type === tp ? 'active' : ''}`}
            onClick={() => setType(tp)}
          >
            {t(`catalog.${tp === 'all' ? 'allTypes' : tp}`)}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button
          className={`filter-chip ${sort === 'recent' ? 'active' : ''}`}
          onClick={() => setSort('recent')}
        >
          {t('catalog.sortRecent')}
        </button>
        <button
          className={`filter-chip ${sort === 'popular' ? 'active' : ''}`}
          onClick={() => setSort('popular')}
        >
          {t('catalog.sortPopular')}
        </button>
      </div>

      {loading ? (
        <div className="page-loading"><div className="loading-ring" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><TvOffIcon style={{ fontSize: 28 }} /></div>
          <div className="empty-title">{t('catalog.noContent')}</div>
          <div className="empty-desc">{t('catalog.noContentDesc')}</div>
        </div>
      ) : (
        <>
          <div className="content-grid" data-tv-container>
            {items.map((item, i) => {
              const title  = item.meta?.title  || item.title  || '—';
              const poster = item.meta?.poster || item.poster;
              const rating = item.meta?.rating || item.rating;
              // order (CSS grid) em vez de reordenar o array: o bloco Native
              // fica sempre no MESMO nó React (não remonta a cada troca de
              // página), só a posição VISUAL é que empurra pro slot 8.
              const order = i < NATIVE_AD_AFTER_INDEX ? i : i + 1;
              return (
                <ContentCard
                  key={item.id}
                  id={item.id}
                  title={title}
                  poster={poster}
                  year={item.year}
                  type={item.type}
                  rating={rating}
                  onClick={() => router.push(`/main/content/${item.id}`)}
                  onAddToList={() => {
                    const profileId = useAuthStore.getState().activeProfileId;
                    if (profileId) myListApi.add(profileId, item.id).catch(() => {});
                  }}
                  style={{ animationDelay: `${(i % 24) * 0.03}s`, order }}
                />
              );
            })}
            {/* Ordem fixa (NATIVE_AD_AFTER_INDEX) — cai depois do 8º card
                quando há itens suficientes; senão, fica no fim naturalmente
                (order maior que qualquer card existente). Componente único,
                nunca remonta entre páginas — evita reinjectar o script. */}
            <AdsterraNative order={NATIVE_AD_AFTER_INDEX} />
          </div>
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 26, flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1 || loading}
                onClick={() => load(page - 1)}
              >
                {t('common.previous')}
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === pages || Math.abs(n - page) <= 2)
                .reduce<(number | 'ellipsis')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === 'ellipsis' ? (
                    <span key={`e${i}`} style={{ color: 'var(--color-text-muted)', padding: '0 4px' }}>…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => load(n)}
                      disabled={loading}
                      className={`filter-chip ${n === page ? 'active' : ''}`}
                      style={{ minWidth: 34, textAlign: 'center' }}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= pages || loading}
                onClick={() => load(page + 1)}
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
