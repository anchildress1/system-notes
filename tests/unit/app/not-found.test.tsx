import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFoundPage from '@/app/not-found';

describe('NotFoundPage', () => {
  it('keeps the redesign shell and skip-link target on missing routes', () => {
    const { container } = render(<NotFoundPage />);

    expect(container.querySelector('main#main-content')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /This trail ends without a note/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Search the index/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Browse projects/i })).toHaveAttribute(
      'href',
      '/projects'
    );
  });
});
