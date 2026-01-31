'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { LuBrain } from 'react-icons/lu';
import styles from './AIChat.module.css';
import { useChat as useUI } from '@/context/ChatContext';
import MusicPlayer from '../MusicPlayer/MusicPlayer';
import ReactMarkdown from 'react-markdown';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { InstantSearch, useChat as useAlgoliaChat, Configure } from 'react-instantsearch';
import { getOrCreateUserToken } from '@/utils/userToken';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ''
);

const AGENT_ID = process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID || 'ruckus_agent';

function ChatContent() {
  const { messages, status, sendMessage } = useAlgoliaChat({ agentId: AGENT_ID });
  const [userToken] = useState(() => getOrCreateUserToken());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = status === 'streaming' || status === 'submitted';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount and when loading finishes
  useEffect(() => {
    if (!isLoading) {
      // Timeout ensures the disabled attribute is fully removed from DOM before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSend = () => {
    const input = inputRef.current?.value;
    if (!input?.trim()) return;
    sendMessage({ text: input }); // Use object with text property
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to extract text from message parts
  interface MessagePart {
    type: string;
    text?: string;
  }

  interface ChatMessage {
    content?: string;
    parts?: MessagePart[];
  }

  const getMessageText = (msg: unknown) => {
    const message = msg as ChatMessage;
    if (message.content) return message.content;
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('');
    }
    return '';
  };

  return (
    <>
      <Configure userToken={userToken} clickAnalytics />
      <div className={styles.header}>
        <span className={styles.ruckusName}>Ruckus 2.0</span>
        <span className={styles.agentMeta}>powered by algolia</span>
      </div>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={`${styles.message} ${styles.botMessage}`}>
            I&apos;m here. I&apos;m listening. Ask me anything about Ashley&apos;s work or
            philosophy.
          </div>
        )}
        {messages.map((msg) => {
          const text = getMessageText(msg);
          if (!text) return null;
          return (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.botMessage}`}
            >
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => {
                    const isInternal =
                      href?.startsWith('/') || href?.startsWith(window.location.origin);
                    if (isInternal && href) {
                      return (
                        <a
                          href={href}
                          onClick={(_e) => {
                            // Let the browser handle the navigation, but don't close the chat
                            // Actually, Next.js 'Link' or router push is better but we are inside Markdown
                            // Standard <a> will cause full reload.
                            // We should use next/router or window.location if we want full reload (which preserves state now)
                            // or preventDefault and use router.push for SPA nav (preferred).
                            // BUT, the user said "link is broken and agent is not opening on the same page"
                            // If we use standard <a>, it reloads. Since we persist isOpen now, it will reopen.
                            // However, SPA nav is smoother.
                            // Let's use standard anchor behavior because we fixed persistence.
                            // The user's issue was likely that the reload *closed* the chat.
                            // Now that we persist isOpen, a reload is fine, but SPA is better.
                            // Let's stick to standard behavior for simplicity/robustness first.
                          }}
                        >
                          {children}
                        </a>
                      );
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          );
        })}
        {isLoading && <div className={`${styles.message} ${styles.botMessage}`}>Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          className={styles.input}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="Chat message"
        />
        <button
          onClick={handleSend}
          className={styles.sendButton}
          aria-label="Send"
          disabled={isLoading}
        >
          <Send size={18} />
        </button>
      </div>
    </>
  );
}

export default function AIChat() {
  const { isOpen, toggleChat } = useUI();

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
            <InstantSearch searchClient={searchClient} indexName="projects">
              {/* Configure removed to prevent auto-search on 404 index */}
              <ChatContent />
            </InstantSearch>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.controlsRow}>
        <MusicPlayer />

        <button
          className={`${styles.toggleButton} ${isOpen ? styles.stopPulse : ''}`}
          onClick={toggleChat}
          aria-label={isOpen ? 'Close AI Chat' : 'Open AI Chat'}
          data-testid="ai-chat-toggle"
        >
          {isOpen ? '✕' : <LuBrain size={24} />}
        </button>
      </div>
    </div>
  );
}
