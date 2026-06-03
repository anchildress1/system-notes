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
  name: 'Ashley Childress',
  namePath: 'CWD · /sys/human',
  pronounce: 'she/her · senior software engineer',
  stats: [
    { label: 'origin', value: 'Appalachia' },
    { label: 'role', value: 'Sr SWE' },
  ],
  lyric: {
    meta: 'THEME SONG',
    metaRight: '2026 · LOUD',
    rows: [
      { time: '00:00.4', text: 'I BUILD THINGS', tag: 'INTENT', tone: 'pink' },
      { time: '00:08.0', text: 'I SHIP THINGS', tag: 'DEPLOY', tone: 'violet' },
    ],
  },
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

  it('renders all section titles as h2 (the hero owns the page h1)', () => {
    render(<AboutContent data={baseData} />);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Ashley Childress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Theme Song' })).toBeInTheDocument();
  });

  it('renders the identity block: name, pronounce, and stats', () => {
    render(<AboutContent data={baseData} />);
    expect(screen.getByText('CWD · /sys/human')).toBeInTheDocument();
    expect(screen.getByText('Appalachia')).toBeInTheDocument();
    expect(screen.getByText('Sr SWE')).toBeInTheDocument();
  });

  it('renders the loud lyric rows', () => {
    render(<AboutContent data={baseData} />);
    expect(screen.getByText('I BUILD THINGS')).toBeInTheDocument();
    expect(screen.getByText('I SHIP THINGS')).toBeInTheDocument();
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

  it('wraps *text* in <em> and leaves surrounding text plain', () => {
    const emphasisData: AboutData = {
      ...baseData,
      sections: [{ title: 'Test', content: 'Before *highlighted* after.' }],
    };
    render(<AboutContent data={emphasisData} />);
    const em = screen.getByText('highlighted');
    expect(em.tagName).toBe('EM');
    expect(em.closest('p')).toHaveTextContent('Before highlighted after.');
  });

  it('renders a lone asterisk as plain text (no accidental wrapping)', () => {
    const loneData: AboutData = {
      ...baseData,
      sections: [{ title: 'Test', content: '*only one' }],
    };
    render(<AboutContent data={loneData} />);
    expect(screen.queryByRole('emphasis')).not.toBeInTheDocument();
    expect(screen.getByText('*only one')).toBeInTheDocument();
  });

  it('wraps multiple emphasis spans in a single paragraph independently', () => {
    const multiData: AboutData = {
      ...baseData,
      sections: [{ title: 'Test', content: '*first* and *second*' }],
    };
    render(<AboutContent data={multiData} />);
    expect(screen.getByText('first').tagName).toBe('EM');
    expect(screen.getByText('second').tagName).toBe('EM');
    expect(screen.getByText('first').closest('p')).toHaveTextContent('first and second');
  });

  it('wraps a full paragraph in <em> when the entire text is marked', () => {
    const fullData: AboutData = {
      ...baseData,
      sections: [{ title: 'Test', content: '*The whole line.*' }],
    };
    render(<AboutContent data={fullData} />);
    const em = screen.getByText('The whole line.');
    expect(em.tagName).toBe('EM');
  });
});
