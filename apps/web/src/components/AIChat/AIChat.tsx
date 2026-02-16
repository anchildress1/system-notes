'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Chat } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';
import 'instantsearch.css/themes/satellite.css';
import styles from './AIChat.module.css';
import dynamic from 'next/dynamic';
import { API_URL, ALGOLIA_INDEX } from '@/config';
// import { useRecommendationTools } from '@/lib/recommendations';
import { getSearchPageURL } from '@/components/SearchPage/searchRouting';
import { getChatSessionId } from '@/utils/userToken';

import { IoClose } from 'react-icons/io5';
import { GiBat } from 'react-icons/gi';
import { FaBrain, FaUser } from 'react-icons/fa';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '';
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';
const indexName = ALGOLIA_INDEX.SEARCH_RESULTS;

// Algolia app IDs are always 10 alphanumeric chars, API keys are 32+ hex chars.
// Skip real SDK init when credentials are obviously fake (e.g. test_app_id)
// to prevent failed network requests that Chrome logs as console errors.
const hasValidCredentials = /^[A-Z0-9]{10}$/i.test(appId) && apiKey.length >= 20;

// Create searchClient at module level for stable reference (prevents unnecessary re-renders)
const searchClient = hasValidCredentials
  ? algoliasearch(appId, apiKey, {
      headers: {
        'X-Algolia-UserToken': getChatSessionId(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
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
  <div className={styles.disclaimer}>Powered by Algolia | Indexed. Not Imagined.</div>
);
const ToggleIcon = ({ isOpen }: { isOpen: boolean }) =>
  isOpen ? (
    <IoClose size={24} className={styles.toggleIcon} />
  ) : (
    <FaBrain size={24} className={styles.toggleIcon} />
  );

export default function AIChat() {
  const resolveSearchPageURL = useCallback(
    (nextUiState: Parameters<typeof getSearchPageURL>[0]) =>
      getSearchPageURL(nextUiState, indexName),
    []
  );

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
            urlParams.set('indexName', ALGOLIA_INDEX.CHAT_SOURCE);

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
            console.warn('AIChat tool error:', error);
            addToolResult({
              output: { error: 'Network error fetching blog posts', results: [] },
            });
          }
        },
      },
    }),
    []
  );

  useEffect(() => {
    const fixAccessibility = () => {
      if (typeof document === 'undefined') return;

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
    };

    fixAccessibility();

    const observer = new MutationObserver(fixAccessibility);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const chatContent = (
    <div className={styles.chatDock}>
      <div className={styles.musicWrapper}>
        <MusicPlayer />
      </div>
      {hasValidCredentials && AGENT_ID ? (
        <InstantSearchNext
          searchClient={searchClient}
          insights
          future={{ preserveSharedStateOnUnmount: true }}
        >
          <Chat
            agentId={AGENT_ID}
            classNames={{
              root: styles.chatRoot,
              container: styles.chatWindow,
              toggleButton: { root: styles.chatToggle },
            }}
            translations={translations}
            tools={tools}
            getSearchPageURL={resolveSearchPageURL}
            headerTitleIconComponent={HeaderIcon}
            assistantMessageLeadingComponent={AssistantAvatar}
            userMessageLeadingComponent={UserAvatar}
            promptFooterComponent={PromptFooter}
            toggleButtonIconComponent={ToggleIcon}
          />
        </InstantSearchNext>
      ) : null}
    </div>
  );

  return createPortal(chatContent, document.body);
}
