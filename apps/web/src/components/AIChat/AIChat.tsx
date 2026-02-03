'use client';

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
