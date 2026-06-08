import React from 'react';
import type { Track } from '../types';
import { getMusicalKey } from '../utils/audio';

interface TrackCardProps {
  track: Track;
  playingTrack: Track | null;
  resolvingYt: boolean;
  youtubeId: string | null;
  onPlayTrack: (track: Track) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  playingTrack,
  resolvingYt,
  youtubeId,
  onPlayTrack,
}) => {
  const isCurrentPlaying = playingTrack?.id === track.id;

  return (
    <div className={`track-card ${isCurrentPlaying ? 'playing' : ''}`}>
      {/* Album Art with overlay play action */}
      <div className="album-art-container" onClick={() => onPlayTrack(track)}>
        {track.albumArt ? (
          <img 
            src={track.albumArt} 
            alt={track.album} 
            className="album-art" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop';
            }}
          />
        ) : (
          <div className="album-art" style={{ background: '#e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)">
              <path d="M9 18V5l12-2v13M9 15c-1.5 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3V9" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}
        <div className="art-overlay">
          {isCurrentPlaying && resolvingYt ? (
            <div className="spinner" style={{ width: '25px', height: '25px', borderWidth: '2px' }} />
          ) : isCurrentPlaying && youtubeId ? (
            <div className="play-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </div>
          ) : (
            <div className="play-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Track Metadata Info */}
      <div className="track-info">
        <div className="track-header">
          <h4 className="track-title" title={track.name}>{track.name}</h4>
          <p className="track-artists" title={track.artists}>{track.artists}</p>
        </div>

        <div className="track-features" style={{ marginTop: '6px' }}>
          {track.analyzing ? (
            <span className="badge bpm-badge" style={{ animation: 'pulse 1s infinite alternate' }}>
              Analyse... 🎧
            </span>
          ) : (
            <span className="badge bpm-badge">{track.bpm} BPM</span>
          )}
          {track.keyText ? (
            <span className="badge">{track.keyText}</span>
          ) : (
            getMusicalKey(track.key, track.mode) && (
              <span className="badge">{getMusicalKey(track.key, track.mode)}</span>
            )
          )}
          {track.energy !== undefined && (
            <span className="badge" title="Énergie">⚡ {Math.round(track.energy * 100)}%</span>
          )}
        </div>

        <div className="track-actions">
          {track.deezerUrl && (
            <button
              className="action-btn deezer"
              title="Ouvrir dans Deezer"
              onClick={() => window.open(track.deezerUrl!, '_blank')}
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
          {track.id.startsWith('gsb-') && (
            <button
              className="action-btn getsongbpm"
              title="Rechercher sur GetSongBPM"
              onClick={() => window.open(`https://getsongbpm.com/search?q=${encodeURIComponent(track.artists + ' ' + track.name)}`, '_blank')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </button>
          )}
          <button
            className="action-btn youtube"
            title="Lire sur YouTube Music"
            onClick={() => onPlayTrack(track)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
