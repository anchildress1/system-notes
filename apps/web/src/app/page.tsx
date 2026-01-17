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

      <section className={styles.introSection}>
        <p className={styles.introText}>
          A portfolio presented as a <span className={styles.highlight}>living system</span>.
          Intentionally unfinished. Like my laundry, but public.
          Replacing the static &quot;Hire Me&quot; site with a dynamic map of what I&apos;m actually breaking right now.
        </p>
      </section>

      <ProjectGrid />

      <AIChat />
    </main>
  );
}
