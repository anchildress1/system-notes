import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import MusicPlayer from './MusicPlayer';

/** Query the <audio> element inside the music-player test container. */
function getAudioElement(): HTMLAudioElement {
  const el = screen.getByTestId('music-player').querySelector('audio');
  if (!el) throw new Error('Expected audio element');
  return el;
}

describe('MusicPlayer', () => {
  // Store original implementations to restore them later
  const originalPlay = globalThis.HTMLMediaElement.prototype.play;
  const originalPause = globalThis.HTMLMediaElement.prototype.pause;

  beforeEach(() => {
    // Mock audio play/pause methods
    // play returns a Promise
    globalThis.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    globalThis.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    // Restore original implementations
    globalThis.HTMLMediaElement.prototype.play = originalPlay;
    globalThis.HTMLMediaElement.prototype.pause = originalPause;
    vi.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<MusicPlayer />);
    expect(screen.getByTestId('music-player')).toBeInTheDocument();
    // Should show Play button initially
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
    // Check for aria-label indicating play state
    expect(screen.getByLabelText(/Play/i)).toBeInTheDocument();
  });

  it('toggles play/pause states correctly', async () => {
    render(<MusicPlayer />);
    const button = screen.getByTestId('play-button');

    // Initial state: Not playing
    expect(globalThis.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    // 1. Click Play
    fireEvent.click(button);

    // Should call audio.play()
    expect(globalThis.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    // Wait for the async state update (play promise resolution)
    await waitFor(() => {
      // Should switch to Pause button
      expect(screen.getByLabelText(/Pause/i)).toBeInTheDocument();
    });

    // 2. Click Pause
    fireEvent.click(button);

    // Should call audio.pause()
    expect(globalThis.HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);

    // Should immediately switch back to Play state (pause is synchronous in the handler)
    expect(screen.getByTestId('play-button')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/^Play/i)
    );
  });

  it('handles playback failure gracefully', async () => {
    // Mock a rejected promise for play to simulate autoplay block or other error
    const playError = new Error('NotAllowedError');
    globalThis.HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(playError);

    // Spy on console.error to avoid treating it as a test failure and to verify it was called
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<MusicPlayer />);
    const button = screen.getByTestId('play-button');

    // Click Play
    fireEvent.click(button);

    expect(globalThis.HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Wait for the validation of the error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Playback failed:', playError);
    });

    // UI should remain in (or revert to) Play state, NOT Pause state
    expect(screen.getByLabelText(/Play/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Pause/i)).not.toBeInTheDocument();
    // play() rejection sets hasError — button must be disabled to prevent retry
    expect(screen.getByTestId('play-button')).toBeDisabled();

    consoleSpy.mockRestore();
  });

  it('reset state when audio ends', () => {
    render(<MusicPlayer />);

    const audioElement = getAudioElement();

    // Trigger onEnded event manually since we can't easily wait for real audio to end in JSDOM
    fireEvent.ended(audioElement);

    // Should ensure it is in paused state (showing Play button)
    expect(screen.getByLabelText(/Play/i)).toBeInTheDocument();
  });

  it('disables button and shows error state when audio fails to load', () => {
    render(<MusicPlayer />);

    // Trigger the onError handler
    fireEvent.error(getAudioElement());

    // Button should be disabled after an audio error
    const button = screen.getByTestId('play-button');
    expect(button).toBeDisabled();

    // Should remain in Play (not Pause) state
    expect(screen.getByLabelText(/Play/i)).toBeInTheDocument();
  });

  it('transitions from playing to error state when audio error fires mid-playback', async () => {
    render(<MusicPlayer />);
    const button = screen.getByTestId('play-button');

    // Start playback
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByLabelText(/Pause/i)).toBeInTheDocument();
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate audio element error while playing
    fireEvent.error(getAudioElement());

    // isPlaying should revert to false, hasError should be true (button disabled)
    expect(screen.getByTestId('play-button')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/^Play/i)
    );
    expect(screen.getByTestId('play-button')).toBeDisabled();

    consoleSpy.mockRestore();
  });

  it('does not call play on initial mount without user interaction', () => {
    render(<MusicPlayer />);
    expect(globalThis.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Play/i)).toBeInTheDocument();
  });

  it('renders player panel in the DOM at all times', () => {
    render(<MusicPlayer />);
    expect(screen.getByTestId('player-panel')).toBeInTheDocument();
  });
});
