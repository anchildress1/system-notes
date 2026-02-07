'use client';

import { useEffect } from 'react';
import { SearchWithAskAI } from '@algolia/sitesearch/dist/index.js';
import '@algolia/sitesearch/dist/search.min.css';
import { getSearchSessionId } from '@/utils/userToken';
import { ErrorBoundary } from '../ErrorBoundary';
import styles from './SearchPage.module.css';

export default function SearchPage() {
  const isEnabled =
    process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID &&
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY &&
    process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME &&
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID;

  // Accessibility fix: Inject aria-labels into Algolia's Autocomplete elements
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const fixAccessibility = () => {
      // 1. Fix Input Label
      const input = document.querySelector('.aa-Input');
      if (input && !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', 'Search facts and system notes');
      }

      // 2. Fix Clear Button
      const clearBtn = document.querySelector('.aa-ClearButton');
      if (clearBtn && !clearBtn.getAttribute('aria-label')) {
        clearBtn.setAttribute('aria-label', 'Clear search query');
      }

      // 3. Fix Submit Button
      const submitBtn = document.querySelector('.aa-SubmitButton');
      if (submitBtn && !submitBtn.getAttribute('aria-label')) {
        submitBtn.setAttribute('aria-label', 'Submit search');
      }

      // 4. Fix Panel/Dropdown accessibility
      const panel = document.querySelector('.aa-Panel');
      if (panel) {
        if (!panel.getAttribute('role')) panel.setAttribute('role', 'listbox');
        if (!panel.getAttribute('aria-label'))
          panel.setAttribute('aria-label', 'Search predictions');
      }
    };

    // Run immediately in case elements are already present
    fixAccessibility();

    const observer = new MutationObserver(fixAccessibility);

    // Observe the document body for changes (since the portal/dropdown might be appended anywhere)
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const unavailableUI = (
    <div className={styles.container}>
      <div className={styles.errorState}>
        <p className={styles.errorMessage}>
          Search is currently unavailable. Please check back later.
        </p>
      </div>
    </div>
  );

  if (!isEnabled) {
    return unavailableUI;
  }

  return (
    <div className={styles.container}>
      <ErrorBoundary fallback={unavailableUI}>
        <SearchWithAskAI
          applicationId={process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID!}
          apiKey={process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!}
          indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!}
          assistantId={process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_AI_ID!}
          placeholder="Search facts..."
          hitsPerPage={20}
          attributes={{
            primaryText: 'title',
            secondaryText: 'blurb',
            tertiaryText: 'fact',
            url: 'url',
          }}
          searchParameters={{
            clickAnalytics: true,
            analytics: true,
            userToken: getSearchSessionId(),
          }}
        />
      </ErrorBoundary>
    </div>
  );
}
