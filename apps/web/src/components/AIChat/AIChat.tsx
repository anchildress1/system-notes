'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AIChat.module.css';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "I'm here. I'm listening. I'm not judging (much)." },
    { role: 'bot', text: 'Ask me about the architecture, or why Ashley chose this font.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply }]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'I seem to be having trouble connecting to my brain. Must be a network glitch.',
        },
      ]);
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
              <div>
                <span className={styles.statusDot}></span>
                Ruckus
              </div>
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
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button className={styles.toggleButton} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '?'}
      </button>
    </div>
  );
}
