import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ProjectGrid from './ProjectGrid';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

describe('ProjectGrid', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('selects a project on click and writes hash', () => {
    render(<ProjectGrid />);

    const firstProjectTitle = screen.getAllByRole('heading', { level: 3 })[0];
    fireEvent.click(firstProjectTitle);

    expect(window.location.hash).toMatch(/^#project=/);
  });

  it('opens modal when hash matches a project id', async () => {
    render(<ProjectGrid />);

    const firstProjectTitle = screen.getAllByRole('heading', { level: 3 })[0];
    fireEvent.click(firstProjectTitle);

    const selectedId = decodeURIComponent(window.location.hash.replace(/^#project=/, ''));

    window.location.hash = `project=${encodeURIComponent(selectedId)}`;
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(await screen.findByLabelText('Close modal')).toBeInTheDocument();
  });

  it('clears hash when closing modal', async () => {
    render(<ProjectGrid />);

    const firstProjectTitle = screen.getAllByRole('heading', { level: 3 })[0];
    fireEvent.click(firstProjectTitle);

    expect(window.location.hash).toMatch(/^#project=/);

    fireEvent.click(await screen.findByLabelText('Close modal'));

    expect(window.location.hash).toBe('');
  });
});
