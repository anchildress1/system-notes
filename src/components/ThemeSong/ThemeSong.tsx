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

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  );
}

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

   A play request can still be buffering; only `playing` starts the equalizer. */
export default function ThemeSong() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';

  // Pausing on unmount stops audio outliving the page across a route change.
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused && status !== 'error') {
      audio.pause();
      return;
    }
    if (status === 'error') audio.load();
    setStatus('loading');
    try {
      await audio.play();
    } catch (error) {
      // Cancelling a pending play (including on unmount) rejects with AbortError.
      // Matched on .name rather than `instanceof DOMException` — a polyfilled
      // or shimmed environment can reject with an AbortError-named object that
      // fails that check, and misreporting a benign cancellation as a real
      // failure is worse than the reverse.
      if (isAbortError(error)) return;
      setStatus('error');
    }
  }

  // The advisory is part of the control's name: someone deciding whether to
  // press it needs the warning before the track starts, not after.
  let action = 'Play';
  if (isPlaying) action = 'Pause';
  else if (isLoading) action = 'Cancel loading';
  else if (status === 'error') action = 'Retry';
  let buttonText = action;
  if (isLoading) buttonText = 'Cancel';
  else if (status === 'idle') buttonText = 'Play it';
  const advisory = TRACK_EXPLICIT ? ' Explicit content.' : '';
  const label = `${action} the theme song, ${TRACK_TITLE} by ${TRACK_ARTIST}.${advisory}`;

  let note = TRACK_ARTIST;
  if (status === 'error') note = 'track unavailable · try again';
  else if (isLoading) note = 'loading audio…';
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
          onClick={toggle}
        >
          {/* Feather draws both as outlines; fill=currentColor solidifies the same shape
   rather than importing a second icon family for two marks. */}
          {isPlaying ? (
            <FiPause aria-hidden="true" fill="currentColor" size={13} />
          ) : (
            <FiPlay aria-hidden="true" fill="currentColor" size={13} />
          )}
          {buttonText}
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
        onPlay={() => setStatus('loading')}
        onPlaying={() => setStatus('playing')}
        onWaiting={(event) => {
          if (!event.currentTarget.paused) setStatus('loading');
        }}
        onPause={(event) => {
          const audio = event.currentTarget;
          // A newer play() can already have superseded this pause by the time
          // its (possibly queued) event fires; .paused is the live truth, this
          // event is not. Applying a stale pause here is how rapid toggling
          // desyncs the status from what is actually playing.
          if (!audio.paused) return;
          // Engines don't agree on whether `error` or `pause` fires first for a
          // fatal failure (WebKit in particular). Checking the previous status
          // as well as .error means an `error` event that already landed is
          // never downgraded back to 'idle' by the `pause` that follows it; if
          // `pause` lands first, the `error` event still due settles it.
          setStatus((prev) => (prev === 'error' || audio.error ? 'error' : 'idle'));
        }}
        onEnded={() => setStatus('idle')}
        onError={() => setStatus('error')}
      >
        <track kind="captions" src="data:text/vtt," default label="No captions available" />
      </audio>
    </div>
  );
}
