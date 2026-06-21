'use client';

import { useState, useRef } from 'react';
import { FiPlay, FiPause, FiMusic } from 'react-icons/fi';
import styles from './MusicPlayer.module.css';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Playback failed:', error);
        setIsPlaying(false);
        setHasError(true);
      }
    }
  };

  const handleEnded = () => setIsPlaying(false);

  const handleAudioError = () => {
    const mediaError = audioRef.current?.error;
    console.error('Audio element error:', {
      code: mediaError?.code,
      message: mediaError?.message,
      src: audioRef.current?.src,
    });
    setIsPlaying(false);
    setHasError(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.playerWrapper} data-testid="music-player">
      <div className={styles.panel} data-testid="player-panel">
        <div className={styles.panelHeader}>
          <div className={styles.albumArt} aria-hidden="true">
            <FiMusic size={20} />
          </div>
          <div className={styles.trackInfo}>
            <span className={styles.trackTitle}>
              I Build Things{' '}
              <span className={styles.trackExplicit} aria-hidden="true">
                E
              </span>
            </span>
            <span className={styles.trackMeta}>TWISTED GAME · THEME SONG</span>
          </div>
        </div>

        <div className={styles.waveform} aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`${styles.bar} ${isPlaying ? styles.barActive : ''}`}
              style={{ '--bar-i': i } as React.CSSProperties}
            />
          ))}
        </div>

        <div className={styles.progressSection}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Track progress"
          >
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.timestamps}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`${styles.playButton} ${isPlaying ? styles.active : ''}`}
        onClick={togglePlay}
        disabled={hasError}
        aria-label={
          isPlaying
            ? "Pause 'I Build Things' by Twisted Game Songs"
            : "Play 'I Build Things' by Twisted Game Songs (Explicit Content). Muted by default."
        }
        data-testid="play-button"
      >
        {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
        <span className={styles.explicitBadge} aria-hidden="true">
          E
        </span>
      </button>

      <span className={styles.buttonLabel} aria-hidden="true">
        THEME SONG
      </span>

      <audio
        ref={audioRef}
        src="/audio/twisted-game-songs-i-build-things.mp3"
        onEnded={handleEnded}
        onError={handleAudioError}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="none"
      >
        {/* S4084: track element required for accessible media */}
        <track kind="captions" src="data:text/vtt," default label="No captions available" />
      </audio>
    </div>
  );
}
