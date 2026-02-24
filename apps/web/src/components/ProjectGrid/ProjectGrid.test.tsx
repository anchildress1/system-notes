import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectGrid from './ProjectGrid';

// next/image is mocked globally in setupTests.ts

describe('ProjectGrid', () => {
  beforeEach(() => {
    globalThis.location.hash = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('selects a project on click and writes hash', () => {
    render(<ProjectGrid />);

    const firstProjectTitle = screen.getAllByRole('heading', { level: 3 })[0];
    fireEvent.click(firstProjectTitle);

    expect(globalThis.location.hash).toMatch(/^#project=/);
  });

  it('opens modal when hash matches a project id', async () => {
    render(<ProjectGrid />);

    const firstProjectTitle = screen.getAllByRole('heading', { level: 3 })[0];
    fireEvent.click(firstProjectTitle);

    const selectedId = decodeURIComponent(globalThis.location.hash.replace(/^#project=/, ''));

    globalThis.location.hash = `project=${encodeURIComponent(selectedId)}`;
    globalThis.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(await screen.findByLabelText('Close modal')).toBeInTheDocument();
  });

  it('clears hash when closing modal', async () => {
    render(<ProjectGrid />);

    const firstProjectTitle = screen.getAllByRole('heading', { level: 3 })[0];
    fireEvent.click(firstProjectTitle);

    expect(globalThis.location.hash).toMatch(/^#project=/);

    fireEvent.click(await screen.findByLabelText('Close modal'));

    expect(globalThis.location.hash).toBe('');
  });
});
