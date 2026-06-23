import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Portrait from './Portrait';

describe('Portrait', () => {
  it('renders the image with the given src and alt', () => {
    render(
      <Portrait src="/ashley.webp" alt="Ashley Childress portrait" width={600} height={400} />
    );
    const img = screen.getByAltText('Ashley Childress portrait');
    expect(img).toHaveAttribute('src', '/ashley.webp');
  });

  it('renders the decorative meta labels', () => {
    render(
      <Portrait src="/ashley.webp" alt="Ashley Childress portrait" width={600} height={400} />
    );
    expect(screen.getByText('SUBJECT · 026')).toBeInTheDocument();
    expect(screen.getByText('YEAR · 2026')).toBeInTheDocument();
  });
});
