'use client';

import { useEffect, useState, useMemo } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Chat } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';
import styles from './AIChat.module.css';
import dynamic from 'next/dynamic';

import { IoClose } from 'react-icons/io5';
import { GiBat } from 'react-icons/gi';
import { FaBrain, FaUser } from 'react-icons/fa';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';

// Create searchClient at module level for stable reference (prevents unnecessary re-renders)
const searchClient =
  appId && apiKey
    ? algoliasearch(appId, apiKey)
    : {
        search: () => Promise.resolve({ results: [] }),
      };

const AGENT_ID = process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID || '';

const MusicPlayer = dynamic(() => import('../MusicPlayer/MusicPlayer'), {
  ssr: false,
});

// Custom components to enrich the chat experience
const HeaderIcon = () => <GiBat className={styles.headerIcon} />;
const AssistantAvatar = () => (
  <div className={styles.avatar}>
    <GiBat />
  </div>
);
const UserAvatar = () => (
  <div className={styles.userAvatar}>
    <FaUser />
  </div>
);
const PromptFooter = () => (
  <div className={styles.disclaimer}>Powered by Algolia—fast, relevant, still imperfect.</div>
);
const ToggleIcon = ({ isOpen }: { isOpen: boolean }) =>
  isOpen ? (
    <IoClose size={24} className={styles.toggleIcon} />
  ) : (
    <FaBrain size={24} className={styles.toggleIcon} />
  );

export default function AIChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!AGENT_ID && process.env.NODE_ENV !== 'production') {
      console.warn(
        'AIChat: NEXT_PUBLIC_ALGOLIA_AGENT_ID is missing. Chat widget will be disabled.'
      );
    }
  }, []);

  // Memoize translations to prevent unnecessary re-renders of the Chat widget
  const translations = useMemo(
    () => ({
      header: {
        title: 'Ruckus 2.0',
      },
      toggleButtonTitle: 'Open AI Chat',
    }),
    []
  );

  useEffect(() => {
    // Accessibility fix: Inject aria-label into Algolia's Chat toggle button
    const observer = new MutationObserver(() => {
      if (typeof document === 'undefined') return;

      const chatWindow = document.querySelector('.ais-Chat-window');
      const isWindowOpen = !!chatWindow;
      setIsChatOpen((prev) => (prev === isWindowOpen ? prev : isWindowOpen));

      const toggleBtn = document.querySelector(
        '.ais-ChatToggleButton, .ais-Chat-toggleButton, [class*="ChatToggleButton"]'
      );
      if (toggleBtn) {
        if (!toggleBtn.hasAttribute('aria-label')) {
          toggleBtn.setAttribute('aria-label', 'Open AI Chat');
        }
        if (!toggleBtn.hasAttribute('data-testid')) {
          toggleBtn.setAttribute('data-testid', 'ai-chat-toggle');
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  if (!AGENT_ID) {
    return (
      <div className={styles.musicWrapper}>
        <MusicPlayer />
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.musicWrapper} ${isChatOpen ? styles.musicPushed : ''}`}>
        <MusicPlayer />
      </div>
      <InstantSearchNext
        searchClient={searchClient}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Chat
          agentId={AGENT_ID}
          translations={translations}
          headerTitleIconComponent={HeaderIcon}
          assistantMessageLeadingComponent={AssistantAvatar}
          userMessageLeadingComponent={UserAvatar}
          promptFooterComponent={PromptFooter}
          toggleButtonIconComponent={ToggleIcon}
        />
      </InstantSearchNext>
    </>
  );
}
