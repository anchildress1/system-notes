import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProjectGrid from './ProjectGrid';
import { allProjects, Project } from '@/data/projects';

// Mock the dynamic import of ExpandedView
vi.mock('@/components/ExpandedView/ExpandedView', () => ({
  default: ({ project, onClose }: { project: Project; onClose: () => void }) => (
    <div data-testid="expanded-view">
      <h1>{project.title}</h1>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock ProjectCard to simplify testing
vi.mock('@/components/ProjectCard/ProjectCard', () => ({
  default: ({ project, onSelect }: { project: Project; onSelect: (p: Project) => void }) => (
    <div data-testid="project-card" onClick={() => onSelect(project)}>
      {project.title}
    </div>
  ),
}));

describe('ProjectGrid Component', () => {
  it('renders a grid of project cards', () => {
    render(<ProjectGrid />);
    const cards = screen.getAllByTestId('project-card');
    expect(cards).toHaveLength(allProjects.length);
  });

  it('opens ExpandedView when a project card is clicked', async () => {
    render(<ProjectGrid />);
    const firstCard = screen.getAllByTestId('project-card')[0];

    fireEvent.click(firstCard);

    await waitFor(() => {
      expect(screen.getByTestId('expanded-view')).toBeInTheDocument();
      const expandedView = screen.getByTestId('expanded-view');
      // Scope search to the expanded view since the card grid is still visible
      expect(within(expandedView).getByText(allProjects[0].title)).toBeInTheDocument();
    });
  });

  it('closes ExpandedView when close button is clicked', async () => {
    render(<ProjectGrid />);
    const firstCard = screen.getAllByTestId('project-card')[0];

    // Open modal
    fireEvent.click(firstCard);
    await waitFor(() => {
      expect(screen.getByTestId('expanded-view')).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => {
      expect(screen.queryByTestId('expanded-view')).not.toBeInTheDocument();
    });
  });
});
