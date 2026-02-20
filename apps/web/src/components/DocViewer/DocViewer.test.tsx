import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DocViewer from './DocViewer';

describe('DocViewer', () => {
  beforeEach(() => {
    // Reset hash
    window.location.hash = '';
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders lines with line numbers', () => {
    render(<DocViewer content={'line one\nline two\nline three'} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('line one')).toBeInTheDocument();
    expect(screen.getByText('line three')).toBeInTheDocument();
  });

  it('highlights a single line from hash', () => {
    window.location.hash = '#L2';
    const { container } = render(<DocViewer content={'a\nb\nc'} />);
    const lines = container.querySelectorAll('[id]');
    // L2 should have highlighted class
    const l2 = container.querySelector('#L2');
    expect(l2?.className).toContain('highlighted');
    const l1 = container.querySelector('#L1');
    expect(l1?.className).not.toContain('highlighted');
  });

  it('highlights a range of lines from hash', () => {
    window.location.hash = '#L1-L3';
    const { container } = render(<DocViewer content={'a\nb\nc\nd'} />);
    expect(container.querySelector('#L1')?.className).toContain('highlighted');
    expect(container.querySelector('#L2')?.className).toContain('highlighted');
    expect(container.querySelector('#L3')?.className).toContain('highlighted');
    expect(container.querySelector('#L4')?.className).not.toContain('highlighted');
  });

  it('handles CRLF line endings', () => {
    render(<DocViewer content={'line1\r\nline2\r\nline3'} />);
    expect(screen.getByText('line1')).toBeInTheDocument();
    expect(screen.getByText('line2')).toBeInTheDocument();
    expect(screen.getByText('line3')).toBeInTheDocument();
  });

  it('renders a single empty line for empty content', () => {
    const { container } = render(<DocViewer content="" />);
    // Empty content splits to [''] => 1 line
    const lines = container.querySelectorAll('[id^="L"]');
    expect(lines.length).toBe(1);
  });

  it('does not highlight with invalid hash', () => {
    window.location.hash = '#invalid';
    const { container } = render(<DocViewer content={'a\nb'} />);
    expect(container.querySelector('#L1')?.className).not.toContain('highlighted');
    expect(container.querySelector('#L2')?.className).not.toContain('highlighted');
  });
});
