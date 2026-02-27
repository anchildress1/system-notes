import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectGrid from './ProjectGrid';
import { mockProject } from '@/test-utils/fixtures';

// next/image is mocked globally in setupTests.ts

const mockProjects = [mockProject, { ...mockProject, id: 'other-project', title: 'Other Project' }];

describe('ProjectGrid', () => {
  beforeEach(() => {
    globalThis.location.hash = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all projects from the projects prop', () => {
    render(<ProjectGrid projects={mockProjects} />);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(mockProjects.length);
  });

  it('selects a project on click and writes hash', () => {
    render(<ProjectGrid projects={mockProjects} />);

    const firstProjectTitle = screen.getAllByRole('heading', { level: 2 })[0];
    fireEvent.click(firstProjectTitle);

    expect(globalThis.location.hash).toMatch(/^#project=/);
  });

  it('opens modal when hash matches a project id', async () => {
    render(<ProjectGrid projects={mockProjects} />);

    const firstProjectTitle = screen.getAllByRole('heading', { level: 2 })[0];
    fireEvent.click(firstProjectTitle);

    const selectedId = decodeURIComponent(globalThis.location.hash.replace(/^#project=/, ''));

    globalThis.location.hash = `project=${encodeURIComponent(selectedId)}`;
    globalThis.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(await screen.findByLabelText('Close modal')).toBeInTheDocument();
  });

  it('clears hash when closing modal', async () => {
    render(<ProjectGrid projects={mockProjects} />);

    const firstProjectTitle = screen.getAllByRole('heading', { level: 2 })[0];
    fireEvent.click(firstProjectTitle);

    expect(globalThis.location.hash).toMatch(/^#project=/);

    fireEvent.click(await screen.findByLabelText('Close modal'));

    expect(globalThis.location.hash).toBe('');
  });

  it('renders empty grid when no projects provided', () => {
    render(<ProjectGrid projects={[]} />);
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });
});
