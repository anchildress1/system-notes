import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChat from './AIChat';
import { ChatProvider } from '@/context/ChatContext';
import { API_URL } from '@/config';

// Mock MusicPlayer to avoid issues with audio APIs or unnecessary rendering
vi.mock('../MusicPlayer/MusicPlayer', () => ({
    default: () => <div data-testid="music-player-mock">Music Player</div>,
}));

// Mock scrollIntoView since it's not supported in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AIChat Integration', () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
        mockFetch.mockClear();
        // Default successful response
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ reply: 'I am a mock bot response.' }),
        } as Response);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderComponent = () => {
        return render(
            <ChatProvider>
                <AIChat />
            </ChatProvider>
        );
    };

    it('renders the toggle button initially', () => {
        renderComponent();
        expect(screen.getByLabelText('Open AI Chat')).toBeInTheDocument();
    });

    it('opens chat window when toggle button is clicked', async () => {
        renderComponent();
        const toggleBtn = screen.getByLabelText('Open AI Chat');
        fireEvent.click(toggleBtn);

        // Check for chat window elements
        expect(await screen.findByText('Ruckus')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('sends a message to the backend and displays the response', async () => {
        const user = userEvent.setup();
        renderComponent();

        // Open chat
        await user.click(screen.getByLabelText('Open AI Chat'));

        // Find input and type message
        const input = screen.getByPlaceholderText('Type a message...');
        await user.type(input, 'Hello world');

        // Click send
        const sendBtn = screen.getByLabelText('Send');
        await user.click(sendBtn);

        // Verify loading state (optional, might happen too fast)
        // expect(screen.getByText('Thinking...')).toBeInTheDocument();

        // Verify fetch call
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Hello world' }),
        });

        // Verify bot response appears
        await waitFor(() => {
            expect(screen.getByText('I am a mock bot response.')).toBeInTheDocument();
        });
    });

    it('handles backend errors gracefully', async () => {
        // Mock error response
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Internal Server Error' }),
        } as Response);

        const user = userEvent.setup();
        renderComponent();

        // Open chat
        await user.click(screen.getByLabelText('Open AI Chat'));

        // Send message
        const input = screen.getByPlaceholderText('Type a message...');
        await user.type(input, 'Trigger error');
        await user.click(screen.getByLabelText('Send'));

        // Verify error handling in UI
        await waitFor(() => {
            expect(screen.getByText(/seem to be having trouble connecting/i)).toBeInTheDocument();
        });
    });

    it('uses the configured API URL', () => {
        expect(API_URL).toBeDefined();
        // If running in test env, it might be localhost:8000 or from env
        // Just ensuring it's not empty is good enough for this check
        expect(API_URL).not.toBe('');
    });
});
