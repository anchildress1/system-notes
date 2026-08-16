import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEscapeToClose } from './useEscapeToClose';

describe('useEscapeToClose', () => {
  it('closes an open surface and prevents Escape default behavior', () => {
    const close = vi.fn();
    renderHook(() => useEscapeToClose(true, close));
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });

    globalThis.dispatchEvent(event);

    expect(close).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores other keys', () => {
    const close = vi.fn();
    renderHook(() => useEscapeToClose(true, close));

    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(close).not.toHaveBeenCalled();
  });

  it('does not listen while closed', () => {
    const close = vi.fn();
    renderHook(() => useEscapeToClose(false, close));

    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(close).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount', () => {
    const close = vi.fn();
    const { unmount } = renderHook(() => useEscapeToClose(true, close));
    unmount();

    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(close).not.toHaveBeenCalled();
  });
});
