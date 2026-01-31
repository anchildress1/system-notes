import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BackgroundMusic from './BackgroundMusic';

describe('BackgroundMusic', () => {
  it('renders nothing (temporarily disabled)', () => {
    const { container } = render(<BackgroundMusic />);
    expect(container).toBeEmptyDOMElement();
  });
});
