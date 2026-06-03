'use client';

import dynamic from 'next/dynamic';
import Footer from '@/components/Footer/Footer';
import styles from './ClientShell.module.css';

const AIChat = dynamic(() => import('@/components/AIChat/AIChat'), {
  ssr: false,
});

const MusicPlayer = dynamic(() => import('@/components/MusicPlayer/MusicPlayer'), {
  ssr: false,
});

const GlitterBomb = dynamic(() => import('@/components/GlitterBomb/GlitterBomb'), {
  ssr: false,
});

export default function ClientShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <div className={styles.appRoot}>
        {children}
        <Footer />
      </div>
      <AIChat />
      <MusicPlayer />
      <div aria-hidden="true">
        <GlitterBomb />
      </div>
    </>
  );
}
