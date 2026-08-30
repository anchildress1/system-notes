import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import IndexWorkspaceLoader from '@/components/IndexWorkspace/IndexWorkspaceLoader';

// The workspace itself pulls in react-instantsearch and a live Algolia client.
// This suite is about which of the two surfaces renders, not about either one.
const resolveWorkspace = vi.hoisted(() => ({ current: () => {} }));

vi.mock('@/components/IndexWorkspace/IndexWorkspace', async () => {
  // Held until the test releases it, so the window between hydration and the
  // chunk arriving is a state this suite can actually assert on.
  await new Promise<void>((resolve) => {
    resolveWorkspace.current = resolve;
  });
  return { default: () => <div data-testid="workspace">The workspace</div> };
});

describe('IndexWorkspaceLoader', () => {
  it('holds the fallback while the workspace chunk is still downloading', async () => {
    // Dropping it the moment hydration flips left the notes in a blank section
    // for the length of the chunk request, and gone for good if it never landed.
    render(<IndexWorkspaceLoader fallback={<p>The filed notes</p>} />);

    expect(await screen.findByText('The filed notes')).toBeVisible();
    expect(screen.queryByTestId('workspace')).not.toBeInTheDocument();
  });

  it('swaps to the workspace once the chunk resolves, without showing both', async () => {
    render(<IndexWorkspaceLoader fallback={<p>The filed notes</p>} />);
    resolveWorkspace.current();

    expect(await screen.findByTestId('workspace')).toBeVisible();
    expect(screen.queryByText('The filed notes')).not.toBeInTheDocument();
  });
});
