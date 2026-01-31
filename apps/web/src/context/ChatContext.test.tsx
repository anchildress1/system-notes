import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatProvider, useChat } from './ChatContext';

const TestComponent = () => {
  const { isOpen, toggleChat, messages, addMessage } = useChat();

  return (
    <div>
      <div data-testid="is-open">{isOpen.toString()}</div>
      <button onClick={toggleChat}>Toggle</button>
      <div data-testid="message-count">{messages.length}</div>
      <button onClick={() => addMessage({ role: 'user', text: 'Hello' })}>Add Message</button>
    </div>
  );
};

describe('ChatContext', () => {
  it('provides initial state', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    // Initial messages are 2
    expect(screen.getByTestId('message-count')).toHaveTextContent('2');
  });

  it('toggles chat open state', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    const toggleBtn = screen.getByText('Toggle');
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });

  it('adds messages', () => {
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    const addBtn = screen.getByText('Add Message');
    fireEvent.click(addBtn);
    expect(screen.getByTestId('message-count')).toHaveTextContent('3');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test as React will log the error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useChat());
    }).toThrow('useChat must be used within a ChatProvider');

    consoleSpy.mockRestore();
  });
});
