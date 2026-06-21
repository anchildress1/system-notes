import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Portrait from './Portrait';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

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
