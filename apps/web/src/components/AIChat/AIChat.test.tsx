import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AIChat from './AIChat';

// Mock react-instantsearch
vi.mock('react-instantsearch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-instantsearch')>();
  return {
    ...actual,
    InstantSearch: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="instant-search-mock">{children}</div>
    ),
    Chat: () => <div data-testid="algolia-chat-mock">Algolia Chat</div>,
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
vi.mock('@/components/MusicPlayer/MusicPlayer', () => ({
  default: () => <div data-testid="music-player-mock">Music Player</div>,
}));

describe('AIChat Widget Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Algolia Chat component', async () => {
    render(<AIChat />);
    expect(screen.getByTestId('instant-search-mock')).toBeInTheDocument();
    expect(screen.getByTestId('algolia-chat-mock')).toBeInTheDocument();

    // MusicPlayer is dynamically imported, so we wait for it
    await waitFor(() => {
      expect(screen.getByTestId('music-player-mock')).toBeInTheDocument();
    });
  });
});
