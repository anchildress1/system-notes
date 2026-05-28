import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Nebula from './Nebula';

describe('Nebula', () => {
  it('renders a decorative, aria-hidden background', () => {
    const { getByTestId } = render(<Nebula />);
    const nebula = getByTestId('nebula');
    expect(nebula).toBeInTheDocument();
    expect(nebula).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the three accent blobs plus grain and vignette layers', () => {
    const { getByTestId } = render(<Nebula />);
    // 3 blobs + grain + vignette = 5 decorative layers
    expect(getByTestId('nebula').querySelectorAll('div')).toHaveLength(5);
  });
});
