'use client';

import dynamic from 'next/dynamic';
import BackgroundMusic from '@/components/BackgroundMusic/BackgroundMusic';
import Footer from '@/components/Footer/Footer';

const GlitterBomb = dynamic(() => import('@/components/GlitterBomb/GlitterBomb'), {
  ssr: false,
});
const AIChat = dynamic(() => import('@/components/AIChat/AIChat'), {
  ssr: false,
});

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden="true">
        <GlitterBomb />
      </div>
      <BackgroundMusic />
      {children}
      <div className={styles.floatingControls}>
        <AIChat />
      </div>
      <Footer />
    </>
  );
}
