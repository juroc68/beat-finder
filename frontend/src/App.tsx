import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import type { Track, YoutubeMatch } from './types';
import { estimateBpmFromBuffer } from './utils/audio';
import { TrackCard } from './components/TrackCard';
import { BottomPlayer } from './components/BottomPlayer';
import { Metronome } from './components/Metronome';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL !== undefined ? import.meta.env.VITE_BACKEND_URL : 'http://localhost:5000';

export default function App() {
  // Search parameters states
  const [query, setQuery] = useState('');
  const [exactBpm, setExactBpm] = useState(120);
  const [bpmMargin, setBpmMargin] = useState(0);

  // Data states
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player states
  const [playingTrack, setPlayingTrack] = useState<Track | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [resolvingYt, setResolvingYt] = useState(false);

  // Metronome display state
  const [showMetronome, setShowMetronome] = useState(false);

  // Lazy loading states
  const [searchIndex, setSearchIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageSize, setPageSize] = useState(30);
  const [totalTracksCount, setTotalTracksCount] = useState<number | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Helper: Query Deezer for GetSongBPM songs to obtain albumArt and deezerUrl
  const fetchDeezerMetadata = useCallback(async (track: Track) => {
    try {
      const searchQuery = `${track.artists} ${track.name}`;
      const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(searchQuery)}&limit=1`);
      if (!response.ok) return;
      const json = await response.json();
      const data: Track[] = json.tracks;
      if (data && data.length > 0) {
        const match = data[0];
        setTracks((prevTracks) =>
          prevTracks.map((t) =>
            t.id === track.id
              ? { 
                  ...t, 
                  albumArt: match.albumArt, 
                  deezerUrl: match.deezerUrl,
                  previewUrl: match.previewUrl
                }
              : t
          )
        );
      }
    } catch (err) {
      console.warn(`Failed to fetch Deezer metadata for ${track.name}`, err);
    }
  }, []);

  // Helper: Fetch track audio via proxy, decode it, and calculate BPM
  const analyzeTrackAudio = useCallback(async (track: Track) => {
    try {
      const proxyUrl = `${BACKEND_URL}/api/audio-proxy?url=${encodeURIComponent(track.previewUrl!)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Proxy returned error response');
      
      const arrayBuffer = await response.arrayBuffer();
      
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      const calculatedBpm = estimateBpmFromBuffer(audioBuffer);
      
      setTracks((prevTracks) =>
        prevTracks.map((t) =>
          t.id === track.id
            ? { ...t, bpm: calculatedBpm, analyzing: false }
            : t
        )
      );
    } catch (err) {
      console.warn(`Could not calculate BPM for track: "${track.name}"`, err);
      setTracks((prevTracks) =>
        prevTracks.map((t) =>
          t.id === track.id
            ? { ...t, bpm: 120, analyzing: false }
            : t
        )
      );
    }
  }, []);

  // Search trigger
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setTracks([]);
    setSearchIndex(0);
    setHasMore(true);
    setLoadingMore(false);
    setTotalTracksCount(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.append('q', query.trim());
      }

      params.append('bpm', exactBpm.toString());
      params.append('margin', bpmMargin.toString());

      const response = await fetch(`${BACKEND_URL}/api/search?${params.toString()}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Une erreur est survenue lors de la recherche.');
      }

      const json = await response.json();
      const data: Track[] = json.tracks;
      setHasMore(json.hasMore);
      setTotalTracksCount(json.total ?? null);
      if (json.limit) {
        setPageSize(json.limit);
      }
      
      const initializedTracks = data.map((t) => ({
        ...t,
        analyzing: t.bpm === undefined && t.previewUrl ? true : false
      }));
      
      setTracks(initializedTracks);
      setLoading(false);

      // Trigger progressive client-side audio analysis for Deezer tracks
      initializedTracks.forEach((track) => {
        if (track.previewUrl && track.bpm === undefined) {
          analyzeTrackAudio(track);
        }
      });

      // Trigger progressive metadata fetching for GetSongBPM tracks to load images/listening links
      initializedTracks.forEach((track) => {
        if (track.id.startsWith('gsb-')) {
          fetchDeezerMetadata(track);
        }
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Impossible de se connecter au serveur backend.');
      setLoading(false);
    }
  };

  // Lazy Loading progressive fetching
  const loadMoreTracks = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);

    const nextIndex = searchIndex + pageSize;

    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.append('q', query.trim());
      }

      params.append('bpm', exactBpm.toString());
      params.append('margin', bpmMargin.toString());

      params.append('limit', pageSize.toString());
      params.append('index', nextIndex.toString());

      const response = await fetch(`${BACKEND_URL}/api/search?${params.toString()}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Une erreur est survenue lors du chargement.');
      }

      const json = await response.json();
      const data: Track[] = json.tracks;
      
      setHasMore(json.hasMore);
      setTotalTracksCount(json.total ?? null);
      if (json.limit) {
        setPageSize(json.limit);
      }

      if (data.length > 0) {
        const newTracks = data.map((t) => ({
          ...t,
          analyzing: t.bpm === undefined && t.previewUrl ? true : false
        }));

        setTracks((prev) => [...prev, ...newTracks]);
        setSearchIndex(nextIndex);

        // Trigger progressive audio analysis/metadata only for the new tracks
        newTracks.forEach((track) => {
          if (track.previewUrl && track.bpm === undefined) {
            analyzeTrackAudio(track);
          }
          if (track.id.startsWith('gsb-')) {
            fetchDeezerMetadata(track);
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Impossible de charger plus de morceaux.');
    } finally {
      setLoadingMore(false);
    }
  }, [
    loading,
    loadingMore,
    hasMore,
    searchIndex,
    pageSize,
    query,
    exactBpm,
    bpmMargin,
    analyzeTrackAudio,
    fetchDeezerMetadata
  ]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore || tracks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreTracks();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loading, loadingMore, hasMore, tracks, loadMoreTracks]);

  // Play a track: query backend for YouTube Music ID and start streaming
  const handlePlayTrack = async (track: Track) => {
    if (playingTrack?.id === track.id && youtubeId) {
      return;
    }

    setPlayingTrack(track);
    setResolvingYt(true);
    setYoutubeId(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/youtube-music/search?track=${encodeURIComponent(
          track.name
        )}&artist=${encodeURIComponent(track.artists)}`
      );

      if (!response.ok) {
        throw new Error('Could not find corresponding track on YouTube');
      }

      const data: YoutubeMatch = await response.json();
      setYoutubeId(data.youtubeId);
    } catch (err) {
      console.error(err);
      setError(`Impossible de lire ce morceau.`);
      setPlayingTrack(null);
    } finally {
      setResolvingYt(false);
    }
  };

  // Close player
  const handleClosePlayer = () => {
    setPlayingTrack(null);
    setYoutubeId(null);
    setResolvingYt(false);
  };

  // Adjust BPM from Metronome controls
  const adjustMetronomeBpm = (amount: number) => {
    setExactBpm((prev) => Math.max(40, Math.min(220, prev + amount)));
  };

  const filteredTracks = tracks.filter((track) => {
    if (track.analyzing || track.bpm === undefined) return true;
    return track.bpm >= exactBpm && track.bpm <= exactBpm + bpmMargin;
  });

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo-wave">
            <div className="bar">
              <span className="brick pink"></span>
              <span className="brick purple"></span>
              <span className="brick violet"></span>
              <span className="brick blue"></span>
            </div>
            <div className="bar">
              <span className="brick pink"></span>
              <span className="brick purple"></span>
              <span className="brick violet"></span>
              <span className="brick blue"></span>
            </div>
            <div className="bar">
              <span className="brick pink"></span>
              <span className="brick purple"></span>
              <span className="brick violet"></span>
              <span className="brick blue"></span>
            </div>
          </div>
          <div>
            <h1 className="brand-name">BeatFinder</h1>
          </div>
        </div>
        
        {/* Metronome toggle button on the right side of the header */}
        <button
          type="button"
          className={`header-metronome-toggle ${showMetronome ? 'active' : ''}`}
          title="Afficher/Masquer le Métronome"
          onClick={() => setShowMetronome(!showMetronome)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 22h20L12 2z" />
            <path d="M12 18L9 10" />
            <circle cx="12" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>
      </header>

      {/* Main Search Panel */}
      <div className="search-card">
        <form onSubmit={handleSearch} className="search-grid">
          {/* Left Side: Search criteria */}
          <div className="search-section">
            <h2 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Critères de recherche
            </h2>

            <div className="input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Artiste, chanson, style (laisser vide pour chercher par BPM uniquement)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right Side: BPM Settings */}
          <div className="search-section bpm-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10M18 20V4M6 20v-4" />
                </svg>
                Réglage du tempo (BPM)
              </h2>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
              {/* Single Line containing Tempo Cible and Margin controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tempo cible</span>
                  
                  {/* Margin adjuster buttons + dynamic value next to it */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="bpm-adjust-btn"
                      onClick={() => setBpmMargin((prev) => Math.max(0, prev - 1))}
                      disabled={bpmMargin <= 0}
                      title="Diminuer la marge"
                      style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>

                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', minWidth: '24px', textAlign: 'center', color: 'var(--text-primary)' }}>
                      +{bpmMargin}
                    </span>

                    <button
                      type="button"
                      className="bpm-adjust-btn"
                      onClick={() => setBpmMargin((prev) => Math.min(5, prev + 1))}
                      disabled={bpmMargin >= 5}
                      title="Augmenter la marge"
                      style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Big number on the right without "BPM" next to it */}
                <span className="bpm-value-display" style={{ lineHeight: '1' }}>{exactBpm}</span>
              </div>

              {/* Slider Range Field underneath */}
              <div className="slider-container" style={{ marginTop: '0px' }}>
                <div className="slider-group">
                  <input
                    type="range"
                    min="40"
                    max="220"
                    value={exactBpm}
                    onChange={(e) => setExactBpm(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Lancer la recherche
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error display */}
      {error && <div className="error-message">{error}</div>}

      {/* Results view */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">Recherche des morceaux en cours...</p>
        </div>
      ) : filteredTracks.length > 0 ? (
        <div className="results-section">
          <div className="results-meta">
            <h3 className="results-count">
              {!query.trim() && totalTracksCount !== null ? (
                `${filteredTracks.length} sur ${totalTracksCount} morceau${totalTracksCount > 1 ? 'x' : ''} trouvé${totalTracksCount > 1 ? 's' : ''}`
              ) : (
                `${filteredTracks.length} morceau${filteredTracks.length > 1 ? 'x' : ''} trouvé${filteredTracks.length > 1 ? 's' : ''}`
              )}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Trié par tempo
            </span>
          </div>

          <div className="tracks-grid">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                playingTrack={playingTrack}
                resolvingYt={resolvingYt}
                youtubeId={youtubeId}
                onPlayTrack={handlePlayTrack}
              />
            ))}
          </div>

          {/* Lazy Loading Sentinel */}
          {hasMore && filteredTracks.length > 0 && (
            <div 
              ref={observerRef} 
              className="lazy-load-sentinel"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0', width: '100%', minHeight: '60px' }}
            >
              {loadingMore && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2.5px' }} />
                  <span className="loading-text" style={{ marginLeft: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Chargement de plus de morceaux...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <svg className="empty-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>Aucun morceau à afficher</p>
          <p style={{ fontSize: '0.9rem', opacity: '0.7' }}>
            Lancez une recherche ci-dessus pour trouver des pépites musicales à votre tempo.
          </p>
        </div>
      )}

      {/* Sticky Bottom Player */}
      {playingTrack && (
        <BottomPlayer
          playingTrack={playingTrack}
          resolvingYt={resolvingYt}
          youtubeId={youtubeId}
          onClosePlayer={handleClosePlayer}
        />
      )}

      {/* Floating Bottom-Left Metronome */}
      {showMetronome && (
        <Metronome
          onClose={() => setShowMetronome(false)}
          exactBpm={exactBpm}
          onAdjustBpm={adjustMetronomeBpm}
        />
      )}

      {/* Footer Attribution */}
      <footer className="app-footer">
        <p>Données de tempo fournies par <a href="https://getsongbpm.com" target="_blank" rel="noopener noreferrer">GetSongBPM</a>. Écoute complète résolue via YouTube Music.</p>
      </footer>
    </div>
  );
}
