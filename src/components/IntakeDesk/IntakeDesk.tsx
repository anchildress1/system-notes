'use client';

import { useId, useState } from 'react';
import styles from './IntakeDesk.module.css';

/** Problems a reader can load into the field instead of writing their own. */
export const SEEDS = [
  'Our AI-generated code passes review and then breaks in production.',
  'We can’t tell what our agents actually did, or who authorised it.',
  'The model hallucinates and we ship it straight to customers.',
] as const;

export default function IntakeDesk() {
  const [problem, setProblem] = useState('');
  const fieldId = useId();
  const noticeId = useId();

  return (
    <div className={styles.desk}>
      <div className={styles.compose}>
        <label className="visually-hidden" htmlFor={fieldId}>
          The problem
        </label>
        <textarea
          id={fieldId}
          className={styles.field}
          rows={5}
          value={problem}
          onChange={(event) => setProblem(event.target.value)}
          aria-describedby={noticeId}
          placeholder="e.g. Our AI-generated code passes review and then breaks in production."
        />
        <div className={styles.controls}>
          {/* Disabled rather than hidden: the control is the page's point, and a
              reader deserves to see what is coming and why it cannot run yet. */}
          <button type="button" className={styles.run} disabled>
            Run it
          </button>
          <p id={noticeId} className={styles.notice}>
            The retrieval agent is not connected yet. Until it is, the index and the exhibits are
            the working version of this.
          </p>
        </div>
      </div>

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
    </div>
  );
}
