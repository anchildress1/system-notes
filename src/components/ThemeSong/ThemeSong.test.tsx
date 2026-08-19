import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeSong, { formatTime, TRACK_ARTIST, TRACK_SRC, TRACK_TITLE } from './ThemeSong';

/**
 * jsdom implements no media pipeline: play() is absent and readyState never
 * advances. These stubs stand in for the element's own behaviour so the
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

describe('formatTime', () => {
  it('formats whole and partial minutes', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(600)).toBe('10:00');
  });

  it('floors fractional seconds rather than rounding past the minute', () => {
    expect(formatTime(59.9)).toBe('0:59');
  });

  it('falls back for values a media element can genuinely report', () => {
    // duration is NaN until metadata loads, and Infinity for a live stream.
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatTime(-5)).toBe('0:00');
  });
});

describe('ThemeSong', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an idle, unpressed control that announces nothing', () => {
    stubPlayback();
    render(<ThemeSong />);

    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(toggle()).toBeEnabled();
    expect(screen.queryByText(TRACK_TITLE)).not.toBeInTheDocument();
    expect(screen.getByText('', { selector: '[aria-live="polite"]' })).toBeEmptyDOMElement();
  });

  it('never plays on its own', () => {
    const { play } = stubPlayback();
    render(<ThemeSong />);

    // No autoplay attribute, no play() at mount, and nothing pressed. The track
    // is explicit; it may only ever start because someone asked for it.
    expect(audio()).not.toHaveAttribute('autoplay');
    expect(audio().autoplay).toBe(false);
    expect(play).not.toHaveBeenCalled();
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
  });

  it('warns that the track is explicit before it can be started', () => {
    stubPlayback();
    render(<ThemeSong />);

    // The advisory has to be on the control, because the panel that repeats it
    // does not exist until the track is already playing.
    expect(toggle()).toHaveAccessibleName(/explicit content/i);
    expect(toggle().textContent).toContain('E');
    expect(screen.getByTitle('Explicit content')).toBeInTheDocument();
  });

  it('repeats the advisory in the panel once playing', async () => {
    stubPlayback();
    render(<ThemeSong />);

    fireEvent.click(toggle());
    await screen.findByText(TRACK_TITLE);

    expect(screen.getByText(new RegExp(`${TRACK_ARTIST} · explicit`))).toBeInTheDocument();
  });

  it('points at the track without downloading it up front', () => {
    stubPlayback();
    render(<ThemeSong />);

    // 9 MB on every page load is the reason preload is off.
    expect(audio()).toHaveAttribute('src', TRACK_SRC);
    expect(audio()).toHaveAttribute('preload', 'none');
  });

  it('plays, expands the panel, and announces on activation', async () => {
    const { play } = stubPlayback();
    render(<ThemeSong />);

    fireEvent.click(toggle());
    expect(play).toHaveBeenCalledOnce();

    expect(await screen.findByText(TRACK_TITLE)).toBeVisible();
    expect(screen.getByText(new RegExp(TRACK_ARTIST))).toBeVisible();
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('progressbar', { name: /progress/i })).toBeInTheDocument();
    expect(screen.getByText('Theme song playing')).toBeInTheDocument();
  });

  it('pauses and collapses the panel on a second activation', async () => {
    const { pause } = stubPlayback();
    render(<ThemeSong />);

    fireEvent.click(toggle());
    await screen.findByText(TRACK_TITLE);
    fireEvent.click(toggle());

    expect(pause).toHaveBeenCalledOnce();
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(TRACK_TITLE)).not.toBeInTheDocument();
  });

  it('reports the track ending without a further click', async () => {
    stubPlayback();
    render(<ThemeSong />);
    fireEvent.click(toggle());
    await screen.findByText(TRACK_TITLE);

    fireEvent.ended(audio());

    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(TRACK_TITLE)).not.toBeInTheDocument();
  });

  it('never claims to be playing when play() is refused', async () => {
    // Autoplay policy and decode failures both surface as a rejected play().
    stubPlayback({ rejectWith: new Error('NotAllowedError') });
    render(<ThemeSong />);

    fireEvent.click(toggle());

    expect(await screen.findByText('Theme song unavailable')).toBeInTheDocument();
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(toggle()).toBeDisabled();
    expect(screen.queryByText(TRACK_TITLE)).not.toBeInTheDocument();
  });

  it('disables itself when the media element errors', () => {
    stubPlayback();
    render(<ThemeSong />);

    fireEvent.error(audio());

    expect(toggle()).toBeDisabled();
    expect(toggle()).toHaveAccessibleName('Theme song unavailable');
    expect(screen.getByText('Theme song unavailable')).toBeInTheDocument();
  });

  it('holds progress at zero until a duration is known', async () => {
    stubPlayback();
    render(<ThemeSong />);
    fireEvent.click(toggle());
    await screen.findByText(TRACK_TITLE);

    // timeUpdate can fire before loadedmetadata; dividing by 0 must not render NaN.
    fireEvent.timeUpdate(audio(), { currentTarget: { currentTime: 5 } });

    expect(screen.getByRole('progressbar', { name: /progress/i })).toHaveValue(0);
    expect(screen.getByText(/0:00/)).toBeInTheDocument();
  });

  it('clamps progress when currentTime overruns the reported duration', async () => {
    stubPlayback();
    render(<ThemeSong />);
    fireEvent.click(toggle());
    await screen.findByText(TRACK_TITLE);

    const element = audio();
    Object.defineProperty(element, 'duration', { value: 100, configurable: true });
    fireEvent.loadedMetadata(element);
    Object.defineProperty(element, 'currentTime', { value: 250, configurable: true });
    fireEvent.timeUpdate(element);

    expect(screen.getByRole('progressbar', { name: /progress/i })).toHaveValue(100);
  });

  it('stops playback when it leaves the page', () => {
    const { pause } = stubPlayback();
    const view = render(<ThemeSong />);
    fireEvent.click(toggle());

    view.unmount();

    // Audio outliving the header across a route change is the failure here.
    expect(pause).toHaveBeenCalled();
  });
});
