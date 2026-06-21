import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

// Must be hoisted so the value is available before the vi.mock factory runs
const mockRouterPush = vi.hoisted(() => vi.fn());

vi.hoisted(() => {
  // Built at runtime (not string literals) so secret scanners don't flag these
  // obviously-fake fixtures. App ID must be 10 alphanumerics; key must be >= 20
  // chars (see lib/algolia.ts validation).
  process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID = ['TESTAPP', 'ID0'].join('');
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = 'test-search-key'.padEnd(20, '0');
  process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID = 'test_agent_id';
});

import AIChat from './AIChat';

// ---------------------------------------------------------------------------
// Types (mirror the private interfaces in AIChat.tsx)
// ---------------------------------------------------------------------------
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
}

// ---------------------------------------------------------------------------
// Mutable test controls — reset in beforeEach
// ---------------------------------------------------------------------------
const chatCapture: CapturedChatProps = {};
// Controls which hit the Chat mock renders. null = default BASE_HIT.
let mockChatItemOverride: ChatHitItem | null = null;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const BASE_HIT: ChatHitItem = {
  objectID: 'fact-abc-123',
  title: 'Test Fact Title',
  blurb: 'A short blurb',
  category: 'System',
  url: 'https://example.com/post',
  __position: 0,
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Chat mock captures all props AND renders ItemComponent so it lives
// inside the ChatNavContext.Provider that AIChat creates.
vi.mock('react-instantsearch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-instantsearch')>();
  return {
    ...actual,
    Chat: (props: CapturedChatProps & { itemComponent?: ItemComponentType }) => {
      chatCapture.itemComponent = props.itemComponent;
      chatCapture.tools = props.tools as Record<string, ToolCall>;
      chatCapture.agentId = props.agentId;
      chatCapture.getSearchPageURL = props.getSearchPageURL as (uiState: unknown) => string;

      const ItemComponent = props.itemComponent;
      // Use the test override if set, otherwise fall back to BASE_HIT.
      // Read at render time so tests can set it before calling render().
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
          {ItemComponent && <ItemComponent item={item} sendEvent={vi.fn()} />}
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
  liteClient: vi.fn(() => ({
    search: vi.fn().mockResolvedValue({ results: [] }),
    appId: 'test-app-id',
    apiKey: 'test-api-key',
  })),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AIChat Widget Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChatItemOverride = null;
    chatCapture.itemComponent = undefined;
    chatCapture.tools = undefined;
    chatCapture.agentId = undefined;
    chatCapture.getSearchPageURL = undefined;
  });

  // -------------------------------------------------------------------------
  // Widget-level rendering
  // -------------------------------------------------------------------------
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
  });

  // -------------------------------------------------------------------------
  // ChatItemComponent — rendering
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // ChatItemComponent — href construction
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // ChatItemComponent — click / navigation
  // -------------------------------------------------------------------------
  describe('ChatItemComponent click navigation', () => {
    it('calls router.push with /search?q on click', () => {
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

    it('does not call router.push when ChatNavContext provider is absent', () => {
      // Render ItemComponent in isolation — no provider → ctx is null → no-op
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

  // -------------------------------------------------------------------------
  // searchBlogPosts tool — onToolCall
  // -------------------------------------------------------------------------
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

      it('always includes indexName param', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
        await getToolCall()({ input: {}, addToolResult: vi.fn() });
        expect(mockFetch.mock.calls[0][0]).toContain('indexName=');
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

      it('resolves cleanly on network error — does not re-throw', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockRejectedValue(new Error('Timeout'));
        await expect(
          getToolCall()({ input: { query: 'fail' }, addToolResult: vi.fn() })
        ).resolves.toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith('AIChat tool error:', expect.any(Error));
        consoleSpy.mockRestore();
      });
    });
  });

  // -------------------------------------------------------------------------
  // query persistence: tool call → navigation URL
  // -------------------------------------------------------------------------
  describe('query persistence in navigation URL', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetch);
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    });

    it('uses the captured query after searchBlogPosts captures a query', async () => {
      render(<AIChat />);

      await chatCapture.tools!.searchBlogPosts.onToolCall({
        input: { query: 'hexagonal architecture' },
        addToolResult: vi.fn(),
      });

      fireEvent.click(screen.getByRole('link'));

      expect(mockRouterPush).toHaveBeenCalledOnce();
      const params = new URLSearchParams((mockRouterPush.mock.calls[0][0] as string).split('?')[1]);
      expect(params.get('q')).toBe('hexagonal architecture');
    });

    it('uses the item title when tool was called without a query', async () => {
      render(<AIChat />);

      await chatCapture.tools!.searchBlogPosts.onToolCall({
        input: { tag: 'Performance', limit: 3 },
        addToolResult: vi.fn(),
      });

      fireEvent.click(screen.getByRole('link'));

      expect(mockRouterPush).toHaveBeenCalledOnce();
      const params = new URLSearchParams((mockRouterPush.mock.calls[0][0] as string).split('?')[1]);
      expect(params.get('q')).toBe(BASE_HIT.title);
    });

    it('correctly round-trips a query with special characters', async () => {
      render(<AIChat />);

      await chatCapture.tools!.searchBlogPosts.onToolCall({
        input: { query: 'C++ & memory management' },
        addToolResult: vi.fn(),
      });

      fireEvent.click(screen.getByRole('link'));

      const params = new URLSearchParams((mockRouterPush.mock.calls[0][0] as string).split('?')[1]);
      expect(params.get('q')).toBe('C++ & memory management');
    });

    it('last tool call wins — overrides the prior query', async () => {
      render(<AIChat />);

      await chatCapture.tools!.searchBlogPosts.onToolCall({
        input: { query: 'first query' },
        addToolResult: vi.fn(),
      });
      await chatCapture.tools!.searchBlogPosts.onToolCall({
        input: { query: 'second query' },
        addToolResult: vi.fn(),
      });

      fireEvent.click(screen.getByRole('link'));

      const params = new URLSearchParams((mockRouterPush.mock.calls[0][0] as string).split('?')[1]);
      expect(params.get('q')).toBe('second query');
    });
  });
});
