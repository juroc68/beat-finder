import React from 'react';
import type { Track } from '../types';

interface BottomPlayerProps {
  playingTrack: Track;
  resolvingYt: boolean;
  youtubeId: string | null;
  onClosePlayer: () => void;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
  playingTrack,
  resolvingYt,
  youtubeId,
  onClosePlayer,
}) => {
  return (
    <div className="bottom-player">
      <button 
        type="button"
        className="widget-close-btn"
        title="Fermer le lecteur"
        onClick={onClosePlayer}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Left part: Track Info */}
      <div className="player-track-info">
        {playingTrack.albumArt ? (
          <img 
            src={playingTrack.albumArt} 
            alt={playingTrack.album} 
            className="player-art" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop';
            }}
          />
        ) : (
          <div className="player-art" style={{ background: '#e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)">
              <path d="M9 18V5l12-2v13M9 15c-1.5 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3V9" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
        <div className="player-text">
          <p className="player-title" title={playingTrack.name}>{playingTrack.name}</p>
          <p className="player-artist" title={playingTrack.artists}>{playingTrack.artists}</p>
        </div>
        {playingTrack.bpm && (
          <span className="badge bpm-badge" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
            {playingTrack.bpm} BPM
          </span>
        )}
      </div>

      {/* Middle part: Audio Player (via YouTube embed) */}
      <div className="player-container">
        {resolvingYt ? (
          <div className="youtube-iframe-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            <span className="loading-text" style={{ fontSize: '0.75rem', marginLeft: '8px', color: '#fff' }}>Recherche YouTube...</span>
          </div>
        ) : youtubeId ? (
          <div className="youtube-iframe-container">
            <iframe
              key={youtubeId}
              title="YouTube Music Player"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="youtube-iframe-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#ff4d6a' }}>
            Erreur de lecture
          </div>
        )}
      </div>

      {/* Right part: Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {playingTrack.deezerUrl && (
          <button
            className="action-btn deezer"
            title="Ouvrir dans Deezer"
            onClick={() => window.open(playingTrack.deezerUrl!, '_blank')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="16" width="3" height="5" rx="0.5" />
              <rect x="7" y="10" width="3" height="11" rx="0.5" />
              <rect x="12" y="6" width="3" height="15" rx="0.5" />
              <rect x="17" y="12" width="3" height="9" rx="0.5" />
              <rect x="22" y="15" width="3" height="6" rx="0.5" />
            </svg>
          </button>
        )}
        {youtubeId && (
          <button
            className="action-btn youtube"
            title="Ouvrir sur YouTube"
            onClick={() => window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
