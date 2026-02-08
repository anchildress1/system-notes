'use client';

import dynamic from 'next/dynamic';
import BackgroundMusic from '@/components/BackgroundMusic/BackgroundMusic';
import Footer from '@/components/Footer/Footer';
import styles from './ClientShell.module.css';

const GlitterBomb = dynamic(() => import('@/components/GlitterBomb/GlitterBomb'), {
  ssr: false,
});
const AIChat = dynamic(() => import('@/components/AIChat/AIChat'), {
  ssr: false,
});

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className={styles.appRoot}>
        <div aria-hidden="true">
          <GlitterBomb />
        </div>
        <BackgroundMusic />
        {children}
        <Footer />
      </div>
      <AIChat />
    </>
  );
}
