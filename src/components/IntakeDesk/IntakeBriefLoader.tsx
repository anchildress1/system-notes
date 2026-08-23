'use client';

import dynamic from 'next/dynamic';
import styles from './IntakeDesk.module.css';

/**
 * Keeps InstantSearch and the agent transport out of the intake's first load.
 *
 * The landing page is the one surface with the tightest performance floor, and
 * none of this is needed until someone actually asks something. The chunk is
 * fetched on the first submit, not on arrival.
 */
const IntakeBrief = dynamic(() => import('./IntakeBrief'), {
  ssr: false,
  loading: () => (
    <output className={styles.briefWorking}>
      <span className={styles.briefWorkingLabel}>Opening the intake</span>
      <span className={styles.briefCaret} aria-hidden="true" />
    </output>
  ),
});

export default IntakeBrief;
