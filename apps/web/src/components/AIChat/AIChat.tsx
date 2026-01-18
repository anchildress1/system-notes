'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import styles from './AIChat.module.css';
import { API_URL } from '@/config';
import { useChat } from '@/context/ChatContext';

export default function AIChat() {
  const { isOpen, toggleChat, messages, addMessage, isLoading, setIsLoading } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', text: userMessage });
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Network response was not ok', response.status, errorData);
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      addMessage({ role: 'bot', text: data.reply });
    } catch (error) {
      console.error('Error fetching chat response:', error);
      addMessage({
        role: 'bot',
        text: 'I seem to be having trouble connecting to my brain. Must be a network glitch.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

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
                  {msg.text}
                </div>
              ))}
              {isLoading && (
                <div className={`${styles.message} ${styles.botMessage}`}>Thinking...</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className={styles.inputArea}>
              <input
                type="text"
                placeholder="Type a message..."
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                aria-label="Chat message"
              />
              <button onClick={handleSend} className={styles.sendButton} aria-label="Send">
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className={`${styles.toggleButton} ${isOpen ? styles.stopPulse : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close AI Chat' : 'Open AI Chat'}
      >
        {isOpen ? '✕' : '?'}
      </button>
    </div>
  );
}
