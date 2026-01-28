import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
        stop: vi.fn(),
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
    // Ensure desktop environment for sparkles to init
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).ontouchstart;
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
    await waitFor(
      () => {
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const hero = container.firstChild;
    if (hero) {
      fireEvent.mouseMove(hero, { clientX: 50, clientY: 50 });
      fireEvent.touchMove(hero, { touches: [{ clientX: 50, clientY: 50 }] });
      // Wait for async interaction loop (import('pixi.js') is async)
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  });
  it('triggers glitter bomb on click', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<AboutHero />);

    // The interactive container is the div wrapping the title
    const trigger = screen.getByRole('button', { name: /Click to trigger/i });
    fireEvent.click(trigger);

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls.find(
      (call) => (call[0] as Event).type === 'trigger-glitter-bomb'
    );
    expect(event).toBeTruthy();
  });

  it('triggers glitter bomb on Enter/Space key', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<AboutHero />);

    const trigger = screen.getByRole('button', { name: /Click to trigger/i });

    // Enter
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(dispatchSpy).toHaveBeenCalled(); // +1

    // Space
    fireEvent.keyDown(trigger, { key: ' ' });
    expect(dispatchSpy).toHaveBeenCalledTimes(2); // +1
  });
});
