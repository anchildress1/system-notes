import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import IndexWorkspaceLoader from '@/components/IndexWorkspace/IndexWorkspaceLoader';

// The workspace itself pulls in react-instantsearch and a live Algolia client.
// This suite is about which of the two surfaces renders, not about either one.
vi.mock('@/components/IndexWorkspace/IndexWorkspace', () => ({
  default: () => <div data-testid="workspace">The workspace</div>,
}));

describe('IndexWorkspaceLoader', () => {
  it('hands the workspace to a client that can run it', async () => {
    render(<IndexWorkspaceLoader fallback={<p>The filed notes</p>} />);

    expect(await screen.findByTestId('workspace')).toBeVisible();
  });

  it('drops the fallback once the workspace is up, rather than showing both', async () => {
    // Two copies of the corpus on one page is the failure the swap prevents.
    render(<IndexWorkspaceLoader fallback={<p>The filed notes</p>} />);
    await screen.findByTestId('workspace');

    expect(screen.queryByText('The filed notes')).not.toBeInTheDocument();
  });
});
