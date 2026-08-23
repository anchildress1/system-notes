'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ThemeSong.module.css';

export const TRACK_TITLE = 'I Build Things';
export const TRACK_ARTIST = 'Twisted Game Songs';
export const TRACK_SRC = '/audio/twisted-game-songs-i-build-things.mp3';

/**
 * The equaliser, as the design draws it: ten bars, each with its own resting
 * height and its own animation period so the run never pulses in unison.
 * Decorative, and hidden from assistive tech.
 */
const BARS = [
  { height: 38, duration: 1.4, delay: 0 },
  { height: 72, duration: 1.1, delay: 0.12 },
  { height: 52, duration: 1.7, delay: 0.26 },
  { height: 96, duration: 1.25, delay: 0.06 },
  { height: 44, duration: 1.55, delay: 0.34 },
  { height: 80, duration: 1.05, delay: 0.2 },
  { height: 30, duration: 1.45, delay: 0.44 },
  { height: 64, duration: 1.2, delay: 0.3 },
  { height: 48, duration: 1.65, delay: 0.16 },
  { height: 88, duration: 1.15, delay: 0.4 },
] as const;

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
 * The theme-song player on the about page: one control, a status line, and a
 * decorative equaliser that runs only while the track does.
 *
 * The control reports `aria-pressed` from the audio element's own events rather
 * than from the click, so a playback that never starts — autoplay refused, file
 * missing — cannot leave it claiming to be on.
 */
export default function ThemeSong() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Pausing on unmount stops audio outliving the page across a route change.
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
  // The advisory is part of the control's name: someone deciding whether to
  // press it needs the warning before the track starts, not after.
  const label = hasError
    ? 'Theme song unavailable'
    : `${isPlaying ? 'Pause' : 'Play'} the theme song, ${TRACK_TITLE} by ${TRACK_ARTIST}. ` +
      'Explicit content.';

  let note = TRACK_ARTIST;
  if (hasError) note = 'track unavailable';
  else if (isPlaying) note = 'now playing';

  return (
    <div className={styles.player}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.toggle}
          data-accent="filled"
          aria-pressed={isPlaying}
          aria-label={label}
          disabled={hasError}
          onClick={toggle}
        >
          {isPlaying ? (
            <svg aria-hidden="true" width="11" height="13" viewBox="0 0 11 13" fill="currentColor">
              <rect x="0" y="0" width="4" height="13" />
              <rect x="7" y="0" width="4" height="13" />
            </svg>
          ) : (
            <svg aria-hidden="true" width="11" height="13" viewBox="0 0 11 13" fill="currentColor">
              <path d="M0 0l11 6.5L0 13z" />
            </svg>
          )}
          {isPlaying ? 'Pause' : 'Play it'}
          {/* Visible before the press, because that is when it is useful. The
              accessible name carries it in words; this is the seen equivalent. */}
          <span className={styles.explicit} aria-hidden="true" title="Explicit content">
            E
          </span>
        </button>
        <p className={styles.note} aria-live="polite">
          {note}
        </p>
      </div>

      <div className={styles.equaliser} data-playing={isPlaying} aria-hidden="true">
        {BARS.map((bar) => (
          <span
            key={bar.height + bar.delay}
            className={styles.bar}
            style={{
              height: `${bar.height}%`,
              animationDuration: `${bar.duration}s`,
              animationDelay: `${bar.delay}s`,
            }}
          />
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
