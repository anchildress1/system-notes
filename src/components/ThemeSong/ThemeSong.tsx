'use client';

import { useEffect, useRef, useState } from 'react';
import { FiPause, FiPlay } from 'react-icons/fi';
import styles from './ThemeSong.module.css';

export const TRACK_TITLE = 'I Build Things';
export const TRACK_ARTIST = 'Twisted Game Songs';
export const TRACK_SRC = '/audio/twisted-game-songs-i-build-things.mp3';
/** The track carries explicit lyrics. A fact about the audio, so it lives with
 *  the rest of the track's metadata rather than in the page copy — a different
 *  file cannot inherit this one's rating. */
export const TRACK_EXPLICIT = true;

/* The equalizer: ten bars at fixed heights, each with its own period so the run
   never pulses in unison. Decorative, and hidden from assistive tech. */
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

/* The theme-song player: one control, a status line, and a decorative equalizer
   that runs only while the track does.

   The control reports `aria-pressed` from the audio element's own events rather
   than from the click, so the state always matches what is actually playing. */
export default function ThemeSong() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
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

  // The advisory is part of the control's name: someone deciding whether to
  // press it needs the warning before the track starts, not after.
  const action = isPlaying ? 'Pause' : 'Play';
  const advisory = TRACK_EXPLICIT ? ' Explicit content.' : '';
  const label = hasError
    ? 'Theme song unavailable'
    : `${action} the theme song, ${TRACK_TITLE} by ${TRACK_ARTIST}.${advisory}`;

  let note = TRACK_ARTIST;
  if (hasError) note = 'track unavailable';
  else if (isPlaying) note = 'now playing';

  return (
    <div className={styles.player}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.toggle}
          data-variant="filled"
          data-accent="filled"
          aria-pressed={isPlaying}
          aria-label={label}
          disabled={hasError}
          onClick={toggle}
        >
          {/* Feather draws both as outlines; fill=currentColor solidifies the same shape
   rather than importing a second icon family for two marks. */}
          {isPlaying ? (
            <FiPause aria-hidden="true" fill="currentColor" size={13} />
          ) : (
            <FiPlay aria-hidden="true" fill="currentColor" size={13} />
          )}
          {isPlaying ? 'Pause' : 'Play it'}
          {/* aria-hidden: the button's accessible name already ends in "Explicit content." */}
          {TRACK_EXPLICIT ? (
            <span className="explicit" aria-hidden="true">
              E
            </span>
          ) : null}
        </button>
        <p className={styles.note} aria-live="polite">
          {note}
        </p>
      </div>

      <div className={styles.equalizer} data-playing={isPlaying} aria-hidden="true">
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
      >
        <track kind="captions" src="data:text/vtt," default label="No captions available" />
      </audio>
    </div>
  );
}
