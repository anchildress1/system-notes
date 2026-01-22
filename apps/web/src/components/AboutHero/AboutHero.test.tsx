import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AboutHero from './AboutHero';

// Mock PIXI.js
vi.mock('pixi.js', () => {
  return {
    Application: class {
      init = vi.fn().mockResolvedValue(undefined);
      canvas = document.createElement('canvas');
      stage = {
        addChild: vi.fn(),
        removeChild: vi.fn(),
      };
      ticker = {
        add: vi.fn(),
      };
      destroy = vi.fn();
    },
    Graphics: class {
      circle = vi.fn();
      fill = vi.fn();
    },
  };
});

describe('AboutHero Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the name and enunciation', () => {
    render(<AboutHero name="Test Name" enunciation="/ Test Enunciation /" />);
    expect(screen.getByText('Test Name')).toBeInTheDocument();
    expect(screen.getByText('/ Test Enunciation /')).toBeInTheDocument();
  });

  it('renders with default name and enunciation if none provided', () => {
    render(<AboutHero />);
    expect(screen.getByText('Ashley Childress')).toBeInTheDocument();
    expect(screen.getByText('/ ASH-lee CHIL-dres /')).toBeInTheDocument();
  });

  it('renders the sitemap link', () => {
    render(<AboutHero sitemapText="Test Sitemap" />);
    const link = screen.getByText('Test Sitemap');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/sitemap');
  });

  it('dispatches trigger-glitter-bomb event on name click', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<AboutHero />);

    // Click the name portion (which is now a role="button")
    const nameButton = screen.getAllByRole('button')[0];
    fireEvent.click(nameButton);

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as Event;
    expect(event.type).toBe('trigger-glitter-bomb');
  });

  it('renders the image with correct alt text', () => {
    const image = {
      src: '/test.jpg',
      alt: 'Test Alt Text',
      width: 100,
      height: 100,
    };
    render(<AboutHero image={image} />);
    const img = screen.getByAltText('Test Alt Text');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });
});
