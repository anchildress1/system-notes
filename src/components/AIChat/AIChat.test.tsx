import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

const { mockChatSetOpen, mockChatSendMessage, mockLiteClient, mockRouterPush } = vi.hoisted(() => ({
  mockChatSetOpen: vi.fn(),
  mockChatSendMessage: vi.fn(),
  mockLiteClient: vi.fn(() => ({
    search: vi.fn().mockResolvedValue({ results: [] }),
    appId: 'test-app-id',
    apiKey: 'test-api-key',
  })),
  mockRouterPush: vi.fn(),
}));

vi.hoisted(() => {
  // Runtime construction keeps deliberately fake credentials out of secret-scanner matches.
  process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = ['TESTAPP', 'ID0'].join('');
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key'.padEnd(20, '0');
  process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID = 'test_agent_id';
});

import AIChat from './AIChat';

interface ChatHitItem {
  objectID: string;
  title?: string;
  blurb?: string;
  category?: string;
  url?: string;
  __position: number;
  __queryID?: string;
}

type ItemComponentType = React.ComponentType<{
  item: ChatHitItem;
  sendEvent: (eventType: string, item: ChatHitItem, eventName: string) => void;
  onClick?: () => void;
  onAuxClick?: () => void;
}>;

type ToolCall = {
  onToolCall: (params: {
    input: unknown;
    addToolResult: (result: { output: unknown }) => void;
  }) => Promise<void>;
};

interface CapturedChatProps {
  itemComponent?: ItemComponentType;
  tools?: Record<string, ToolCall>;
  agentId?: string;
  getSearchPageURL?: (uiState: unknown) => string;
  emptyComponent?: React.ComponentType;
  ref?: React.Ref<{
    setOpen: (open: boolean) => void;
    sendMessage: (params: { text: string }) => void;
  }>;
}

const chatCapture: CapturedChatProps = {};
let mockChatItemOverride: ChatHitItem | null = null;
const mockSendEvent = vi.fn();
const mockAuxClick = vi.fn();
const chatSetOpenCommitStates: Array<{ open: boolean; state: string | null }> = [];

const BASE_HIT: ChatHitItem = {
  objectID: 'fact-abc-123',
  title: 'Test Fact Title',
  blurb: 'A short blurb',
  category: 'System',
  url: 'https://example.com/post',
  __position: 0,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('react-instantsearch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-instantsearch')>();
  return {
    ...actual,
    Chat: (props: CapturedChatProps & { itemComponent?: ItemComponentType }) => {
      chatCapture.itemComponent = props.itemComponent;
      chatCapture.tools = props.tools as Record<string, ToolCall>;
      chatCapture.agentId = props.agentId;
      chatCapture.getSearchPageURL = props.getSearchPageURL as (uiState: unknown) => string;
      chatCapture.emptyComponent = props.emptyComponent;
      if (props.ref && typeof props.ref === 'object') {
        props.ref.current = { setOpen: mockChatSetOpen, sendMessage: mockChatSendMessage };
      }

      const EmptyComponent = props.emptyComponent;
      const ItemComponent = props.itemComponent;
      const item: ChatHitItem = mockChatItemOverride ?? {
        objectID: 'fact-abc-123',
        title: 'Test Fact Title',
        blurb: 'A short blurb',
        category: 'System',
        url: 'https://example.com/post',
        __position: 0,
      };
      return (
        <div data-testid="algolia-chat-mock">
          <button type="button" className="ais-ChatHeader-close">
            Close widget
          </button>
          {EmptyComponent && <EmptyComponent />}
          {ItemComponent && (
            <ItemComponent item={item} sendEvent={mockSendEvent} onAuxClick={mockAuxClick} />
          )}
        </div>
      );
    },
  };
});

vi.mock('react-instantsearch-nextjs', () => ({
  InstantSearchNext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="instant-search-next-mock">{children}</div>
  ),
}));

