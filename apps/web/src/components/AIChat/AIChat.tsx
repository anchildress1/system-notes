'use client';

import { useEffect, useState, useMemo } from 'react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Chat } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';
import styles from './AIChat.module.css';
import { API_URL } from '@/config';
import { useChat } from '@/context/ChatContext';
import MusicPlayer from '../MusicPlayer/MusicPlayer';
import ReactMarkdown from 'react-markdown';

export default function AIChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!AGENT_ID && process.env.NODE_ENV !== 'production') {
      console.warn(
        'AIChat: NEXT_PUBLIC_ALGOLIA_AGENT_ID is missing. Chat widget will be disabled.'
      );
    }
  }, []);

  // Memoize translations to prevent unnecessary re-renders of the Chat widget
  const translations = useMemo(
    () => ({
      header: {
        title: 'Ruckus 2.0',
      },
      toggleButtonTitle: 'Open AI Chat',
    }),
    []
  );

  useEffect(() => {
    // Accessibility fix: Inject aria-label into Algolia's Chat toggle button
    const observer = new MutationObserver(() => {
      if (typeof document === 'undefined') return;

      const chatWindow = document.querySelector('.ais-Chat-window');
      const isWindowOpen = !!chatWindow;
      setIsChatOpen((prev) => (prev === isWindowOpen ? prev : isWindowOpen));

      const toggleBtn = document.querySelector(
        '.ais-ChatToggleButton, .ais-Chat-toggleButton, [class*="ChatToggleButton"]'
      );
      if (toggleBtn) {
        if (!toggleBtn.hasAttribute('aria-label')) {
          toggleBtn.setAttribute('aria-label', 'Open AI Chat');
        }
        if (!toggleBtn.hasAttribute('data-testid')) {
          toggleBtn.setAttribute('data-testid', 'ai-chat-toggle');
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  if (!AGENT_ID) {
    return (
      <div className={styles.musicWrapper}>
        <MusicPlayer />
      </div>
    );
  }

  return (
    <div className={styles.chatWrapper}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.chatWindow}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className={styles.header}>
              <span className={styles.ruckusName}>Ruckus</span>
              <span className={styles.agentMeta}>no memory yet</span>
            </div>
            <div className={styles.messages}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${msg.role === 'bot' ? styles.botMessage : styles.userMessage}`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ))}
              {isLoading && (
                <div className={`${styles.message} ${styles.botMessage}`}>Thinking...</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className={styles.inputArea}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Chat message"
              />
              <button onClick={handleSend} className={styles.sendButton} aria-label="Send">
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MusicPlayer />

      <button
        className={`${styles.toggleButton} ${isOpen ? styles.stopPulse : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close AI Chat' : 'Open AI Chat'}
        data-testid="ai-chat-toggle"
      >
        <Chat
          agentId={AGENT_ID}
          translations={translations}
          headerTitleIconComponent={HeaderIcon}
          assistantMessageLeadingComponent={AssistantAvatar}
          userMessageLeadingComponent={UserAvatar}
          promptFooterComponent={PromptFooter}
          toggleButtonIconComponent={ToggleIcon}
        />
      </InstantSearchNext>
    </>
  );
}
