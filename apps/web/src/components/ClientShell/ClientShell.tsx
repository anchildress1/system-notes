'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import BackgroundMusic from '@/components/BackgroundMusic/BackgroundMusic';
import Footer from '@/components/Footer/Footer';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import styles from './ClientShell.module.css';

const GlitterBomb = dynamic(() => import('@/components/GlitterBomb/GlitterBomb'), {
  ssr: false,
});
const AIChat = dynamic(() => import('@/components/AIChat/AIChat'), {
  ssr: false,
});

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [shouldLoadChat, setShouldLoadChat] = useState(false);

  useEffect(() => {
    // Delay chat loading to prioritize LCP/TBT
    const timer = setTimeout(() => {
      setShouldLoadChat(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div aria-hidden="true">
        <GlitterBomb />
      </div>
      <BackgroundMusic />
      {children}
      <div className={styles.floatingControls}>
        <ErrorBoundary fallback={null}>{shouldLoadChat && <AIChat />}</ErrorBoundary>
      </div>
      <Footer />
    </>
  );
}
