import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ClientShell from './ClientShell';

// Mock components
vi.mock('@/components/GlitterBomb/GlitterBomb', () => ({
  default: () => <div data-testid="glitter-bomb">GlitterBomb</div>,
}));

vi.mock('@/components/BackgroundMusic/BackgroundMusic', () => ({
  default: () => <div data-testid="bg-music">Music</div>,
}));

vi.mock('@/components/AIChat/AIChat', () => ({
  default: () => <div data-testid="ai-chat">AIChat</div>,
}));

vi.mock('@/components/Footer/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

describe('ClientShell Component', () => {
  it('renders children and shell components', async () => {
    render(
      <ClientShell>
        <div data-testid="child-content">Child Content</div>
      </ClientShell>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('glitter-bomb')).toBeInTheDocument();
    });
    expect(screen.getByTestId('bg-music')).toBeInTheDocument();

    // Wait for delayed AIChat
    await waitFor(
      () => {
        expect(screen.getByTestId('ai-chat')).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  }, 10000);
});
