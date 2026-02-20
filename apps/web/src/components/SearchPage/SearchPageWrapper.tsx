'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import styles from './SearchPageWrapper.module.css';

// Lazy load SearchPage to reduce initial bundle size and improve performance.
// The search functionality is below the fold and not immediately needed for FCP/LCP.
// This defers loading all Algolia dependencies until the wrapper enters the viewport.
const SearchPage = dynamic(() => import('./SearchPage'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>Loading search...</div>
    </div>
  ),
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
        {isVisible ? (
          <SearchPage />
        ) : (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingContent}>Loading search...</div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
