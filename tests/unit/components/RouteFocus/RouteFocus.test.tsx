import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RouteFocus from '@/components/RouteFocus/RouteFocus';

const navigation = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}));

// The component defers a frame so the incoming segment is mounted before it
// looks for the landmark. Running the callback inline keeps that ordering
// without making every assertion wait on a real frame.
function runFramesInline() {
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
}

function mountMain(): HTMLElement {
  const main = document.createElement('main');
  main.id = 'main-content';
  document.body.append(main);
  return main;
}

describe('RouteFocus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigation.pathname = '/';
    document.body.replaceChildren();
    runFramesInline();
  });

  it('moves focus to the main landmark when the route changes', () => {
    const main = mountMain();
    const { rerender } = render(<RouteFocus />);

    navigation.pathname = '/projects';
    rerender(<RouteFocus />);

    expect(main).toHaveFocus();
    // -1 keeps the landmark out of the tab sequence while allowing focus().
    expect(main.tabIndex).toBe(-1);
  });

  it('leaves focus alone on the first render, which is a load rather than a navigation', () => {
    const main = mountMain();
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();

    render(<RouteFocus />);

    expect(button).toHaveFocus();
    expect(main).not.toHaveFocus();
  });

  it('does not move focus when the pathname is unchanged', () => {
    const main = mountMain();
    const button = document.createElement('button');
    document.body.append(button);
    const { rerender } = render(<RouteFocus />);
    button.focus();

    rerender(<RouteFocus />);

    expect(button).toHaveFocus();
    expect(main).not.toHaveFocus();
  });

  it('survives a route with no main landmark', () => {
    const { rerender } = render(<RouteFocus />);

    navigation.pathname = '/projects';

    expect(() => rerender(<RouteFocus />)).not.toThrow();
    expect(document.body).toHaveFocus();
  });

  // Only a navigation schedules a frame — the first render returns before it —
  // so the cleanup has to be reached through one.
  it('cancels a pending frame so an unmount cannot steal focus later', () => {
    mountMain();
    const { rerender, unmount } = render(<RouteFocus />);
    navigation.pathname = '/projects';
    rerender(<RouteFocus />);
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame');

    unmount();

    expect(cancel).toHaveBeenCalled();
  });

  it('renders nothing', () => {
    const { container } = render(<RouteFocus />);

    expect(container).toBeEmptyDOMElement();
  });
});
