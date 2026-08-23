import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeSong, { TRACK_ARTIST, TRACK_SRC, TRACK_TITLE } from '@/components/ThemeSong/ThemeSong';

/**
 * jsdom implements no media pipeline: play() is absent and readyState never
 * advances. These stubs stand in for the element's own behavior so the
 * component's reaction to it can be asserted.
 */
function stubPlayback({ rejectWith }: { rejectWith?: Error } = {}) {
  const play = vi.fn(function (this: HTMLAudioElement) {
    if (rejectWith) return Promise.reject(rejectWith);
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  const pause = vi.fn(function (this: HTMLAudioElement) {
    this.dispatchEvent(new Event('pause'));
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
  return { play, pause };
}

const toggle = () => screen.getByRole('button', { name: /theme song/i });
const audio = () => screen.getByTestId('theme-song-audio') as HTMLAudioElement;
const note = () => document.querySelector('[aria-live="polite"]') as HTMLElement;

describe('ThemeSong', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an idle, unpressed control naming the artist', () => {
    render(<ThemeSong />);

    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(toggle()).toBeEnabled();
    expect(note()).toHaveTextContent(TRACK_ARTIST);
    expect(audio()).toHaveAttribute('src', TRACK_SRC);
    // A 9 MB track must not be fetched until someone asks for it.
    expect(audio()).toHaveAttribute('preload', 'none');
  });

  it('warns about explicit content in the control name, before it is pressed', () => {
    render(<ThemeSong />);

    // The panel that used to carry this warning is gone, and a warning that
    // arrives once the track is already playing is too late to be one.
    expect(toggle()).toHaveAccessibleName(
      new RegExp(`Play the theme song, ${TRACK_TITLE} by ${TRACK_ARTIST}\\. Explicit content\\.`)
    );
  });

  it('plays and announces on activation', () => {
    stubPlayback();
    render(<ThemeSong />);

    fireEvent.click(toggle());

    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(note()).toHaveTextContent('now playing');
  });

  it('pauses on a second activation', () => {
    stubPlayback();
    render(<ThemeSong />);

    fireEvent.click(toggle());
    fireEvent.click(toggle());

    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(note()).toHaveTextContent(TRACK_ARTIST);
  });

  it('never claims to be playing when play() is refused', async () => {
    // aria-pressed follows the audio element's own events, not the click, so a
    // refused autoplay cannot leave the control asserting something untrue.
    stubPlayback({ rejectWith: new Error('NotAllowedError') });
    render(<ThemeSong />);

    fireEvent.click(toggle());
    await screen.findByText('track unavailable');

    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables itself when the media element errors', () => {
    render(<ThemeSong />);

    fireEvent.error(audio());

    expect(toggle()).toBeDisabled();
    expect(toggle()).toHaveAccessibleName('Theme song unavailable');
    expect(note()).toHaveTextContent('track unavailable');
  });

  it('runs the equalizer only while the track does, and hides it from readers', () => {
    stubPlayback();
    const { container } = render(<ThemeSong />);
    const equalizer = container.querySelector('[aria-hidden="true"][data-playing]');

    expect(equalizer).toHaveAttribute('data-playing', 'false');

    fireEvent.click(toggle());

    expect(equalizer).toHaveAttribute('data-playing', 'true');
  });

  it('pauses the track when it leaves the page', () => {
    const { pause } = stubPlayback();
    const { unmount } = render(<ThemeSong />);

    fireEvent.click(toggle());
    unmount();

    expect(pause).toHaveBeenCalled();
  });
});
