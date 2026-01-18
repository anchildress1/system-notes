'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "I'm here. I'm listening. I'm not judging (much)." },
    { role: 'bot', text: 'Ask me about the architecture, or why Ashley chose this font.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => setIsOpen((prev) => !prev);
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
