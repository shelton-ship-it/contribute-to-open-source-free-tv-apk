'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { searchApi } from '@/lib/api';
import ContentCard from '@/components/ui/ContentCard';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import AdsterraNative from '@/components/AdsterraNative';
import DisplayAdBanner from '@/components/DisplayAdBanner';

export default function SearchPage() {
  const router  = useRouter();
  const sp      = useSearchParams();
  const { t }   = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query,   setQuery]   = useState(sp.get('q') || '');
  const [results, setResults] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total,   setTotal]   = useState(0);
  const debounce  = useRef<any>(null);

  useEffect(() => {
    searchApi.popular().then((p: any) => setPopular(p ?? [])).catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query.trim()) { setResults([]); setTotal(0); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.search(query, { limit: 24 });
        setResults(res.results ?? []);
        setTotal(res.pagination?.total ?? 0);
      } catch { setResults([]); }
      finally  { setLoading(false); }
    }, 340);
    return () => clearTimeout(debounce.current);
  }, [query]);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t('search.title')}</h1></div>
      <div style={{ position: 'relative', marginBottom: 28, maxWidth: 560 }}>
        <SearchIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        <input ref={inputRef} className="form-input" style={{ height: 48, paddingLeft: 46, fontSize: '1rem' }} placeholder={t('search.placeholder')} value={query} onChange={e => setQuery(e.target.value)} autoCorrect="off" autoCapitalize="off" spellCheck={false} />
        {loading && <span className="spinner spinner-sm" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }} />}
      </div>
      {!query.trim() && popular.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUpIcon style={{ fontSize: 18, color: 'var(--color-primary)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem' }}>{t('search.popularSearches')}</span>
          </div>
          <div className="filter-bar">{popular.map((p: any) => <button key={p.term} className="filter-chip" onClick={() => setQuery(p.term)}>{p.term}</button>)}</div>
        </div>
      )}
      {query.trim() && !loading && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><SearchOffIcon style={{ fontSize: 28 }} /></div>
          <div className="empty-title">{t('search.noResults')} "{query}"</div>
          <div className="empty-desc">{t('search.noResultsDesc')}</div>
        </div>
      )}
      {results.length > 0 && (
        <>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>{total} {t('search.results')} "{query}"</div>
          <div className="content-grid" data-tv-container>
            {results.map(item => (
              <ContentCard key={item.id} id={item.id} title={item.meta?.title || item.title} poster={item.meta?.poster || item.poster} year={item.year} type={item.type} rating={item.meta?.rating || item.rating} onClick={() => router.push(`/main/watch/${item.id}`)} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginTop: 24 }}>
            <AdsterraNative />
            <DisplayAdBanner />
          </div>
        </>
      )}
    </div>
  );
}
