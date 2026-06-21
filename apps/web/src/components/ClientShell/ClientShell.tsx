'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/Header/Header';
import Masthead from '@/components/Masthead/Masthead';
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
      {/* Header + ticker live in the persistent shell so they don't remount
          (and the ticker doesn't jump back to the start) on navigation. */}
      <Header />
      <Masthead />
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
