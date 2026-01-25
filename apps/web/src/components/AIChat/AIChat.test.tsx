import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AIChat from './AIChat';
import { ChatProvider } from '@/context/ChatContext';

// Mock react-instantsearch
const mockUseChat = vi.fn(() => ({
  messages: [],
  status: 'idle',
  sendMessage: vi.fn(),
}));

vi.mock('react-instantsearch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-instantsearch')>();
  return {
    ...actual,
    InstantSearch: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="instant-search-mock">{children}</div>
    ),
    useChat: () => mockUseChat(),
  };
});

// Mock algoliasearch/lite
vi.mock('algoliasearch/lite', () => ({
  liteClient: vi.fn(() => ({
    search: vi.fn().mockResolvedValue({ results: [] }),
    appId: 'test-app-id',
    apiKey: 'test-api-key',
  })),
}));

// Mock MusicPlayer
vi.mock('../MusicPlayer/MusicPlayer', () => ({
  default: () => <div data-testid="music-player-mock">Music Player</div>,
}));

describe('AIChat Widget Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  const renderComponent = () => {
    return render(
      <ChatProvider>
        <AIChat />
      </ChatProvider>
    );
  };

  it('renders the toggle button initially', () => {
    renderComponent();
    expect(screen.getByLabelText('Open AI Chat')).toBeInTheDocument();
  });

  it('renders InstantSearch when chat is opened', async () => {
    renderComponent();
    const toggleBtn = screen.getByLabelText('Open AI Chat');

    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    // Verify InstantSearch is rendered
    expect(screen.getByTestId('instant-search-mock')).toBeInTheDocument();

    // Verify header text
    expect(screen.getByText('Ruckus 2.0')).toBeInTheDocument();
  });

  it('unmounts InstantSearch when chat is closed', async () => {
    renderComponent();
    const toggleBtn = screen.getByLabelText('Open AI Chat');

    await act(async () => {
      fireEvent.click(toggleBtn); // Open
    });

    expect(screen.getByTestId('instant-search-mock')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Close AI Chat')); // Close
    });

    await waitFor(() => {
      expect(screen.queryByTestId('instant-search-mock')).not.toBeInTheDocument();
    });
  });
});
