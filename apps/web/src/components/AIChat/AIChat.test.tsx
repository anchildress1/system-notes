import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('AIChat Widget Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Algolia Chat component', () => {
    render(<AIChat />);
    expect(screen.getByTestId('instant-search-mock')).toBeInTheDocument();
    expect(screen.getByTestId('algolia-chat-mock')).toBeInTheDocument();
  });
});
