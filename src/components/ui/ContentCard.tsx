'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ShareIcon from '@mui/icons-material/Share';
import MovieIcon from '@mui/icons-material/Movie';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Focusable from '@/components/ui/Focusable';

const TYPE_COLORS: Record<string, string> = {
  movie:       '#e50914',
  series:      '#ff6b00',
  anime:       '#ff0080',
  documentary: '#00a8ff',
  dorama:      '#9c27b0',
  channel:     '#1ce783',
};

interface ContentCardProps {
  id: string;
  title: string;
  poster?: string;
  year?: number | string;
  type?: string;
  rating?: number;
  progress?: number;
  inList?: boolean;
  onClick?: () => void;
  onAddToList?: () => void;
  onShare?: () => void;
  style?: React.CSSProperties;
}

function fmtRating(r?: number) {
  if (!r || r <= 0) return null;
  return r.toFixed(1);
}

export default function ContentCard({
  id, title, poster, year, type, rating, progress,
  inList, onClick, onAddToList, onShare, style,
}: ContentCardProps) {
  const [imgErr,   setImgErr]   = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const { t } = useTranslation();
  const typeColor = type ? (TYPE_COLORS[type] ?? '#e50914') : '#e50914';
  const ratingStr = fmtRating(rating);

  return (
    <Focusable
      as="article"
      className="content-card"
      onEnterPress={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e: React.KeyboardEvent) => {
        // Atalhos para as acções secundárias enquanto o card está focado —
        // ver nota acima sobre porque não são alvos de seta independentes.
        if ((e.key === 'a' || e.key === 'A') && onAddToList) { e.preventDefault(); e.stopPropagation(); onAddToList(); }
        if ((e.key === 's' || e.key === 'S') && onShare)     { e.preventDefault(); e.stopPropagation(); onShare(); }
      }}
      style={style}
    >
      {/* Thumbnail */}
      <div className="content-thumb" onClick={onClick}>
        {poster && !imgErr ? (
          <img src={poster} alt={title} loading="lazy" onError={() => setImgErr(true)} />
        ) : (
          <div className="content-thumb-placeholder">
            <MovieIcon style={{ fontSize: 36, color: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4, textAlign: 'center', padding: '0 6px' }}>
              {title}
            </span>
          </div>
        )}

        {/* Color bar top */}
        <div className="content-type-bar" style={{ background: typeColor }} />

        {/* Rating */}
        {ratingStr && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)',
            borderRadius: 4, padding: '2px 6px',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <StarIcon style={{ fontSize: 11, color: '#ffd700' }} />
            <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 600 }}>{ratingStr}</span>
          </div>
        )}

        {/* Type badge */}
        {type && (
          <div style={{
            position: 'absolute', bottom: progress ? 12 : 8, left: 8, right: 8,
            background: 'rgba(0,0,0,0.72)', borderRadius: 4,
            padding: '2px 7px', fontSize: '0.62rem',
            fontWeight: 700, color: '#fff',
            maxWidth: 'fit-content', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {t(`catalog.${type}`)}
          </div>
        )}

        {/* Hover overlay */}
        <div className={`content-thumb-overlay ${hovered ? 'content-card-hovered' : ''}`}
          style={{ opacity: hovered ? 1 : 0 }}>
          <div className="play-btn-circle">
            <PlayArrowIcon style={{ fontSize: 22, color: '#fff', marginLeft: 2 }} />
          </div>
        </div>

        {/* Progress bar */}
        {progress != null && progress > 0 && (
          <div className="content-progress">
            <div className="content-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="content-info">
        <h3
          className="content-title"
          title={title}
          onClick={onClick}
          style={{ cursor: 'pointer' }}
        >
          {title}
        </h3>

        <div className="content-meta">
          {year && <span>{year}</span>}
          {ratingStr && (
            <span className="content-rating">
              <StarIcon style={{ fontSize: 11 }} />
              {ratingStr}
            </span>
          )}
        </div>

        {/* Actions */}
        {(onAddToList || onShare) && (
          <div className="content-actions">
            {onAddToList && (
              <button
                className={`card-action-btn ${inList ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); onAddToList(); }}
                tabIndex={-1}
                title={(inList ? 'Remover da lista' : 'Adicionar à lista') + ' (A)'}
              >
                {inList
                  ? <CheckIcon style={{ fontSize: 16 }} />
                  : <AddIcon   style={{ fontSize: 16 }} />}
              </button>
            )}
            {onShare && (
              <button
                className="card-action-btn"
                onClick={e => { e.stopPropagation(); onShare(); }}
                tabIndex={-1}
                title="Compartilhar (S)"
              >
                <ShareIcon style={{ fontSize: 15 }} />
              </button>
            )}
          </div>
        )}
      </div>
    </Focusable>
  );
}
