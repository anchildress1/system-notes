import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it('renders neutral by default', () => {
    render(<Badge>Project</Badge>);
    const el = screen.getByText('Project');
    expect(el).toHaveAttribute('data-variant', 'neutral');
    expect(el).toHaveAttribute('data-accent', 'violet');
  });

  it('honors accent variant and hue', () => {
    render(
      <Badge variant="accent" accent="teal">
        Tool
      </Badge>
    );
    const el = screen.getByText('Tool');
    expect(el).toHaveAttribute('data-variant', 'accent');
    expect(el).toHaveAttribute('data-accent', 'teal');
  });

  it('renders the award variant', () => {
    render(<Badge variant="award">Winner</Badge>);
    expect(screen.getByText('Winner')).toHaveAttribute('data-variant', 'award');
  });

  it('renders an icon when provided', () => {
    render(<Badge icon={<span data-testid="ico">★</span>}>Winner</Badge>);
    expect(screen.getByTestId('ico')).toBeInTheDocument();
  });
});
