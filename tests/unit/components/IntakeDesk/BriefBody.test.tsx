import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BriefBody, { briefToPlainText } from '@/components/IntakeDesk/BriefBody';
import { profile } from '@/data/profile';

const QUESTION = 'What have you shipped?';
const LINKEDIN = profile.links.find((link) => link.label === 'LinkedIn')!.href;

const clipboard = { writeText: vi.fn() };

describe('briefToPlainText', () => {
  it('keeps the question, then the paragraphs, and follows an allowed citation', () => {
    const answer = `First paragraph.\n\nReach me on [LinkedIn](${LINKEDIN}).`;

    expect(briefToPlainText(QUESTION, answer)).toBe(
      `${QUESTION}\n\nFirst paragraph.\n\nReach me on LinkedIn (${LINKEDIN}).`
    );
  });

  it('keeps the label and drops a citation the renderer would not follow', () => {
    expect(briefToPlainText(QUESTION, 'See [elsewhere](https://example.com).')).toBe(
      `${QUESTION}\n\nSee elsewhere.`
    );
  });
});

describe('BriefBody copy action', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clipboard.writeText.mockReset();
    clipboard.writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  const renderBrief = (answer = 'I have shipped that.') =>
    render(<BriefBody question={QUESTION} answer={answer} />);

  const copyButton = () => screen.getByRole('button', { name: 'Copy the brief' });

  it('writes the brief as plain text to the clipboard', async () => {
    const answer = `Done.\n\nMore at [LinkedIn](${LINKEDIN}) and [elsewhere](https://example.com).`;
    renderBrief(answer);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy the brief/i }));
    });

    expect(clipboard.writeText).toHaveBeenCalledWith(
      `${QUESTION}\n\nDone.\n\nMore at LinkedIn (${LINKEDIN}) and elsewhere.`
    );
  });

  it('reads Copied after a successful write, then reverts', async () => {
    renderBrief();

    await act(async () => {
      fireEvent.click(copyButton());
    });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(copyButton()).toBeVisible();
  });

  it('reads Could not copy when the write rejects, then reverts', async () => {
    clipboard.writeText.mockRejectedValueOnce(new Error('denied'));
    renderBrief();

    await act(async () => {
      fireEvent.click(copyButton());
    });
    expect(screen.getByRole('button', { name: 'Could not copy' })).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(copyButton()).toBeVisible();
  });
});
