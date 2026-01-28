import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import MusicPlayer from './MusicPlayer';

describe('MusicPlayer', () => {
  // Store original implementations to restore them later
  const originalPlay = window.HTMLMediaElement.prototype.play;
  const originalPause = window.HTMLMediaElement.prototype.pause;

  beforeEach(() => {
    // Mock audio play/pause methods
    // play returns a Promise
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    // Restore original implementations
    window.HTMLMediaElement.prototype.play = originalPlay;
    window.HTMLMediaElement.prototype.pause = originalPause;
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
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    // 1. Click Play
    fireEvent.click(button);

    // Should call audio.play()
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    // Wait for the async state update (play promise resolution)
    await waitFor(() => {
      // Should switch to Pause button
      expect(screen.getByLabelText(/Pause/i)).toBeInTheDocument();
    });

    // 2. Click Pause
    fireEvent.click(button);

    // Should call audio.pause()
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);

    // Should immediately switch back to Play state (pause is synchronous in the handler)
    expect(screen.getByLabelText(/Play/i)).toBeInTheDocument();
  });

  it('handles playback failure gracefully', async () => {
    // Mock a rejected promise for play to simulate autoplay block or other error
    const playError = new Error('NotAllowedError');
    window.HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(playError);

    // Spy on console.error to avoid treating it as a test failure and to verify it was called
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<MusicPlayer />);
    const button = screen.getByTestId('play-button');

    // Click Play
    fireEvent.click(button);

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Wait for the validation of the error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Playback failed:', playError);
    });

    // UI should remain in (or revert to) Play state, NOT Pause state
    expect(screen.getByLabelText(/Play/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Pause/i)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('reset state when audio ends', () => {
    render(<MusicPlayer />);

    // Get the audio element (it's in the DOM)
    const audioElement = screen.getByTestId('music-player').querySelector('audio');
    expect(audioElement).toBeInTheDocument();

    // Trigger onEnded event manually since we can't easily wait for real audio to end in JSDOM
    fireEvent.ended(audioElement!);

    // Should ensure it is in paused state (showing Play button)
    expect(screen.getByLabelText(/Play/i)).toBeInTheDocument();
  });
});
