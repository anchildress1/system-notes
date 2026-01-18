import Header from '@/components/Header/Header';

import ProjectGrid from '@/components/ProjectGrid/ProjectGrid';
import AIChat from '@/components/AIChat/AIChat';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main} id="main-content">
      <Header />

      <ProjectGrid />

      <AIChat />
    </main>
  );
}
