import { describe, it, expect, vi } from 'vitest';
import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import GlobalError from './global-error';

type ElementProps = {
  children?: ReactNode;
  onClick?: () => void;
};

describe('GlobalError', () => {
  function renderGlobalError(
    props: ComponentProps<typeof GlobalError>
  ): ReactElement<ElementProps> {
    const page = GlobalError(props);
    if (!isValidElement<ElementProps>(page)) {
      throw new TypeError('GlobalError must return a React element.');
    }
    return page;
  }

  function textContent(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node);
    }
    if (Array.isArray(node)) {
      return node.map(textContent).join('');
    }
    if (isValidElement<ElementProps>(node)) {
      return textContent(node.props.children);
    }
    return '';
  }

  function findElement(node: ReactNode, type: string): ReactElement<ElementProps> | null {
    if (Array.isArray(node)) {
      for (const child of node) {
        const match = findElement(child, type);
        if (match) return match;
      }
      return null;
    }
    if (!isValidElement<ElementProps>(node)) {
      return null;
    }
    if (node.type === type) {
      return node;
    }
    return findElement(node.props.children, type);
  }

  function bodyOf(page: ReactElement<ElementProps>): ReactElement<ElementProps> {
    const body = Children.only(page.props.children);
    if (!isValidElement<ElementProps>(body)) {
      throw new TypeError('GlobalError must render one body element.');
    }
    return body;
  }

  it('renders heading and generic message when no digest', () => {
    const error = new Error('boom');
    const body = bodyOf(renderGlobalError({ error, reset: vi.fn() }));

    expect(textContent(body)).toContain('Something went wrong');
    expect(textContent(body)).toContain('An unexpected error occurred.');
  });

  it('renders error digest when present', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });
    const body = bodyOf(renderGlobalError({ error, reset: vi.fn() }));

    expect(textContent(body)).toContain('An unexpected error occurred (abc123).');
  });

  it('calls reset when Try again button is clicked', () => {
    const reset = vi.fn();
    const body = bodyOf(renderGlobalError({ error: new Error('boom'), reset }));
    const button = findElement(body, 'button');

    expect(button).not.toBeNull();
    expect(textContent(button)).toBe('Try again');
    button?.props.onClick?.();
    expect(reset).toHaveBeenCalledOnce();
  });
});
