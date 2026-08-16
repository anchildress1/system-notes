'use client';

import dynamic from 'next/dynamic';
import styles from './IndexWorkspace.module.css';

const IndexWorkspace = dynamic(() => import('./IndexWorkspace'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingShell} role="status">
      <span>Loading the index</span>
      <span aria-hidden="true">•••</span>
    </div>
  ),
});

export default function IndexWorkspaceLoader() {
  return <IndexWorkspace />;
}
