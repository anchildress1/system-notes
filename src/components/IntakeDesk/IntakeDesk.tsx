'use client';

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { hasValidAgentCredentials } from '@/lib/algolia';
import BriefBody from './BriefBody';
import IntakeBrief from './IntakeBriefLoader';
import styles from './IntakeDesk.module.css';

/**
 * Where a settled brief is kept so leaving the page does not discard it.
 *
 * sessionStorage rather than localStorage: the answer belongs to this visit. It
 * survives reading a note and coming back, and does not greet someone next week
 * with a question they no longer remember asking.
 */
const BRIEF_KEY = 'system-notes-intake-brief';

type SavedBrief = { question: string; answer: string };

/** Cached so the snapshot is referentially stable between renders. */
let cache: SavedBrief | null | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SavedBrief | null {
  if (cache === undefined) cache = readSavedBrief();
  return cache;
}

/** The server has no session storage, so it renders as though none was kept. */
function getServerSnapshot(): SavedBrief | null {
  return null;
}

function keep(brief: SavedBrief): void {
  cache = brief;
  try {
    sessionStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
  } catch {
    // Storage refused it. The brief still renders for this page view.
  }
  for (const listener of listeners) listener();
}

function readSavedBrief(): SavedBrief | null {
  try {
    const raw = sessionStorage.getItem(BRIEF_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { question, answer } = parsed as Partial<SavedBrief>;
    return typeof question === 'string' && typeof answer === 'string' ? { question, answer } : null;
  } catch {
    // Unavailable in private mode, or holding something another build wrote.
    return null;
  }
}

/** Questions a reader can load into the field instead of writing their own. */
export const SEEDS = [
  'Can this run somewhere our data never leaves?',
  'What happens when the search gets slow?',
  'How do you catch it when the answer is wrong but sounds right?',
] as const;

export default function IntakeDesk() {
  const [question, setQuestion] = useState('');
  // The asked question is held apart from what is being typed: editing the
  // field must not re-send, and re-asking the same words must re-send. The
  // nonce is what makes the second one true.
  const [asked, setAsked] = useState<{ text: string; nonce: number } | null>(null);
  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const fieldId = useId();
  const noticeId = useId();

  // A question is in flight from the moment it is asked until the brief hands an
  // answer back. Without this the form stayed live under a running request.
  const [inFlight, setInFlight] = useState(false);

  /* Submitting cleared the field and rendered the brief below the fold, so the
     only feedback was the field emptying. Honors reduced motion through the
     global scroll-behavior guard. */
  const answerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (asked) answerRef.current?.scrollIntoView({ block: 'nearest' });
  }, [asked]);

  /* A live region announces a mutation to a region already on the page. The brief's
     working and failure states are both <output> returned by IntakeBrief, so those
     two swap in place and announce; the answer is a BriefBody, a different element
     type at the same slot, so React replaces the node and it announces nothing.
     Measured, not assumed. This region outlives all three states. */
  const [progress, setProgress] = useState('');

  const keepBrief = useCallback(
    (answer: string) => {
      if (asked) keep({ question: asked.text, answer });
      // Short on purpose: the brief runs to well over a thousand characters, and
      // role=status is atomic.
      setProgress('The brief is ready.');
    },
    [asked]
  );

  // Released on any terminal state, not just a successful answer. Clearing this
  // only in keepBrief left the form permanently disabled whenever a turn failed
  // or never came back.
  const releaseForm = useCallback(() => setInFlight(false), []);

  const canAsk = hasValidAgentCredentials();
  const trimmed = question.trim();

  return (
    <div className={styles.desk}>
      <output className="visually-hidden">{progress}</output>
      <form
        className={styles.compose}
        onSubmit={(event) => {
          event.preventDefault();
          if (!trimmed || !canAsk || inFlight) return;
          setInFlight(true);
          setProgress('');
          setAsked((previous) => ({ text: trimmed, nonce: (previous?.nonce ?? 0) + 1 }));
          // The field empties on submit: the question has moved to the brief below, which
          // quotes it back.
          setQuestion('');
        }}
      >
        <label className="visually-hidden" htmlFor={fieldId}>
          Your question
        </label>
        <textarea
          id={fieldId}
          className={styles.field}
          data-focus="ruled"
          rows={2}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          readOnly={inFlight}
          aria-describedby={canAsk ? undefined : noticeId}
          placeholder="e.g. Can this run somewhere our data never leaves?"
        />
        <div className={styles.controls}>
          <button
            type="submit"
            className={styles.run}
            data-variant="filled"
            data-accent="filled"
            data-working={inFlight || undefined}
            disabled={!canAsk || inFlight}
            aria-busy={inFlight || undefined}
          >
            Run it
          </button>
          {canAsk ? null : (
            <p id={noticeId} className={styles.notice}>
              The agent is not reachable from here. The index and the exhibits hold the same
              evidence it reads from.
            </p>
          )}
        </div>
      </form>

      <div className={styles.shelf}>
        <p className={styles.shelfLabel}>Ask about my work</p>
        <ul className={styles.seeds}>
          {SEEDS.map((seed) => (
            <li key={seed}>
              <button type="button" className={styles.seed} onClick={() => setQuestion(seed)}>
                {seed}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {asked || saved ? (
        <div className={styles.answer} ref={answerRef}>
          {asked ? (
            // Keyed so asking again is a fresh turn rather than an append: the
            // agent answers a question, it does not hold a conversation.
            <IntakeBrief
              key={`${asked.nonce}:${asked.text}`}
              question={asked.text}
              onSettled={keepBrief}
              onFinished={releaseForm}
            />
          ) : (
            // Restored from a previous view. Rendered directly rather than
            // through the agent, so returning to the page costs no second call.
            <BriefBody question={saved!.question} answer={saved!.answer} />
          )}
        </div>
      ) : null}
    </div>
  );
}
