import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import IndexLoadingShell from '@/components/IndexWorkspace/IndexLoadingShell';

describe('IndexLoadingShell', () => {
  it('announces the loading state as a status with a readable name', () => {
    render(<IndexLoadingShell />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading the index');
  });
});
