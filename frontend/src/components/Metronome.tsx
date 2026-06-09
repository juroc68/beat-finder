import React, { useState, useEffect, useRef } from 'react';

interface MetronomeProps {
  onClose: () => void;
  exactBpm: number;
  onAdjustBpm: (amount: number) => void;
}

export const Metronome: React.FC<MetronomeProps> = ({
  onClose,
  exactBpm,
  onAdjustBpm,
}) => {
  const [metronomePlaying, setMetronomePlaying] = useState(false);
  const [isBeatActive, setIsBeatActive] = useState(false);
  const [beatTick, setBeatTick] = useState(0);
  const [visualBeatDuration, setVisualBeatDuration] = useState(60 / exactBpm);
  const metronomeAudioCtxRef = useRef<AudioContext | null>(null);

  const weightPercent = Math.max(0, Math.min(1, (exactBpm - 40) / 180));
  const weightTop = 10 + weightPercent * 35;
  const needleClass = !metronomePlaying
    ? 'left'
    : (beatTick % 2 === 0 ? 'left' : 'right');

  const bpmRef = useRef(exactBpm);
  useEffect(() => {
    bpmRef.current = exactBpm;
  }, [exactBpm]);

  useEffect(() => {
    if (!metronomePlaying) return;

    const audioCtx = metronomeAudioCtxRef.current;
    if (!audioCtx || audioCtx.state !== 'running') return;

    let nextNoteTime = audioCtx.currentTime + 0.05;
    let schedulerTimerId: number | undefined;
    const visualTimerIds = new Set<number>();
    const scheduledOscillators = new Set<OscillatorNode>();

    const scheduleVisualTimer = (callback: () => void, delayMs: number) => {
      const timerId = window.setTimeout(() => {
        visualTimerIds.delete(timerId);
        callback();
      }, delayMs);
      visualTimerIds.add(timerId);
    };

    const scheduleBeat = (timeToPlay: number, beatInterval: number) => {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      scheduledOscillators.add(oscillator);

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.frequency.setValueAtTime(1000, timeToPlay);
      gain.gain.setValueAtTime(0.35, timeToPlay);
      gain.gain.exponentialRampToValueAtTime(0.001, timeToPlay + 0.04);
      oscillator.start(timeToPlay);
      oscillator.stop(timeToPlay + 0.05);
      oscillator.onended = () => scheduledOscillators.delete(oscillator);

      const delayMs = Math.max(0, (timeToPlay - audioCtx.currentTime) * 1000);
      scheduleVisualTimer(() => {
        setVisualBeatDuration(beatInterval);
        setIsBeatActive(true);
        setBeatTick((previousTick) => previousTick + 1);
        scheduleVisualTimer(() => setIsBeatActive(false), 70);
      }, delayMs);
    };

    const scheduler = () => {
      const currentTime = audioCtx.currentTime;
      const currentBeatInterval = 60 / bpmRef.current;

      // A throttled background tab must skip missed beats instead of replaying them in a burst.
      if (nextNoteTime < currentTime) {
        const missedBeats = Math.floor((currentTime - nextNoteTime) / currentBeatInterval) + 1;
        nextNoteTime += missedBeats * currentBeatInterval;
      }

      while (nextNoteTime < currentTime + 0.1) {
        const beatInterval = 60 / bpmRef.current;
        scheduleBeat(nextNoteTime, beatInterval);
        nextNoteTime += beatInterval;
      }

      schedulerTimerId = window.setTimeout(scheduler, 25);
    };

    schedulerTimerId = window.setTimeout(scheduler, 0);

    return () => {
      if (schedulerTimerId !== undefined) {
        window.clearTimeout(schedulerTimerId);
      }
      visualTimerIds.forEach((timerId) => window.clearTimeout(timerId));
      scheduledOscillators.forEach((oscillator) => {
        oscillator.onended = null;
        try {
          oscillator.stop();
        } catch {
          // The oscillator may already have finished naturally.
        }
      });
    };
  }, [metronomePlaying]);

  useEffect(() => () => {
    const audioCtx = metronomeAudioCtxRef.current;
    if (audioCtx && audioCtx.state !== 'closed') {
      void audioCtx.close();
    }
  }, []);

  const startMetronome = async () => {
    let audioCtx = metronomeAudioCtxRef.current;
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioCtxClass();
      metronomeAudioCtxRef.current = audioCtx;
    }

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    setVisualBeatDuration(60 / bpmRef.current);
    setMetronomePlaying(true);
  };

  const stopMetronome = () => {
    setMetronomePlaying(false);
    setIsBeatActive(false);
    setBeatTick(0);
  };

  return (
    <div className="bottom-left-metronome">
      <button 
        type="button" 
        className="widget-close-btn"
        onClick={() => {
          onClose();
          stopMetronome();
        }}
        title="Fermer le métronome"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      
      <div className="metronome-pendulum-body">
        <div className="metronome-stand"></div>
        <div className={`metronome-ripple ${isBeatActive ? 'active' : ''}`}></div>
        <div 
          className={`metronome-needle ${needleClass}`}
          style={{ '--beat-duration': `${visualBeatDuration}s` } as React.CSSProperties}
        >
          <div className="metronome-weight" style={{ top: `${weightTop}px` }}></div>
        </div>
        <div className={`metronome-pivot ${isBeatActive ? 'active' : ''}`}></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '0.75rem' }}>
          <button
            type="button"
            className="bpm-adjust-btn"
            onClick={() => onAdjustBpm(-1)}
            title="Diminuer le BPM"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          
          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', minWidth: '60px', textAlign: 'center' }}>
            {exactBpm} BPM
          </span>
          
          <button
            type="button"
            className="bpm-adjust-btn"
            onClick={() => onAdjustBpm(1)}
            title="Augmenter le BPM"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        <button
          type="button"
          className={`metronome-toggle-btn ${metronomePlaying ? 'playing' : ''}`}
          onClick={() => {
            if (metronomePlaying) {
              stopMetronome();
            } else {
              void startMetronome();
            }
          }}
          title={metronomePlaying ? 'Arrêter' : 'Démarrer'}
          style={{ width: '38px', height: '38px', borderRadius: '50%', justifyContent: 'center', padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {metronomePlaying ? (
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
            ) : (
              <path d="M8 5v14l11-7z" fill="currentColor" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
};
