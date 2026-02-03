'use client';

import { useEffect } from 'react';
import { algoliasearch } from 'algoliasearch';
import { InstantSearch, Chat } from 'react-instantsearch';
import MusicPlayer from '../MusicPlayer/MusicPlayer';
import styles from './AIChat.module.css';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ''
);

const AGENT_ID = process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID || 'ruckus_agent';

export default function AIChat() {
  useEffect(() => {
    // Accessibility fix: Inject aria-label into Algolia's Chat toggle button
    // as it is not currently exposed via props/translations
    const observer = new MutationObserver(() => {
      const toggleBtn = document.querySelector('.ais-Chat-toggleButton');
      if (toggleBtn && !toggleBtn.getAttribute('aria-label')) {
        toggleBtn.setAttribute('aria-label', 'Open AI Chat');
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.chatWrapper}>
      <div className={styles.controlsRow}>
        <MusicPlayer />
      </div>

      <InstantSearch searchClient={searchClient} indexName="system-notes">
        <Chat agentId={AGENT_ID} />
      </InstantSearch>
    </div>
  );
}
