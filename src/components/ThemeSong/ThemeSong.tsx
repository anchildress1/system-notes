'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './ThemeSong.module.css';

export const TRACK_TITLE = 'I Build Things';
export const TRACK_ARTIST = 'Twisted Game Songs';
export const TRACK_SRC = '/audio/twisted-game-songs-i-build-things.mp3';

/** Bars in the panel's waveform. Decorative, and hidden from assistive tech. */
const WAVEFORM_BARS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Formats a media time for display.
 *
 * @param seconds Elapsed or total seconds; may be NaN before metadata loads.
 * @returns `m:ss`, or `0:00` when the value is not a usable number.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

/**
 * The header's theme-song control: a pill that starts and stops playback, and
 * a panel that expands beside it with the track and its progress.
 *
 * The pill reports `aria-pressed` from the audio element's own events rather
 * than from the click, so a playback that never starts — autoplay refused, file
 * missing — cannot leave the control claiming to be on.
 */
export default function ThemeSong() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const panelId = useId();

  // Pausing on unmount stops audio outliving the header across a route change.
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      // A refused play() is a normal outcome (autoplay policy, decode failure),
      // not an exception to surface. The control reports it and stays usable.
      setHasError(true);
    }
  }

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  // The advisory is part of the control's name, not just the panel's: the panel
  // only exists once the track is already playing, which is too late to warn.
  const label = hasError
    ? 'Theme song unavailable'
    : `${isPlaying ? 'Stop' : 'Play'} the theme song, ${TRACK_TITLE} by ${TRACK_ARTIST}. ` +
      'Explicit content.';

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={isPlaying}
        aria-label={label}
        aria-describedby={isPlaying ? panelId : undefined}
        disabled={hasError}
        onClick={toggle}
      >
        <span aria-hidden="true">♫</span> theme song
        {/* Visible before the click, because that is when it is useful. The
            accessible name carries it in words; this is the seen equivalent. */}
        <span className={styles.explicit} aria-hidden="true" title="Explicit content">
          E
        </span>
      </button>

      {isPlaying ? (
        <div className={styles.panel} id={panelId}>
          <p className={styles.track}>
            <span className={styles.trackTitle}>
              {TRACK_TITLE}
              <span className={styles.explicit} aria-hidden="true">
                E
              </span>
            </span>
            <span className={styles.trackArtist}>{TRACK_ARTIST} · explicit</span>
          </p>
          <div className={styles.waveform} aria-hidden="true">
            {WAVEFORM_BARS.map((bar) => (
              <span key={bar} className={styles.bar} style={{ animationDelay: `${bar * 90}ms` }} />
            ))}
          </div>
          <div className={styles.progressRow}>
            <progress
              className={styles.progress}
              value={Math.round(progress)}
              max={100}
              aria-label="Theme song progress"
            />
            <span className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      ) : null}

      <p className={styles.announce} aria-live="polite">
        {hasError ? 'Theme song unavailable' : isPlaying ? 'Theme song playing' : ''}
      </p>

      {/* preload="none" keeps a 9 MB track off every page load; it is fetched
          only once someone asks for it. */}
      <audio
        ref={audioRef}
        src={TRACK_SRC}
        preload="none"
        data-testid="theme-song-audio"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          setHasError(true);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      >
        <track kind="captions" src="data:text/vtt," default label="No captions available" />
      </audio>
    </div>
  );
}
