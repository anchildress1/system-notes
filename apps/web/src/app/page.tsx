import Header from '@/components/Header/Header';
import SocialBanner from '@/components/SocialBanner/SocialBanner';
import ProjectGrid from '@/components/ProjectGrid/ProjectGrid';
import AIChat from '@/components/AIChat/AIChat';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <Header />

      <SocialBanner />

      {/* Intro section removed as it is now centralized in SocialBanner */}

      <ProjectGrid />

      <AIChat />
    </main>
  );
}
