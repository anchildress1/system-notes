import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeSong, { TRACK_ARTIST, TRACK_SRC, TRACK_TITLE } from '@/components/ThemeSong/ThemeSong';

type PlayRequest = {
  state: 'pending' | 'aborted' | 'settled';
  resolve: () => void;
  reject: (error: Error) => void;
};

const errorDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'error');

afterEach(() => {
  if (errorDescriptor) Object.defineProperty(HTMLMediaElement.prototype, 'error', errorDescriptor);
  else Reflect.deleteProperty(HTMLMediaElement.prototype, 'error');
});

/* jsdom has no media pipeline. Requests stay pending until the test supplies
   playing or rejection; a play event alone does not mean audio is audible. */
function stubPlayback() {
  let paused = true;
  let mediaError: MediaError | null = null;
  const requests: PlayRequest[] = [];
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(() => paused);
  // jsdom omits MediaError; native media exposes it as a read-only property.
  Object.defineProperty(HTMLMediaElement.prototype, 'error', {
    configurable: true,
    get: () => mediaError,
  });
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
    if (paused) {
      paused = false;
      this.dispatchEvent(new Event('play'));
    }
    return new Promise<void>((resolve, reject) => {
      requests.push({ state: 'pending', resolve, reject });
    });
  });
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
    if (paused) return;
    paused = true;
    this.dispatchEvent(new Event('pause'));
    for (const request of requests) {
      if (request.state === 'pending') request.state = 'aborted';
    }
  });
  const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {
    paused = true;
    mediaError = null;
  });

  return {
    play,
    pause,
    load,
    async start() {
      await act(async () => {
        fireEvent.playing(audio());
        for (const request of requests) {
          if (request.state !== 'pending') continue;
          request.state = 'settled';
          request.resolve();
        }
      });
    },
    end() {
      paused = true;
      fireEvent.ended(audio());
    },
    fail() {
      paused = true;
      mediaError = { code: 3, message: 'Media decoding failed' } as MediaError;
      fireEvent.error(audio());
    },
    async deliverAborts() {
      // Native pause rejection arrives asynchronously and can trail a newer play request.
      await act(async () => {
        for (const request of requests) {
          if (request.state !== 'aborted') continue;
          request.state = 'settled';
          request.reject(new DOMException('Playback was cancelled', 'AbortError'));
        }
      });
    },
  };
}

const toggle = () => screen.getByRole('button', { name: /theme song/i });
const audio = () => screen.getByTestId('theme-song-audio') as HTMLAudioElement;
const note = () => document.querySelector('[aria-live="polite"]') as HTMLElement;
const equalizer = () => document.querySelector('[aria-hidden="true"][data-playing]');