vi.mock('algoliasearch/lite', () => ({
  liteClient: mockLiteClient,
}));

describe('AIChat Widget Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatSetOpenCommitStates.length = 0;
    mockChatSetOpen.mockImplementation((open: boolean) => {
      chatSetOpenCommitStates.push({
        open,
        state:
          document.querySelector('[data-testid="ai-chat-toggle"]')?.getAttribute('data-state') ??
          null,
      });
    });
    mockChatItemOverride = null;
    chatCapture.itemComponent = undefined;
    chatCapture.tools = undefined;
    chatCapture.agentId = undefined;
    chatCapture.getSearchPageURL = undefined;
    chatCapture.emptyComponent = undefined;
  });

  describe('dismissal', () => {
    const openChat = () => {
      const toggle = screen.getByTestId('ai-chat-toggle');
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('data-state', 'open');
      return toggle;
    };

    it('closes on Escape and returns focus to the toggle', () => {
      render(<AIChat />);
      const toggle = openChat();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(toggle).toHaveAttribute('data-state', 'closed');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(toggle).toHaveFocus();
    });

    it('ignores keys other than Escape while open', () => {
      render(<AIChat />);
      const toggle = openChat();

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'a' });

      expect(toggle).toHaveAttribute('data-state', 'open');
    });

    it('does not listen for Escape while closed', () => {
      render(<AIChat />);
      const toggle = screen.getByTestId('ai-chat-toggle');
      expect(toggle).toHaveAttribute('data-state', 'closed');

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(toggle).toHaveAttribute('data-state', 'closed');
      expect(toggle).not.toHaveFocus();
    });
  });

  describe('empty-thread greeting', () => {
    it('explains what the assistant is before the input', () => {
      render(<AIChat />);
      expect(chatCapture.emptyComponent).toBeDefined();
      expect(
        screen.getByText(/Ask about any project, decision, or tradeoff in this portfolio/)
      ).toBeInTheDocument();
    });

    it('offers starter prompts as buttons', () => {
      render(<AIChat />);
      const starters = [
        'What does she actually build?',
        'Show me something that failed.',
        'What is the most opinionated call in here?',
      ];
      for (const label of starters) {
        expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
      }
    });

    it('sends the prompt text when a starter is clicked', () => {
      render(<AIChat />);
      fireEvent.click(screen.getByRole('button', { name: 'Show me something that failed.' }));

      expect(mockChatSendMessage).toHaveBeenCalledWith({ text: 'Show me something that failed.' });
    });
  });

  describe('widget rendering', () => {
    it('renders Chat inside InstantSearchNext when credentials are valid', () => {
      render(<AIChat />);
      expect(screen.getByTestId('instant-search-next-mock')).toBeInTheDocument();
      expect(screen.getByTestId('algolia-chat-mock')).toBeInTheDocument();
    });

    it('passes the correct agentId to Chat', () => {
      render(<AIChat />);
      expect(chatCapture.agentId).toBe('test_agent_id');
    });

    it('provides a getSearchPageURL callback to Chat', () => {
      render(<AIChat />);
      expect(typeof chatCapture.getSearchPageURL).toBe('function');
    });

    it('marks the dock toggle state when the chat opens and closes', () => {
      render(<AIChat />);
      const toggle = screen.getByTestId('ai-chat-toggle');

      expect(toggle).toHaveAttribute('data-state', 'closed');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(mockChatSetOpen.mock.calls).toEqual([[false]]);

      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute('data-state', 'open');
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(mockChatSetOpen).toHaveBeenLastCalledWith(true);

      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute('data-state', 'closed');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(mockChatSetOpen.mock.calls).toEqual([[false], [true], [false]]);
      expect(chatSetOpenCommitStates).toEqual([
        { open: false, state: 'closed' },
        { open: true, state: 'open' },
        { open: false, state: 'closed' },
      ]);
    });

    it('synchronizes a widget close back to the dock state', () => {
      render(<AIChat />);
      const toggle = screen.getByTestId('ai-chat-toggle');
      fireEvent.click(toggle);

      fireEvent.click(screen.getByRole('button', { name: 'Close widget' }));

      expect(toggle).toHaveAttribute('data-state', 'closed');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(mockChatSetOpen).toHaveBeenLastCalledWith(false);
    });

    it('renders no widget or toggle when credentials are invalid', async () => {
      vi.stubEnv('NEXT_PUBLIC_ALGOLIA_APPLICATION_ID', 'invalid');
      vi.stubEnv('NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY', 'short');
      vi.stubEnv('NEXT_PUBLIC_ALGOLIA_AGENT_ID', '');
      vi.resetModules();

      try {
        const { default: AIChatWithoutCredentials } = await import('./AIChat');
        render(<AIChatWithoutCredentials />);

        expect(mockLiteClient).not.toHaveBeenCalled();
        expect(screen.queryByTestId('algolia-chat-mock')).not.toBeInTheDocument();
        expect(screen.queryByTestId('ai-chat-toggle')).not.toBeInTheDocument();
      } finally {
        vi.unstubAllEnvs();
        vi.resetModules();
      }
    });
  });

  describe('ChatItemComponent rendering', () => {
    it('renders the item title', () => {
      render(<AIChat />);
      expect(screen.getByText(BASE_HIT.title!)).toBeInTheDocument();
    });

    it('falls back to objectID when title is absent', () => {
      mockChatItemOverride = { ...BASE_HIT, title: undefined };
      render(<AIChat />);
      expect(screen.getByText(BASE_HIT.objectID)).toBeInTheDocument();
    });

    it('renders the category badge when category is present', () => {
      render(<AIChat />);
      expect(screen.getByText(BASE_HIT.category!)).toBeInTheDocument();
    });

    it('omits the category badge when category is absent', () => {
      mockChatItemOverride = { ...BASE_HIT, category: undefined };
      render(<AIChat />);
      expect(screen.queryByText('System')).not.toBeInTheDocument();
    });

    it('renders the blurb when present', () => {
      render(<AIChat />);
      expect(screen.getByText(BASE_HIT.blurb!)).toBeInTheDocument();
    });

    it('omits the blurb element when blurb is absent', () => {
      mockChatItemOverride = { ...BASE_HIT, blurb: undefined };
      render(<AIChat />);
      expect(screen.queryByText(BASE_HIT.blurb!)).not.toBeInTheDocument();
    });
  });

  describe('ChatItemComponent href construction', () => {
    it('sets href to /search?q=<title>', () => {
      render(<AIChat />);
      const expected = `/search?${new URLSearchParams({ q: BASE_HIT.title! }).toString()}`;
      expect(screen.getByRole('link')).toHaveAttribute('href', expected);
    });

    it('does not open a new tab (no target=_blank)', () => {
      render(<AIChat />);
      expect(screen.getByRole('link')).not.toHaveAttribute('target', '_blank');
    });

    it.each([
      { objectID: 'simple-id', desc: 'plain alphanumeric id' },
      { objectID: 'id with spaces', desc: 'objectID with spaces' },
      { objectID: 'id/with/slashes', desc: 'objectID with slashes' },
    ])('href correctly encodes $desc when title is absent', ({ objectID }) => {
      mockChatItemOverride = { ...BASE_HIT, objectID, title: undefined };
      render(<AIChat />);
      const expected = `/search?${new URLSearchParams({ q: objectID }).toString()}`;
      expect(screen.getByRole('link')).toHaveAttribute('href', expected);
    });
  });

  describe('ChatItemComponent click navigation', () => {
    it('calls router.push with /choices?q on click', () => {
      render(<AIChat />);
      fireEvent.click(screen.getByRole('link'));
      expect(mockRouterPush).toHaveBeenCalledOnce();
      expect(mockRouterPush).toHaveBeenCalledWith(
        `/search?${new URLSearchParams({ q: BASE_HIT.title! }).toString()}`
      );
    });

    it('prevents default browser navigation on click', () => {
      render(<AIChat />);
      const link = screen.getByRole('link');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it.each([
      { name: 'Meta', init: { metaKey: true } },
      { name: 'Control', init: { ctrlKey: true } },
      { name: 'Shift', init: { shiftKey: true } },
      { name: 'Alt', init: { altKey: true } },
      { name: 'middle-button', init: { button: 1 } },
    ])('preserves $name-click browser navigation and analytics', ({ init }) => {
      render(<AIChat />);
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
      let componentPreventedDefault: boolean | undefined;
      document.addEventListener(
        'click',
        (clickEvent) => {
          componentPreventedDefault = clickEvent.defaultPrevented;
          clickEvent.preventDefault();
        },
        { once: true }
      );

      screen.getByRole('link').dispatchEvent(event);

      expect(componentPreventedDefault).toBe(false);
      expect(mockRouterPush).not.toHaveBeenCalled();
      expect(mockSendEvent).toHaveBeenCalledWith('click', expect.any(Object), 'Item Clicked');
    });

    it('delegates auxiliary clicks to the widget', () => {
      render(<AIChat />);

      fireEvent(
        screen.getByRole('link'),
        new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 })
      );

      expect(mockAuxClick).toHaveBeenCalledOnce();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('does not call router.push when ChatNavContext provider is absent', () => {
      render(<AIChat />);
      const ItemComponent = chatCapture.itemComponent!;
      const { container } = render(<ItemComponent item={BASE_HIT} sendEvent={vi.fn()} />);
      expect(() => fireEvent.click(within(container).getByRole('link'))).not.toThrow();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('uses the item title when no prior tool call was made', () => {
      render(<AIChat />);
      fireEvent.click(screen.getByRole('link'));
      const pushedUrl = mockRouterPush.mock.calls[0][0] as string;
      const params = new URLSearchParams(pushedUrl.split('?')[1]);
      expect(params.get('q')).toBe(BASE_HIT.title);
    });
  });

  describe('searchBlogPosts tool', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function getToolCall() {
      render(<AIChat />);
      return chatCapture.tools!.searchBlogPosts.onToolCall;
    }

    describe('API request params', () => {
      it('sends q param when query is provided', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        await getToolCall()({ input: { query: 'async patterns' }, addToolResult: vi.fn() });
        expect(mockFetch.mock.calls[0][0]).toContain('q=async+patterns');
      });

      it('sends tag param when tag is provided', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        await getToolCall()({ input: { tag: 'Architecture' }, addToolResult: vi.fn() });
        expect(mockFetch.mock.calls[0][0]).toContain('tag=Architecture');
      });

      it('sends limit param when limit is provided', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        await getToolCall()({ input: { limit: 5 }, addToolResult: vi.fn() });
        expect(mockFetch.mock.calls[0][0]).toContain('limit=5');
      });

      it('does not send the unused indexName param', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        await getToolCall()({ input: {}, addToolResult: vi.fn() });
        expect(mockFetch.mock.calls[0][0]).not.toContain('indexName=');
      });

      it('omits q when no query is provided', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        await getToolCall()({ input: { tag: 'DevOps' }, addToolResult: vi.fn() });
        expect(mockFetch.mock.calls[0][0]).not.toContain('q=');
      });

      it('handles undefined input without crashing', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        const addToolResult = vi.fn();
        await expect(getToolCall()({ input: undefined, addToolResult })).resolves.not.toThrow();
        expect(addToolResult).toHaveBeenCalledOnce();
      });

      it('rejects invalid tool argument types', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        await getToolCall()({
          input: { query: 42, tag: ['Architecture'], limit: 2.5 },
          addToolResult: vi.fn(),
        });
        expect(mockFetch.mock.calls[0][0]).toBe('/api/blog/search?');
      });

      it('trims strings and caps the requested result limit', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        await getToolCall()({
          input: { query: '  bounded query  ', limit: 500 },
          addToolResult: vi.fn(),
        });
        expect(mockFetch.mock.calls[0][0]).toContain('q=bounded+query');
        expect(mockFetch.mock.calls[0][0]).toContain('limit=50');
      });
    });

    describe('on successful response', () => {
      it('passes response data to addToolResult', async () => {
        const responseData = { results: [{ objectID: 'abc', title: 'Post 1' }], nbHits: 1 };
        mockFetch.mockResolvedValue({ ok: true, json: async () => responseData });
        const addToolResult = vi.fn();

        await getToolCall()({ input: { query: 'test' }, addToolResult });

        expect(addToolResult).toHaveBeenCalledOnce();
        expect(addToolResult).toHaveBeenCalledWith({ output: responseData });
      });

      it('calls addToolResult exactly once per invocation', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        const addToolResult = vi.fn();
        await getToolCall()({ input: {}, addToolResult });
        expect(addToolResult).toHaveBeenCalledOnce();
      });
    });

    describe('on error response', () => {
      it('returns error output when response is not ok', async () => {
        mockFetch.mockResolvedValue({ ok: false });
        const addToolResult = vi.fn();

        await getToolCall()({ input: { query: 'bad' }, addToolResult });

        expect(addToolResult).toHaveBeenCalledWith({
          output: expect.objectContaining({ error: expect.any(String), results: [] }),
        });
      });

      it('returns error output when fetch throws a network error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockRejectedValue(new Error('Network failure'));
        const addToolResult = vi.fn();

        await getToolCall()({ input: { query: 'fail' }, addToolResult });

        expect(addToolResult).toHaveBeenCalledWith({
          output: expect.objectContaining({ error: expect.any(String), results: [] }),
        });
        expect(consoleSpy).toHaveBeenCalledWith('AIChat tool error:', expect.any(Error));
        consoleSpy.mockRestore();
      });

      it('passes a ten-second timeout signal to fetch', async () => {
        const signal = new AbortController().signal;
        const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal);
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });

        await getToolCall()({ input: { query: 'bounded' }, addToolResult: vi.fn() });

        expect(timeoutSpy).toHaveBeenCalledOnce();
        expect(timeoutSpy).toHaveBeenCalledWith(10_000);
        expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { signal });
      });
    });
  });

  describe('query persistence in navigation URL', () => {
    const mockFetch = vi.fn();

    const navigateAfterSearches = async (...inputs: unknown[]) => {
      render(<AIChat />);
      for (const input of inputs) {
        await chatCapture.tools!.searchBlogPosts.onToolCall({ input, addToolResult: vi.fn() });
      }

      fireEvent.click(screen.getByRole('link'));
      expect(mockRouterPush).toHaveBeenCalledOnce();
      return new URL(
        mockRouterPush.mock.calls[0][0] as string,
        'https://localhost'
      ).searchParams.get('q');
    };

    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetch);
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    });

    it('uses the captured query after searchBlogPosts captures a query', async () => {
      expect(await navigateAfterSearches({ query: 'hexagonal architecture' })).toBe(
        'hexagonal architecture'
      );
    });

    it('uses the item title when tool was called without a query', async () => {
      expect(await navigateAfterSearches({ tag: 'Performance', limit: 3 })).toBe(BASE_HIT.title);
    });

    it('correctly round-trips a query with special characters', async () => {
      expect(await navigateAfterSearches({ query: 'C++ & memory management' })).toBe(
        'C++ & memory management'
      );
    });

    it('last tool call wins — overrides the prior query', async () => {
      expect(await navigateAfterSearches({ query: 'first query' }, { query: 'second query' })).toBe(
        'second query'
      );
    });
  });
});
