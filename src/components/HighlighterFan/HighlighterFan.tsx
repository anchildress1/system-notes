'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { DEFAULT_PEN, parsePen, PEN_STORAGE_KEY, PENS, type Pen } from '@/lib/pen';
import styles from './HighlighterFan.module.css';

const LIFT_MS = 230;
const DRAW_MS = 700;
// The splayed pens leave gaps, and a pointer crossing one to reach the next pen
// leaves the fan. Closing at once folded the pen away from under the cursor.
const HOVER_GRACE_MS = 600;

// Nothing else writes data-pen, so there is nothing to subscribe to. The store
// exists to read the head script's stamp after hydration without a mismatch.
function subscribe(): () => void {
  return () => {};
}

function readPen(): Pen {
  return parsePen(document.documentElement.dataset.pen) ?? DEFAULT_PEN;
}

function serverPen(): Pen {
  return DEFAULT_PEN;
}

function applyPen(pen: Pen): void {
  const root = document.documentElement;
  if (pen === DEFAULT_PEN) delete root.dataset.pen;
  else root.dataset.pen = pen;
}

function clearPenPhase(): void {
  delete document.documentElement.dataset.penPhase;
}

// Two frames, so the zero-width band commits before the draw transition starts;
// one frame can coalesce both into a single style change.
function afterNextPaint(callback: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

// A finger has no hover to open the fan, so its first tap opens it instead. Read
// from the event, because a touchscreen laptop reports (hover: hover) and a
// finger there still cannot hover. Keyboard clicks carry no pointer type.
function isTouch(pointerType: string): boolean {
  return pointerType ? pointerType !== 'mouse' : !matchMedia('(hover: hover)').matches;
}

// Hydrated or not, without a mismatch. The server cannot know the stored pen,
// so a server-rendered fan showed gold until hydration swapped the pen in.
function readHydrated(): boolean {
  return true;
}

function serverHydrated(): boolean {
  return false;
}

type PenState = 'hide' | 'tuck' | 'rest' | 'show' | 'out';

function penState(chosen: boolean, expanded: boolean, tucked: boolean): PenState {
  if (expanded) return chosen ? 'out' : 'show';
  if (tucked) return chosen ? 'tuck' : 'hide';
  return chosen ? 'rest' : 'hide';
}

export default function HighlighterFan() {
  const stamped = useSyncExternalStore(subscribe, readPen, serverPen);
  // Leads data-pen by the length of the lift, so the fan answers the click at
  // once while the page is still taking the old ink off.
  const [picked, setPicked] = useState<Pen | null>(null);
  const pen = picked ?? stamped;
  const pickedRef = useRef<Pen | null>(null);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  // Out on arrival, so a first-time reader sees there is a pen to pick. The
  // first scroll tucks it for good: a pen that came back whenever scrolling
  // stopped landed on the line being read.
  const [tucked, setTucked] = useState(false);
  const fanRef = useRef<HTMLFieldSetElement>(null);
  const timers = useRef<number[]>([]);
  // Bumped by every pick and by teardown. A frame callback cannot be cleared
  // with the timers, so a superseded swap checks this and stands down.
  const swap = useRef(0);
  const hoverOff = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => {
      setTucked(true);
      setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!fanRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // A reload restores the scroll position, often before this listener exists,
    // so no event arrives and the pen would stay out over the text.
    if (window.scrollY > 0) onScroll();
    document.addEventListener('pointerdown', onPointerDown);
    const pending = timers.current;
    return () => {
      clearTimeout(hoverOff.current);
      pending.forEach(clearTimeout);
      swap.current += 1;
      // Torn down mid-swap, the phase would hold every band at zero width.
      clearPenPhase();
      if (pickedRef.current) applyPen(pickedRef.current);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const pick = useCallback(
    (next: Pen, pointerType: string) => {
      const touch = isTouch(pointerType);
      // Keyboard focus already shows every pen, so a key press there picks.
      if (touch && !open && !focus) {
        setOpen(true);
        return;
      }
      if (touch) setOpen(false);
      if (next === pen) return;

      try {
        localStorage.setItem(PEN_STORAGE_KEY, next);
      } catch {
        // Storage throws in sandboxed frames and under blocked site data.
        // The pen still applies for this page; it just will not be remembered.
      }
      pickedRef.current = next;
      setPicked(next);

      const root = document.documentElement;
      timers.current.forEach(clearTimeout);
      timers.current.length = 0;
      const id = ++swap.current;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        clearPenPhase();
        applyPen(next);
        return;
      }
      root.dataset.penPhase = 'lift';
      timers.current.push(
        window.setTimeout(() => {
          root.dataset.penPhase = 'pre';
          applyPen(next);
          afterNextPaint(() => {
            if (id !== swap.current) return;
            root.dataset.penPhase = 'draw';
            timers.current.push(window.setTimeout(clearPenPhase, DRAW_MS));
          });
        }, LIFT_MS)
      );
    },
    [focus, open, pen]
  );

  const onFocus = (event: FocusEvent<HTMLFieldSetElement>) => {
    // Keyboard focus only: a mouse click also focuses the pen, and that must not
    // pin the fan open after the pointer leaves.
    if (event.target.matches(':focus-visible')) setFocus(true);
  };

  const onBlur = (event: FocusEvent<HTMLFieldSetElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLFieldSetElement>) => {
    if (event.key !== 'Escape') return;
    // Focus moves to the chosen pen first, because every other pen is about to
    // hide, and a hidden element holding focus strands the reader.
    event.currentTarget.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    setFocus(false);
    setOpen(false);
    setHover(false);
  };

  const hydrated = useSyncExternalStore(subscribe, readHydrated, serverHydrated);
  if (!hydrated) return null;

  const expanded = open || hover || focus;
  const others = PENS.filter((id) => id !== pen);
  // Source order is the fan's order, bottom up: the chosen pen first, so Tab
  // enters on the one pen showing, then climbs. In PENS order, Tab from the
  // chosen pen never reached the pens listed before it.
  const order = [pen, ...[...others].reverse()];

  return (
    // A landmark, because content outside one is unreachable by landmark
    // navigation, and the fan sits outside the header, main and footer.
    <aside className={styles.fan} aria-label="Highlighter">
      <fieldset
        ref={fanRef}
        className={styles.group}
        // A tap fires an enter with no leave, which would pin the fan open.
        onPointerEnter={(event) => {
          clearTimeout(hoverOff.current);
          if (event.pointerType === 'mouse') setHover(true);
        }}
        onPointerLeave={() => {
          hoverOff.current = window.setTimeout(() => setHover(false), HOVER_GRACE_MS);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      >
        <legend className="visually-hidden">Highlighter colour</legend>
        {order.map((id) => {
          const chosen = id === pen;
          return (
            <button
              key={id}
              type="button"
              className={styles.pen}
              data-pen={id}
              data-state={penState(chosen, expanded, tucked)}
              data-slot={chosen ? 3 : others.indexOf(id)}
              aria-pressed={chosen}
              aria-label={`${id[0].toUpperCase()}${id.slice(1)} highlighter`}
              onClick={(event) =>
                pick(id, (event.nativeEvent as Partial<PointerEvent>).pointerType ?? '')
              }
            >
              <PenDrawing />
            </button>
          );
        })}
      </fieldset>
    </aside>
  );
}

/* A drawing, not an icon: a highlighter with its cap off, tip pointing left.
   Every fill reads a token, so the barrel is whichever pen the button sets. */
function PenDrawing() {
  return (
    <svg
      className={styles.drawing}
      viewBox="0 0 176 32"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path className={styles.base} d="M2 12.6 L13 9 L13 23 L4 23 Q2.4 23 2.2 21.4 Z" />
      <path
        className={styles.shade}
        opacity="0.22"
        d="M2 12.6 L13 9 L13 23 L4 23 Q2.4 23 2.2 21.4 Z"
      />
      <path className={styles.shineLine} opacity="0.6" d="M3.4 13 L12.2 10.3" />
      <rect className={styles.cap} x="12.5" y="7.5" width="9" height="17" rx="1.2" />
      <rect className={styles.shine} opacity="0.18" x="15.4" y="7.5" width="0.7" height="17" />
      <rect className={styles.base} x="21" y="4" width="148" height="24" rx="3.5" />
      <rect className={styles.shade} opacity="0.12" x="21" y="19" width="148" height="9" rx="3.5" />
      {[25, 28, 31, 34].map((x) => (
        <rect
          key={x}
          className={styles.shade}
          opacity="0.1"
          x={x}
          y="4.6"
          width="0.9"
          height="22.8"
        />
      ))}
      <rect className={styles.shade} opacity="0.14" x="62" y="4" width="40" height="24" />
      <rect
        className={styles.shine}
        opacity="0.38"
        x="67"
        y="12.6"
        width="22"
        height="1.4"
        rx="0.7"
      />
      <rect
        className={styles.shine}
        opacity="0.24"
        x="67"
        y="16.6"
        width="14"
        height="1.4"
        rx="0.7"
      />
      <rect
        className={styles.shade}
        opacity="0.16"
        x="116"
        y="11.5"
        width="38"
        height="9"
        rx="2.5"
      />
      <rect className={styles.shade} opacity="0.3" x="117" y="14" width="26" height="5.5" rx="2" />
      <rect
        className={styles.shine}
        opacity="0.35"
        x="117"
        y="12.3"
        width="36"
        height="1"
        rx="0.5"
      />
      <rect
        className={styles.shine}
        opacity="0.42"
        x="24"
        y="7.2"
        width="142"
        height="1.8"
        rx="0.9"
      />
      <rect className={styles.base} x="166" y="5" width="7" height="22" rx="2.5" />
      <rect className={styles.shade} opacity="0.3" x="166" y="5" width="7" height="22" rx="2.5" />
      <rect
        className={styles.shine}
        opacity="0.25"
        x="166"
        y="6.6"
        width="7"
        height="1.4"
        rx="0.7"
      />
    </svg>
  );
}
