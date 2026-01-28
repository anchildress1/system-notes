import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import GlitterBomb from './GlitterBomb';

const mockDestroy = vi.fn();
const mockInit = vi.fn();
const mockGenerateTexture = vi.fn(() => 'MOCKED_TEXTURE');
const mockTickerAdd = vi.fn();
const mockTickerStart = vi.fn();
const mockTickerStop = vi.fn();

vi.mock('pixi.js', () => {
  return {
    Application: class {
      init = mockInit;
      canvas = document.createElement('canvas');
      stage = { addChild: vi.fn(), removeChild: vi.fn() };
      ticker = {
        add: mockTickerAdd,
        remove: vi.fn(),
        start: mockTickerStart,
        stop: mockTickerStop,
        started: false,
      };
      renderer = { generateTexture: mockGenerateTexture };
      destroy = mockDestroy;
      screen = { width: 800, height: 600 };
      start = vi.fn();
    },
    Graphics: class {
      circle = vi.fn();
      fill = vi.fn();
      destroy = vi.fn();
    },
    Sprite: class {
      anchor = { set: vi.fn() };
      scale = { set: vi.fn() };
      tint = 0;
      x = 0;
      y = 0;
      alpha = 1;
    },
  };
});

describe('GlitterBomb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure desktop environment
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).ontouchstart;
  });

  it('renders and initializes pixi app', async () => {
    const { unmount } = render(<GlitterBomb />);

    // Wait for effect
    await import('@testing-library/react').then(async ({ waitFor }) => {
      await waitFor(() => {
        expect(mockInit).toHaveBeenCalled();
      });
      expect(mockGenerateTexture).toHaveBeenCalled();
    });

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
  });
});
