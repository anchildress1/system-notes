import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Tag from './Tag';

describe('Tag', () => {
  it('renders solid by default', () => {
    render(<Tag>TypeScript</Tag>);
    expect(screen.getByText('TypeScript')).toHaveAttribute('data-variant', 'solid');
  });

  it('renders the outline variant', () => {
    render(<Tag variant="outline">Next.js</Tag>);
    expect(screen.getByText('Next.js')).toHaveAttribute('data-variant', 'outline');
  });

  it('applies an extra className', () => {
    render(<Tag className="extra">FastAPI</Tag>);
    expect(screen.getByText('FastAPI').className).toContain('extra');
  });
});
