import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import ExpandedView from './ExpandedView';
import { mockProject } from '@/test-utils/fixtures';

describe('ExpandedView Performance', () => {
  const noop = () => {};

  bench(
    'render ExpandedView',
    () => {
      render(
        <ExpandedView project={mockProject} onClose={noop} isOpen={true} onExitComplete={noop} />
      );
    },
    {
      time: 100,
      iterations: 10,
    }
  );
});
