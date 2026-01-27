import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Hero from './Hero';

// Mock PIXI.js since it interacts with canvas/webgl
vi.mock('pixi.js', () => {
  return {
    Application: class {
      init = vi.fn().mockResolvedValue(undefined);
      canvas = document.createElement('canvas'); // return a real dummy element
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

describe('Hero Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title as an accessible button', () => {
    render(<Hero />);
    expect(screen.getByRole('button', { name: /Click to trigger/i })).toBeInTheDocument();
    expect(screen.getByText(/Not here to play nice/i)).toBeInTheDocument();
    expect(screen.getByText(/Disruption is the feature—loud by design/i)).toBeInTheDocument();
  });

  it('dispatches trigger-glitter-bomb event on title click', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Hero />);

    const title = screen.getByRole('button', { name: /Click to trigger/i });
    fireEvent.click(title);

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as Event;
    expect(event.type).toBe('trigger-glitter-bomb');
  });
});
