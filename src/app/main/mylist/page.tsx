'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { myListApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import ContentCard from '@/components/ui/ContentCard';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import toast from 'react-hot-toast';
import AdsterraNative from '@/components/AdsterraNative';
import DisplayAdBanner from '@/components/DisplayAdBanner';

export default function MyListPage() {
  const router    = useRouter();
  const { t }     = useTranslation();
  const profileId = useAuthStore(s => s.activeProfileId);

  const [items,     setItems]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profileId) { setLoading(false); return; }
    try {
      const res = await myListApi.list({ profileId, limit: 100 });
      setItems(res.items ?? []);
    } catch {
      toast.error(t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const remove = async (contentId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    if (!profileId) return;
    try {
      await myListApi.remove(profileId, contentId);
      setItems(p => p.filter(i => (i.content_id || i.contentId) !== contentId));
      toast(t('myList.removed'), { icon: '🗑' });
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookmarkIcon style={{ color: 'var(--color-primary)', fontSize: 24 }} />
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>{t('myList.title')}</h1>
            <p className="page-subtitle">{items.length} {t('myList.saved')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><div className="loading-ring" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><BookmarkIcon style={{ fontSize: 28 }} /></div>
          <div className="empty-title">{t('myList.empty')}</div>
          <div className="empty-desc">{t('myList.emptyDesc')}</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }}
            onClick={() => router.push('/main/catalog')}>
            {t('myList.browse')}
          </button>
        </div>
      ) : (
        <div className="content-grid" data-tv-container>
          {items.map(entry => {
            const content = entry.content;
            const cid     = entry.content_id || entry.contentId;
            if (!content) return null;
            const isFocused = focusedId === cid;

            return (
              <div
                key={cid}
                tabIndex={0}
                data-tv-focusable
                className="mylist-card-wrap"
                style={{ position: 'relative', borderRadius: 12, outline: 'none' }}
                onFocus={() => setFocusedId(cid)}
                onBlur={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setFocusedId(null);
                  }
                }}
                onClick={() => router.push(`/main/watch/${content.id}`)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/main/watch/${content.id}`);
                  }
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    remove(cid, e);
                  }
                }}
              >
                <ContentCard
                  id={content.id}
                  title={content.meta?.title || content.title}
                  poster={content.meta?.poster || content.poster}
                  year={content.year}
                  type={content.type}
                  onClick={() => router.push(`/main/watch/${content.id}`)}
                />

                {/* Botão remover — mouse: CSS hover; TV: isFocused */}
                <button
                  tabIndex={-1}
                  onClick={e => remove(cid, e)}
                  title="Remover da lista (Delete)"
                  className="mylist-remove-btn"
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 32, height: 32, borderRadius: 6,
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(229,9,20,0.4)',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-primary)',
                    opacity: isFocused ? 1 : 0,
                    transition: 'opacity 0.15s',
                    pointerEvents: isFocused ? 'auto' : 'none',
                  }}
                >
                  <DeleteOutlineIcon style={{ fontSize: 16 }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginTop: 24 }}>
          <AdsterraNative />
          <DisplayAdBanner />
        </div>
      )}

      <style>{`
        .mylist-card-wrap:hover .mylist-remove-btn {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .mylist-card-wrap:focus > .content-card,
        .mylist-card-wrap:focus-visible > .content-card {
          border-color: rgba(229,9,20,0.6) !important;
          transform: translateY(-3px) scale(1.015) !important;
          box-shadow: 0 8px 24px rgba(229,9,20,0.3), 0 0 0 3px rgba(229,9,20,0.5) !important;
        }
        .mylist-card-wrap:focus { outline: none !important; }
        .mylist-card-wrap:focus-visible { outline: none !important; }
        .mylist-card-wrap:focus .mylist-remove-btn {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}