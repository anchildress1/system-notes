'use client';

import dynamic from 'next/dynamic';
import BackgroundMusic from '@/components/BackgroundMusic/BackgroundMusic';
import Footer from '@/components/Footer/Footer';
import { ChatProvider } from '@/context/ChatContext';

const GlitterBomb = dynamic(() => import('@/components/GlitterBomb/GlitterBomb'), {
  ssr: false,
});
const AIChat = dynamic(() => import('@/components/AIChat/AIChat'), {
  ssr: false,
});

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <div aria-hidden="true">
        <GlitterBomb />
      </div>
      <BackgroundMusic />
      {children}
      <AIChat />
      <Footer />
    </ChatProvider>
  );
}
