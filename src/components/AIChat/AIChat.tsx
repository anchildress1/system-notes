'use client';

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
  createContext,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import aa from 'search-insights';
import { Chat, SearchIndexToolType, RecommendToolType, type ChatHandle } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';
import 'instantsearch.css/themes/reset.css';
import 'instantsearch.css/components/chat.css';
import './chat-overrides.css';
import styles from './AIChat.module.css';
import { ALGOLIA_INDEX_NAME } from '@/config';
import { getSearchPageURL } from '@/components/SearchPage/searchRouting';
import { getChatSessionId } from '@/utils/userToken';
import Button, { type ButtonElement } from '@/components/Button/Button';
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
const indexName = ALGOLIA_INDEX_NAME;

const hasValidCredentials = hasValidAlgoliaCredentials();

const searchClient = hasValidCredentials
  ? algoliasearch(appId, apiKey, {
      baseHeaders: {
        'X-Algolia-UserToken': getChatSessionId(),
      },
    })
  : null;

const AGENT_ID = ALGOLIA_AGENT_ID;

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
    ctx?.getItemUrl(item) ??
    `/choices?${new URLSearchParams({ q: item.title ?? item.objectID }).toString()}`;
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

const HeaderIcon = () => <GiBat className={`${styles.headerIcon} ${styles.batGradient}`} />;
const AssistantAvatar = () => (
  <div className={styles.avatar}>
    <GiBat className={styles.batGradient} />
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

// Deliberately makes no claim about how many notes are indexed — the count is
// not available here, and inventing one would break the same rule the index
// itself is built on.
const STARTER_PROMPTS = [
  'What does she actually build?',
  'Show me something that failed.',
  'What is the most opinionated call in here?',
] as const;
// The agent searches these tools, but their raw result layout is intentionally hidden.
const HiddenToolLayout = () => <></>;

const chatClassNames = {
  root: styles.chatRoot,
};

function normalizeToolInput(input: unknown): {
  query?: string;
  tag?: string;
  limit?: number;
} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const record = input as Record<string, unknown>;
  const normalizeString = (value: unknown) =>
    typeof value === 'string' ? value.trim().slice(0, 200) || undefined : undefined;
  const limit = record['limit'];
  return {
    query: normalizeString(record['query']),
    tag: normalizeString(record['tag']),
    limit:
      typeof limit === 'number' && Number.isSafeInteger(limit) && limit > 0
        ? Math.min(limit, 50)
        : undefined,
  };
}

export default function AIChat() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const chatRef = useRef<ChatHandle | null>(null);
  const toggleRef = useRef<ButtonElement | null>(null);
  const lastChatQuery = useRef<string | null>(null);

  const toggleChat = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Syncs the widget's imperative open state after commit, not during AIChat's
  // own render — calling chatRef.current.setOpen() from inside the setOpen
  // updater triggers "Cannot update a component while rendering a different
  // component" because it updates ChatInner mid-render of AIChat.
  useEffect(() => {
    chatRef.current?.setOpen(open);
  }, [open]);

  // Escape closes the panel. The widget covers a column of cards while open, so
  // without this the only way out is finding the toggle again — Escape is the
  // key people already reach for, and it did nothing.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const resolveSearchPageURL = useCallback(
    (nextUiState: Parameters<typeof getSearchPageURL>[0]) =>
      getSearchPageURL(nextUiState, indexName),
    []
  );

  // Shown while the thread is empty. A bare input over a black panel gave a
  // first-time visitor nothing to act on; this says what Ruckus is and hands
  // over three questions that already work.
  const ChatEmptyState = useCallback(
    () => (
      <div className={styles.emptyState}>
        <p className={styles.emptyIntro}>
          Ask about any project, decision, or tradeoff in this portfolio. Answers come from the
          index — if it isn&rsquo;t written down, you get told so.
        </p>
        <ul className={styles.starterList}>
          {STARTER_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <button
                type="button"
                className={styles.starterPrompt}
                onClick={() => chatRef.current?.sendMessage({ text: prompt })}
              >
                {prompt}
              </button>
            </li>
          ))}
        </ul>
      </div>
    ),
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
      [SearchIndexToolType]: { layoutComponent: HiddenToolLayout },
      [RecommendToolType]: { layoutComponent: HiddenToolLayout },
      searchBlogPosts: {
        onToolCall: async (params: {
          input: unknown;
          addToolResult: (result: { output: unknown }) => void;
        }) => {
          const { addToolResult } = params;
          const toolInput = normalizeToolInput(params.input);
          lastChatQuery.current = toolInput.query ?? null;
          try {
            const urlParams = new URLSearchParams();
            if (toolInput.query) urlParams.set('q', toolInput.query);
            if (toolInput.tag) urlParams.set('tag', toolInput.tag);
            if (toolInput.limit) urlParams.set('limit', String(toolInput.limit));

            const response = await fetch(`/api/blog/search?${urlParams.toString()}`, {
              signal: AbortSignal.timeout(10_000),
            });
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
    if (typeof document === 'undefined') return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.ais-ChatHeader-close')) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const getItemUrl = useCallback((item: ChatHitItem): string => {
    const params = new URLSearchParams();
    params.set('q', lastChatQuery.current?.trim() || item.title || item.objectID);
    return `/choices?${params.toString()}`;
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

  const chatAvailable = Boolean(searchClient && AGENT_ID);

  return createPortal(
    <ChatNavContext.Provider value={chatNavContext}>
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
        style={{ position: 'absolute' }}
      >
        <linearGradient id="batGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2fd6d0" />
          <stop offset="38%" stopColor="#7d5cff" />
          <stop offset="62%" stopColor="#b96bff" />
          <stop offset="100%" stopColor="#ff5fa2" />
        </linearGradient>
      </svg>
      <div className={`${styles.chatDock} ${open ? styles.chatOpen : ''}`}>
        {searchClient && AGENT_ID ? (
          <InstantSearchNext
            searchClient={searchClient}
            insights={{ insightsClient: aa }}
            future={{ preserveSharedStateOnUnmount: true }}
          >
            <Chat
              ref={chatRef}
              agentId={AGENT_ID}
              translations={translations}
              tools={tools}
              itemComponent={ChatItemComponent}
              getSearchPageURL={resolveSearchPageURL}
              headerTitleIconComponent={HeaderIcon}
              assistantMessageLeadingComponent={AssistantAvatar}
              userMessageLeadingComponent={UserAvatar}
              promptFooterComponent={PromptFooter}
              emptyComponent={ChatEmptyState}
              classNames={chatClassNames}
            />
          </InstantSearchNext>
        ) : null}
      </div>
      {chatAvailable && (
        <Button
          ref={toggleRef}
          variant="fab"
          className={styles.chatToggle}
          aria-label={open ? 'Close AI chat' : 'Open AI chat'}
          aria-expanded={open}
          onClick={toggleChat}
          data-state={open ? 'open' : 'closed'}
          data-testid="ai-chat-toggle"
        >
          {open ? (
            <IoClose size={24} className={styles.toggleIcon} />
          ) : (
            <FaBrain size={24} className={styles.toggleIcon} />
          )}
        </Button>
      )}
    </ChatNavContext.Provider>,
    document.body
  );
}
