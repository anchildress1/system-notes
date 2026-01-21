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

  it('renders the title', () => {
    const customTitle = 'Custom Project Title';
    render(<AboutHero title={customTitle} />);
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('renders with default title if none provided', () => {
    render(<AboutHero />);
    expect(screen.getByText(/I design for the failure/i)).toBeInTheDocument();
  });

  it('dispatches trigger-glitter-bomb event on title click', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<AboutHero />);

    const titleContainer = screen.getByRole('button');
    fireEvent.click(titleContainer);

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
