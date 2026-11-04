'use client';

import dynamic from 'next/dynamic';
import styles from './IntakeDesk.module.css';

/** Loads the agent chat on first submit, keeping it out of the landing page's first load. */
const IntakeBrief = dynamic(() => import('./IntakeBrief'), {
  ssr: false,
  loading: () => (
    <output className={styles.briefWorking} aria-busy="true">
      <span className={styles.briefWorkingHead}>
        <span className={styles.briefWorkingLabel}>Reading the evidence</span>
        <span className={styles.briefCaret} aria-hidden="true" />
      </span>
      <span className={styles.briefSweep} aria-hidden="true" />
    </output>
  ),
});

export default IntakeBrief;
