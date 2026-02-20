import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import SearchPageWrapper from './SearchPageWrapper';

// Mock dynamic import of SearchPage
vi.mock('next/dynamic', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (_loader: () => Promise<any>, _opts: any) => {
    const Component = () => <div data-testid="search-page-loaded">SearchPage</div>;
    Component.displayName = 'DynamicSearchPage';
    return Component;
  },
}));

let observerCallback: IntersectionObserverCallback;
let observerInstance: {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  observerInstance = {
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  };

  // Use a class-style constructor so `new IntersectionObserver(...)` works
  class MockIntersectionObserver {
    constructor(cb: IntersectionObserverCallback) {
      observerCallback = cb;
      return observerInstance as unknown as IntersectionObserver;
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

describe('SearchPageWrapper', () => {
  it('renders loading placeholder before intersection', () => {
    render(<SearchPageWrapper />);
    expect(screen.getByText('Loading search...')).toBeInTheDocument();
    expect(screen.queryByTestId('search-page-loaded')).not.toBeInTheDocument();
  });

  it('renders SearchPage after intersection', () => {
    render(<SearchPageWrapper />);

    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observerInstance as unknown as IntersectionObserver
      );
    });

    expect(screen.getByTestId('search-page-loaded')).toBeInTheDocument();
  });

  it('disconnects observer after intersection', () => {
    render(<SearchPageWrapper />);

    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observerInstance as unknown as IntersectionObserver
      );
    });

    expect(observerInstance.disconnect).toHaveBeenCalled();
  });

  it('has wrapper element with test id', () => {
    render(<SearchPageWrapper />);
    expect(screen.getByTestId('search-page-wrapper')).toBeInTheDocument();
  });
});