describe('ThemeSong', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Cleanup pauses even an untouched player; jsdom's native implementation only logs an error.
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  it('renders an idle control with explicit-content advice and no audio preload', () => {
    render(<ThemeSong />);

    expect(toggle()).toHaveAccessibleName(
      `Play the theme song, ${TRACK_TITLE} by ${TRACK_ARTIST}. Explicit content.`
    );
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(toggle()).toBeEnabled();
    expect(note()).toHaveTextContent(TRACK_ARTIST);
    expect(audio()).toHaveAttribute('src', TRACK_SRC);
    expect(audio()).toHaveAttribute('preload', 'none');
    expect(equalizer()).toHaveAttribute('data-playing', 'false');
  });

  it('announces loading until the media actually begins playing', async () => {
    const playback = stubPlayback();
    render(<ThemeSong />);

    fireEvent.click(toggle());

    expect(playback.play).toHaveBeenCalledOnce();
    expect(audio().paused).toBe(false);
    expect(toggle()).toHaveTextContent('Cancel');
    expect(toggle()).toHaveAccessibleName(
      `Cancel loading the theme song, ${TRACK_TITLE} by ${TRACK_ARTIST}. Explicit content.`
    );
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(note()).toHaveTextContent('loading audio');
    expect(equalizer()).toHaveAttribute('data-playing', 'false');

    await playback.start();

    expect(toggle()).toHaveAccessibleName(
      `Pause the theme song, ${TRACK_TITLE} by ${TRACK_ARTIST}. Explicit content.`
    );
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(note()).toHaveTextContent('now playing');
    expect(equalizer()).toHaveAttribute('data-playing', 'true');
  });

  it('cancels a pending play request without turning cancellation into an error', async () => {
    const playback = stubPlayback();
    render(<ThemeSong />);
    fireEvent.click(toggle());

    fireEvent.click(toggle());
    await playback.deliverAborts();

    expect(playback.pause).toHaveBeenCalledOnce();
    expect(playback.play).toHaveBeenCalledOnce();
    expect(audio().paused).toBe(true);
    expect(toggle()).toHaveAccessibleName(/^Play the theme song/);
    expect(toggle()).toBeEnabled();
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(note()).toHaveTextContent(TRACK_ARTIST);
    expect(equalizer()).toHaveAttribute('data-playing', 'false');
  });

  it.each(['loading', 'playing'] as const)(
    'keeps a newer %s request intact when a cancelled play rejects late',
    async (state) => {
      const playback = stubPlayback();
      render(<ThemeSong />);
      fireEvent.click(toggle());
      fireEvent.click(toggle());
      fireEvent.click(toggle());
      if (state === 'playing') await playback.start();

      await playback.deliverAborts();

      expect(playback.play).toHaveBeenCalledTimes(2);
      expect(playback.pause).toHaveBeenCalledOnce();
      expect(playback.load).not.toHaveBeenCalled();
      expect(toggle()).toBeEnabled();
      expect(audio().paused).toBe(false);
      expect(toggle()).toHaveAttribute('aria-pressed', String(state === 'playing'));
      expect(note()).toHaveTextContent(state === 'playing' ? 'now playing' : 'loading audio');
      expect(equalizer()).toHaveAttribute('data-playing', String(state === 'playing'));
    }
  );

  it.each(['pause', 'end'] as const)('returns to idle after playback %s', async (event) => {
    const playback = stubPlayback();
    render(<ThemeSong />);
    fireEvent.click(toggle());
    await playback.start();

    if (event === 'pause') fireEvent.click(toggle());
    else playback.end();

    expect(audio().paused).toBe(true);
    expect(toggle()).toHaveAccessibleName(/^Play the theme song/);
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(note()).toHaveTextContent(TRACK_ARTIST);
    expect(equalizer()).toHaveAttribute('data-playing', 'false');
    expect(playback.pause).toHaveBeenCalledTimes(event === 'pause' ? 1 : 0);
  });

  it('announces buffering and pauses the equalizer until playback resumes', async () => {
    const playback = stubPlayback();
    render(<ThemeSong />);
    fireEvent.click(toggle());
    await playback.start();

    fireEvent.waiting(audio());

    expect(toggle()).toHaveTextContent('Cancel');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(note()).toHaveTextContent('loading audio');
    expect(equalizer()).toHaveAttribute('data-playing', 'false');

    await playback.start();

    expect(playback.play).toHaveBeenCalledOnce();
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(note()).toHaveTextContent('now playing');
    expect(equalizer()).toHaveAttribute('data-playing', 'true');
  });

  it('ignores a late waiting event after the reader pauses', async () => {
    const playback = stubPlayback();
    render(<ThemeSong />);
    fireEvent.click(toggle());
    await playback.start();
    fireEvent.click(toggle());

    fireEvent.waiting(audio());

    expect(audio().paused).toBe(true);
    expect(toggle()).toHaveAccessibleName(/^Play the theme song/);
    expect(note()).toHaveTextContent(TRACK_ARTIST);
    expect(equalizer()).toHaveAttribute('data-playing', 'false');
  });

  it('keeps a refused play retryable and reloads synchronously on the next gesture', async () => {
    const playback = stubPlayback();
    playback.play.mockRejectedValueOnce(new DOMException('Playback refused', 'NotAllowedError'));
    render(<ThemeSong />);

    fireEvent.click(toggle());
    await screen.findByText('track unavailable · try again');

    expect(toggle()).toHaveAccessibleName(
      `Retry the theme song, ${TRACK_TITLE} by ${TRACK_ARTIST}. Explicit content.`
    );
    expect(toggle()).toBeEnabled();
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(equalizer()).toHaveAttribute('data-playing', 'false');

    fireEvent.click(toggle());

    expect(playback.load).toHaveBeenCalledOnce();
    expect(playback.play).toHaveBeenCalledTimes(2);
    expect(playback.load.mock.invocationCallOrder[0]).toBeLessThan(
      playback.play.mock.invocationCallOrder[1]!
    );
    expect(note()).toHaveTextContent('loading audio');

    await playback.start();

    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(note()).toHaveTextContent('now playing');
  });

  it('allows retry after a media error interrupts an already playing track', async () => {
    const playback = stubPlayback();
    render(<ThemeSong />);
    fireEvent.click(toggle());
    await playback.start();

    playback.fail();

    expect(toggle()).toHaveTextContent('Retry');
    expect(toggle()).toBeEnabled();
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(note()).toHaveTextContent('track unavailable · try again');
    expect(equalizer()).toHaveAttribute('data-playing', 'false');

    fireEvent.click(toggle());
    expect(playback.load).toHaveBeenCalledOnce();
    expect(playback.play).toHaveBeenCalledTimes(2);
    await playback.start();

    expect(toggle()).toHaveAccessibleName(/^Pause the theme song/);
    expect(note()).toHaveTextContent('now playing');
  });

  it('preserves a media error when the browser subsequently emits pause', async () => {
    const playback = stubPlayback();
    render(<ThemeSong />);
    fireEvent.click(toggle());
    await playback.start();
    playback.fail();

    fireEvent.pause(audio());

    expect(audio().error).not.toBeNull();
    expect(toggle()).toHaveAccessibleName(/^Retry the theme song/);
    expect(toggle()).toBeEnabled();
    expect(note()).toHaveTextContent('track unavailable · try again');
    expect(equalizer()).toHaveAttribute('data-playing', 'false');

    fireEvent.click(toggle());

    expect(playback.load).toHaveBeenCalledOnce();
    expect(audio().error).toBeNull();
    expect(playback.play).toHaveBeenCalledTimes(2);
    expect(note()).toHaveTextContent('loading audio');
    await playback.start();
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
  });

  it.each(['loading', 'playing'] as const)(
    'pauses %s audio when the page unmounts and handles the pending cancellation',
    async (state) => {
      const playback = stubPlayback();
      const { unmount } = render(<ThemeSong />);
      const element = audio();
      fireEvent.click(toggle());
      if (state === 'playing') await playback.start();

      unmount();
      await playback.deliverAborts();

      expect(playback.pause).toHaveBeenCalledOnce();
      expect(element.paused).toBe(true);
      expect(screen.queryByRole('button', { name: /theme song/i })).not.toBeInTheDocument();
    }
  );
});
