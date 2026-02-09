'use client';

import { useInstantSearch } from 'react-instantsearch';
import styles from './SearchPage.module.css';

export default function LoadingIndicator() {
  const { status } = useInstantSearch();

  if (status === 'stalled' || status === 'loading') {
    return (
      <div className={styles.loadingIndicator}>
        <div className={styles.spinner} />
        <span>Loading results...</span>
      </div>
    );
  }

  return null;
}
