'use client';

import dynamic from 'next/dynamic';
import type { IndexPulse } from '@/lib/indexPulse';
import styles from './IndexWorkspace.module.css';

const IndexWorkspace = dynamic(() => import('./IndexWorkspace'), {
  ssr: false,
  loading: () => (
    <output className={styles.loadingShell}>
      <span>Loading the index</span>
      <span aria-hidden="true">•••</span>
    </output>
  ),
});

export default function IndexWorkspaceLoader({ pulse }: Readonly<{ pulse?: IndexPulse | null }>) {
  return <IndexWorkspace pulse={pulse} />;
}
