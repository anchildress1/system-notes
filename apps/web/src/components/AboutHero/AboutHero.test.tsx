import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  // Glitter bomb test removed as it depended on clicking the name which is moved out of AboutHero
  // Ideally this should be moved to where the name is rendered if the functionality is preserved.

  it('renders the image with correct alt text', async () => {
    const image = {
      src: '/test.jpg',
      alt: 'Test Alt Text',
      width: 100,
      height: 100,
    };
    const { container } = render(<AboutHero image={image} />);
    const img = screen.getByAltText('Test Alt Text');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');

    // Wait for sparkles to init (increases coverage)
    // Wait for sparkles to init (increases coverage)
    await import('@testing-library/react').then(async ({ waitFor, fireEvent }) => {
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
      });

      const hero = container.firstChild;
      if (hero) {
        fireEvent.mouseMove(hero, { clientX: 50, clientY: 50 });
        fireEvent.touchMove(hero, { touches: [{ clientX: 50, clientY: 50 }] });
        // Wait for async interaction loop (import('pixi.js') is async)
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });
  });
});
