import { Metadata } from 'next';
import Hero from '@/components/Hero/Hero';
import SearchPageWrapper from '@/components/SearchPage/SearchPageWrapper';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Choices',
  description:
    'Search and explore facts, principles, and insights from my portfolio of system notes and projects.',
};

export default function Home() {
  return (
    <main className={styles.main} id="main-content">
      <Hero
        kicker="CWD · /sys/choices"
        title="This portfolio isn't browsed."
        titleAccent="It's"
        accentWord="retrieved."
        subtitle="An engineering portfolio you query, not scroll."
      />
      <SearchPageWrapper />
    </main>
  );
}
