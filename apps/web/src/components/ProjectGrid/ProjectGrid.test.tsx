import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ProjectGrid from './ProjectGrid';
import { mockProject } from '@/test-utils/fixtures';

// next/image is mocked globally in setupTests.ts

const mockProjects = [mockProject, { ...mockProject, id: 'other-project', title: 'Other Project' }];

const flipToggle = (id: string) =>
  within(screen.getByTestId(`project-card-${id}`)).getByRole('button', { name: /flip to read/i });

describe('ProjectGrid', () => {
  beforeEach(() => {
    globalThis.location.hash = '';
  });

  it('renders all projects from the projects prop', () => {
    render(<ProjectGrid projects={mockProjects} />);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(mockProjects.length);
  });

  it('flips a card in place on click without writing to the URL', () => {
    render(<ProjectGrid projects={mockProjects} />);

    // Capture before clicking — the flipped front goes aria-hidden.
    const toggle = flipToggle('test-project');
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(globalThis.location.hash).toBe('');
  });

  it('flips cards independently of one another', () => {
    render(<ProjectGrid projects={mockProjects} />);

    const first = flipToggle('test-project');
    fireEvent.click(first);

    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(flipToggle('other-project')).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders empty grid when no projects provided', () => {
    render(<ProjectGrid projects={[]} />);
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });
});
