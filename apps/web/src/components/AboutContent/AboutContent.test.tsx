import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AboutContent from './AboutContent';
import type { AboutData } from '@/data/about';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

const baseData: AboutData = {
  heroTitle: 'Designing for failures\nyou have not met yet',
  heroImage: {
    src: '/ashley-gen-2.webp',
    alt: 'Ashley Childress profile picture',
    width: 600,
    height: 400,
  },
  sections: [
    {
      title: 'Ashley Childress',
      subtitle: '/ ASH-lee CHIL-dres /',
      content: 'First paragraph here.\n\nSecond paragraph here.',
    },
    {
      title: 'Theme Song',
      content: 'Single paragraph for the theme song.',
    },
  ],
};

describe('AboutContent', () => {
  it('renders the profile image with the fixed src and alt', () => {
    render(<AboutContent data={baseData} />);
    const img = screen.getByAltText('Ashley Childress profile picture');
    expect(img).toHaveAttribute('src', '/ashley-gen-2.webp');
  });

  it('renders the first section title as h1 and subsequent as h2', () => {
    render(<AboutContent data={baseData} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Ashley Childress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Theme Song' })).toBeInTheDocument();
  });

  it('splits double-newline content into separate paragraphs', () => {
    render(<AboutContent data={baseData} />);
    expect(screen.getByText('First paragraph here.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph here.')).toBeInTheDocument();
  });

  it('renders the subtitle when present', () => {
    render(<AboutContent data={baseData} />);
    expect(screen.getByText('/ ASH-lee CHIL-dres /')).toBeInTheDocument();
  });

  it('omits the subtitle when not provided', () => {
    const noSubtitle: AboutData = {
      ...baseData,
      sections: [{ title: 'Solo', content: 'Only body.' }],
    };
    render(<AboutContent data={noSubtitle} />);
    expect(screen.queryByText('/ ASH-lee CHIL-dres /')).not.toBeInTheDocument();
    expect(screen.getByText('Only body.')).toBeInTheDocument();
  });

  it('numbers sections starting at 01 and increments per section', () => {
    render(<AboutContent data={baseData} />);
    expect(screen.getByText(/^01 ·/)).toBeInTheDocument();
    expect(screen.getByText(/^02 ·/)).toBeInTheDocument();
  });
});
