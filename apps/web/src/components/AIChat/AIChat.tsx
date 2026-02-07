'use client';

import { useEffect, useState, useMemo } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Chat } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';
import styles from './AIChat.module.css';
import dynamic from 'next/dynamic';
import { API_URL } from '@/config';
import { useRecommendationTools } from '@/lib/recommendations';

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
  const recommendationTools = useRecommendationTools();

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

  const tools = useMemo(
    () => ({
      searchBlogPosts: {
        onToolCall: async (params: {
          input: unknown;
          addToolResult: (result: { output: unknown }) => void;
        }) => {
          const { input, addToolResult } = params;
          const typedInput = input as { query?: string; tag?: string; limit?: number } | undefined;
          try {
            const urlParams = new URLSearchParams();
            if (typedInput?.query) urlParams.set('q', typedInput.query);
            if (typedInput?.tag) urlParams.set('tag', typedInput.tag);
            if (typedInput?.limit) urlParams.set('limit', String(typedInput.limit));

            const response = await fetch(`${API_URL}/blog/search?${urlParams.toString()}`);
            if (!response.ok) {
              addToolResult({
                output: { error: 'Failed to fetch blog posts', results: [] },
              });
              return;
            }

            const data = await response.json();
            addToolResult({ output: data });
          } catch (error) {
            console.error('AIChat tool error:', error);
            addToolResult({
              output: { error: 'Network error fetching blog posts', results: [] },
            });
          }
        },
      },
      ...recommendationTools,
    }),
    [recommendationTools]
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
          tools={tools}
          model={{ stream: true }}
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
