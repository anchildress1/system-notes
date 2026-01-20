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

  it('renders the title and subtitle', () => {
    render(<Hero />);
    expect(screen.getByText(/Disruption is a feature/i)).toBeInTheDocument();
    expect(screen.getByText(/Not here to play nice/i)).toBeInTheDocument();
  });

  it('dispatches trigger-glitter-bomb event on title click', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Hero />);

    const title = screen.getByText(/Disruption is a feature/i);
    fireEvent.click(title);

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as Event;
    expect(event.type).toBe('trigger-glitter-bomb');
  });

  it('dispatches trigger-glitter-bomb event on Enter key', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<Hero />);

    const title = screen.getByText(/Disruption is a feature/i);
    fireEvent.keyDown(title, { key: 'Enter' });

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls[0][0] as Event;
    expect(event.type).toBe('trigger-glitter-bomb');
  });
});
