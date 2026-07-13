import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ClientShell from './ClientShell';

vi.mock('@/components/Header/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/Masthead/Masthead', () => ({
  default: () => <div data-testid="masthead">Masthead</div>,
}));

vi.mock('@/components/GlitterBomb/GlitterBomb', () => ({
  default: () => <div data-testid="glitter-bomb">GlitterBomb</div>,
}));

vi.mock('@/components/AIChat/AIChat', () => ({
  default: () => <div data-testid="ai-chat">AIChat</div>,
}));

vi.mock('@/components/MusicPlayer/MusicPlayer', () => ({
  default: () => <div data-testid="music-player">MusicPlayer</div>,
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
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('masthead')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('glitter-bomb')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('music-player')).toBeInTheDocument();
    });
  });
});
