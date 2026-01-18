import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import ExpandedView from './ExpandedView';
import { allProjects } from '../../data/projects';

describe('ExpandedView Performance', () => {
  const project = allProjects[0];
  const noop = () => {};

  bench(
    'render ExpandedView',
    () => {
      render(<ExpandedView project={project} onClose={noop} />);
    },
    {
      time: 100,
      iterations: 10,
    }
  );
});
