'use client';

import { useEffect, useMemo, useCallback, useContext, createContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Chat } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';
import 'instantsearch.css/themes/reset.css';
import styles from './AIChat.module.css';
import dynamic from 'next/dynamic';
import { API_URL, ALGOLIA_INDEX } from '@/config';
import { getSearchPageURL } from '@/components/SearchPage/searchRouting';
import { getChatSessionId } from '@/utils/userToken';
import {
  ALGOLIA_APP_ID,
  ALGOLIA_SEARCH_KEY,
  ALGOLIA_AGENT_ID,
  hasValidAlgoliaCredentials,
} from '@/lib/algolia';

import { IoClose } from 'react-icons/io5';
import { GiBat } from 'react-icons/gi';
import { FaBrain, FaUser } from 'react-icons/fa';

interface ChatNavContextType {
  navigate: (item: ChatHitItem) => void;
  getItemUrl: (item: ChatHitItem) => string;
}
const ChatNavContext = createContext<ChatNavContextType | null>(null);

const appId = ALGOLIA_APP_ID;
const apiKey = ALGOLIA_SEARCH_KEY;
const indexName = ALGOLIA_INDEX.SEARCH_RESULTS;

const hasValidCredentials = hasValidAlgoliaCredentials();

// Create searchClient at module level for stable reference (prevents unnecessary re-renders).
// null when credentials are absent — InstantSearchNext is only rendered when this is non-null.
const searchClient = hasValidCredentials
  ? algoliasearch(appId, apiKey, {
      headers: {
        'X-Algolia-UserToken': getChatSessionId(),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  : null;

const AGENT_ID = ALGOLIA_AGENT_ID;

const MusicPlayer = dynamic(() => import('../MusicPlayer/MusicPlayer'), {
  ssr: false,
});

// Item component for rendering search results in the chat carousel
interface ChatHitItem {
  objectID: string;
  title?: string;
  blurb?: string;
  category?: string;
  url?: string;
  __position: number;
  __queryID?: string;
}

const ChatItemComponent = ({
  item,
  onAuxClick,
  sendEvent,
  onClick,
}: {
  item: ChatHitItem;
  sendEvent: (eventType: string, item: ChatHitItem, eventName: string) => void;
  onClick?: () => void;
  onAuxClick?: () => void;
}) => {
  const ctx = useContext(ChatNavContext);
  const href =
    ctx?.getItemUrl(item) ?? `/search?${new URLSearchParams({ factId: item.objectID }).toString()}`;
  return (
    <a
      href={href}
      className={styles.chatResultCard}
      onClick={(e) => {
        sendEvent('click', item, 'Item Clicked');
        onClick?.();
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          ctx?.navigate(item);
        }
      }}
      onAuxClick={onAuxClick}
    >
      {item.category && <span className={styles.chatResultCategory}>{item.category}</span>}
      <span className={styles.chatResultTitle}>{item.title || item.objectID}</span>
      {item.blurb && <span className={styles.chatResultBlurb}>{item.blurb}</span>}
    </a>
  );
};

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
  const router = useRouter();
  const lastChatQuery = useRef<string | null>(null);
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
          lastChatQuery.current = typedInput?.query ?? null;
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
            console.error('AIChat tool error:', error);
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
        if (!(toggleBtn as HTMLElement).ariaLabel) {
          (toggleBtn as HTMLElement).ariaLabel = 'Open AI Chat';
        }
        if (!(toggleBtn as HTMLElement).dataset.testid) {
          (toggleBtn as HTMLElement).dataset.testid = 'ai-chat-toggle';
        }
      }
    };

    fixAccessibility();

    const observer = new MutationObserver(fixAccessibility);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const getItemUrl = useCallback((item: ChatHitItem): string => {
    const params = new URLSearchParams();
    params.set('factId', item.objectID);
    if (lastChatQuery.current) params.set('query', lastChatQuery.current);
    return `/search?${params.toString()}`;
  }, []);

  const handleChatItemNavigate = useCallback(
    (item: ChatHitItem) => {
      router.push(getItemUrl(item));
    },
    [router, getItemUrl]
  );

  const chatNavContext = useMemo(
    () => ({ navigate: handleChatItemNavigate, getItemUrl }),
    [handleChatItemNavigate, getItemUrl]
  );

  const chatContent = (
    <div className={styles.chatDock}>
      <div className={styles.musicWrapper}>
        <MusicPlayer />
      </div>
      {searchClient && AGENT_ID ? (
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
            itemComponent={ChatItemComponent}
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

  return createPortal(
    <ChatNavContext.Provider value={chatNavContext}>{chatContent}</ChatNavContext.Provider>,
    document.body
  );
}
