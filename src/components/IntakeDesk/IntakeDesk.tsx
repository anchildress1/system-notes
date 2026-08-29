'use client';

import { useCallback, useId, useState, useSyncExternalStore } from 'react';
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

/** Problems a reader can load into the field instead of writing their own. */
export const SEEDS = [
  'When something breaks, we can’t tell which AI wrote it.',
  'My seniors are skimming four-hundred-line AI diffs and calling it review.',
  'Nothing errored. The output was just quietly wrong.',
] as const;

export default function IntakeDesk() {
  const [problem, setProblem] = useState('');
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

  const keepBrief = useCallback(
    (answer: string) => {
      if (asked) keep({ question: asked.text, answer });
    },
    [asked]
  );

  // Released on any terminal state, not just a successful answer. Clearing this
  // only in keepBrief left the form permanently disabled whenever a turn failed
  // or never came back.
  const releaseForm = useCallback(() => setInFlight(false), []);

  const canAsk = hasValidAgentCredentials();
  const trimmed = problem.trim();

  return (
    <div className={styles.desk}>
      <form
        className={styles.compose}
        onSubmit={(event) => {
          event.preventDefault();
          if (!trimmed || !canAsk || inFlight) return;
          setInFlight(true);
          setAsked((previous) => ({ text: trimmed, nonce: (previous?.nonce ?? 0) + 1 }));
          // The field empties on submit: the question has moved to the brief below, which
          // quotes it back.
          setProblem('');
        }}
      >
        <label className="visually-hidden" htmlFor={fieldId}>
          The problem
        </label>
        <textarea
          id={fieldId}
          className={styles.field}
          data-focus="ruled"
          rows={2}
          value={problem}
          onChange={(event) => setProblem(event.target.value)}
          readOnly={inFlight}
          aria-describedby={canAsk ? undefined : noticeId}
          placeholder="e.g. When something breaks, we can’t tell which AI wrote it."
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
        <p className={styles.shelfLabel}>Or take one off the shelf.</p>
        <ul className={styles.seeds}>
          {SEEDS.map((seed) => (
            <li key={seed}>
              <button type="button" className={styles.seed} onClick={() => setProblem(seed)}>
                {seed}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {asked || saved ? (
        <div className={styles.answer}>
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
