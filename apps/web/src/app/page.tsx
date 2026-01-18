import Header from '@/components/Header/Header';
import Hero from '@/components/Hero/Hero';

import ProjectGrid from '@/components/ProjectGrid/ProjectGrid';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main} id="main-content">
      <Header />
      <Hero />
      <ProjectGrid />
    </main>
  );
}
