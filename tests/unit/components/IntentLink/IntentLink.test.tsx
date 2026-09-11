import { fireEvent, render, screen } from '@testing-library/react';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntentLink from '@/components/IntentLink/IntentLink';

vi.mock('next/link', () => ({
  default: vi.fn(({ href, prefetch: _prefetch, ...props }: ComponentProps<typeof Link>) => (
    <a href={typeof href === 'string' ? href : (href.pathname ?? undefined)} {...props} />
  )),
}));

function prefetchFor(href: string) {
  return vi.mocked(Link).mock.calls.findLast(([props]) => props.href === href)?.[0].prefetch;
}

beforeEach(() => {
  vi.mocked(Link).mockClear();
});

describe('IntentLink', () => {
  it('renders the link content and attributes without scheduling prefetch on mount', () => {
    render(
      <IntentLink href="/projects#featured" className="project-link" aria-current="page">
        <span>Selected work</span>
      </IntentLink>
    );

    const link = screen.getByRole('link', { name: 'Selected work' });
    expect(link).toHaveAttribute('href', '/projects#featured');
    expect(link).toHaveClass('project-link');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Selected work').parentElement).toBe(link);
    expect(prefetchFor('/projects#featured')).toBe(false);
  });

  it.each(['pointer', 'focus'] as const)(
    'restores Next prefetch after %s intent and keeps it enabled when intent leaves',
    (intent) => {
      render(<IntentLink href="/about">About Ashley</IntentLink>);
      const link = screen.getByRole('link', { name: 'About Ashley' });
      expect(prefetchFor('/about')).toBe(false);

      if (intent === 'pointer') fireEvent.pointerEnter(link);
      else fireEvent.focus(link);

      expect(prefetchFor('/about')).toBeNull();
      expect(link).toHaveAttribute('href', '/about');
      if (intent === 'pointer') fireEvent.pointerLeave(link);
      else fireEvent.blur(link);
      expect(prefetchFor('/about')).toBeNull();
    }
  );

  it('activates only the link receiving intent', () => {
    render(
      <>
        <IntentLink href="/about">About Ashley</IntentLink>
        <IntentLink href="/projects">Selected work</IntentLink>
      </>
    );
    const about = screen.getByRole('link', { name: 'About Ashley' });
    const projects = screen.getByRole('link', { name: 'Selected work' });

    fireEvent.pointerEnter(about);

    expect(prefetchFor('/about')).toBeNull();
    expect(prefetchFor('/projects')).toBe(false);
    expect(projects).toHaveAttribute('href', '/projects');
    fireEvent.focus(projects);
    expect(prefetchFor('/projects')).toBeNull();
    expect(prefetchFor('/about')).toBeNull();
  });

  it('preserves updated link props without enabling prefetch during a parent render', () => {
    const { rerender } = render(<IntentLink href="/about">About Ashley</IntentLink>);

    rerender(
      <IntentLink href="/projects" className="selected" aria-current="page">
        Selected work
      </IntentLink>
    );

    const link = screen.getByRole('link', { name: 'Selected work' });
    expect(link).toHaveAttribute('href', '/projects');
    expect(link).toHaveClass('selected');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(prefetchFor('/projects')).toBe(false);
    fireEvent.focus(link);
    expect(prefetchFor('/projects')).toBeNull();
    expect(link).toHaveAttribute('aria-current', 'page');
  });
});
