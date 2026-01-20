'use client';

import { useState, useRef } from 'react';
import { LuPlay, LuPause } from 'react-icons/lu';
import styles from './MusicPlayer.module.css';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error('Playback failed:', e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className={styles.playerWrapper}>
      <button
        className={`${styles.playButton} ${isPlaying ? styles.active : ''}`}
        onClick={togglePlay}
        aria-label={
          isPlaying
            ? "Pause 'I Build Things' by Twisted Game Songs"
            : "Play 'I Build Things' by Twisted Game Songs (Explicit Content). Muted by default."
        }
      >
        {isPlaying ? <LuPause size={24} /> : <LuPlay size={24} />}
        <span className={styles.explicitBadge} aria-hidden="true">
          E
        </span>
      </button>

      <div className={styles.infoTooltip} role="tooltip">
        <span className={styles.songTitle}>I Build Things</span>
        <span className={styles.bandName}>Twisted Game Songs</span>
        <span className={styles.explicitWarning}>Explicit Lyrics</span>
      </div>

      <audio
        ref={audioRef}
        src="/audio/Twisted Game Songs - I Build Things.mp3"
        onEnded={handleEnded}
        preload="none"
      />
    </div>
  );
}
