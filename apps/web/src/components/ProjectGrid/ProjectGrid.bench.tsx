import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import ProjectGrid from './ProjectGrid';

describe('ProjectGrid Performance', () => {
  bench(
    'render ProjectGrid',
    () => {
      render(<ProjectGrid />);
    },
    {
      time: 100, // run for 100ms
      iterations: 10,
    }
  );
});
