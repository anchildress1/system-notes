import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './page';

vi.mock('@/components/Header/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/Hero/Hero', () => ({
  default: () => <div data-testid="hero">Hero</div>,
}));

vi.mock('@/components/ProjectGrid/ProjectGrid', () => ({
  default: () => <div data-testid="project-grid">ProjectGrid</div>,
}));

describe('Home Page', () => {
  it('renders main layout components', () => {
    render(<Home />);

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('project-grid')).toBeInTheDocument();
  });
});
