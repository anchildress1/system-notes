import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FactsHero from './FactsHero';

vi.mock('@/hooks/useSparkles', () => ({
  useSparkles: vi.fn(),
}));

describe('FactsHero', () => {
  it('renders title and subtitle', () => {
    render(<FactsHero />);
    expect(screen.getByText('Decisions on record')).toBeInTheDocument();
    expect(screen.getByText('so you can audit me')).toBeInTheDocument();
  });

  it('dispatches glitter event on click', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    render(<FactsHero />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'trigger-glitter-bomb' })
    );
    dispatchSpy.mockRestore();
  });

  it.each([
    { key: '{Enter}', label: 'Enter' },
    { key: ' ', label: 'Space' },
  ])('dispatches glitter event on $label key', async ({ key }) => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    render(<FactsHero />);

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard(key);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'trigger-glitter-bomb' })
    );
    dispatchSpy.mockRestore();
  });

  it('has accessible label', () => {
    render(<FactsHero />);
    expect(screen.getByLabelText('Click to trigger a glitter effect')).toBeInTheDocument();
  });
});
