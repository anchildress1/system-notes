'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import styles from './SearchPageWrapper.module.css';

// Mirrors the real grid's 7-card rhythm so the placeholder reads as "the index
// is arriving" rather than "nothing works yet" — and so nothing shifts when it
// swaps in. The shapes are decorative; the status text carries the meaning.
const SKELETON_SPANS = [2, 2, 2, 3, 3, 4, 2];

const SearchLoading = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.skeleton} role="status">
      <span className={styles.srOnly}>Loading search…</span>
      <div className={`${styles.bar} ${styles.searchBar}`} aria-hidden="true" />
      <div className={styles.filterRow} aria-hidden="true">
        <div className={`${styles.bar} ${styles.chip}`} />
        <div className={`${styles.bar} ${styles.chip}`} />
        <div className={`${styles.bar} ${styles.chip}`} />
      </div>
      <div className={styles.cardGrid} aria-hidden="true">
        {SKELETON_SPANS.map((span, i) => (
          <div
            key={`${span}-${i}`}
            className={`${styles.bar} ${styles.card}`}
            style={{ gridColumn: `span ${span}` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const SearchPage = dynamic(() => import('./SearchPage'), {
  ssr: false,
  loading: SearchLoading,
});

export default function SearchPageWrapper() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <ErrorBoundary>
      <div ref={wrapperRef} data-testid="search-page-wrapper">
        {isVisible ? <SearchPage /> : <SearchLoading />}
      </div>
    </ErrorBoundary>
  );
}
