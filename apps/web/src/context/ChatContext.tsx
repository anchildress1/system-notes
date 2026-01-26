'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

interface ChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  messages: Message[];
  addMessage: (msg: Message) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize state from sessionStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('chat_is_open');
      if (stored === 'true') {
        // We can safely ignore this warning because we are initializing state from storage
        // and this effect only runs once on mount. The alternative is to initialize state lazily,
        // but that causes hydration mismatch issues with Next.js SSR.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(true);
      }
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "I'm here. I'm listening. I'm not judging (much)." },
    { role: 'bot', text: 'Ask me about the architecture, or why Ashley chose this font.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => {
    setIsOpen((prev) => {
      const newState = !prev;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('chat_is_open', String(newState));
      }
      return newState;
    });
  };

  const addMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);

  return (
    <ChatContext.Provider
      value={{ isOpen, toggleChat, messages, addMessage, isLoading, setIsLoading }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
