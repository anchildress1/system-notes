import { Metadata } from 'next';
import Hero from '@/components/Hero/Hero';
import SearchPageWrapper from '@/components/SearchPage/SearchPageWrapper';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Choices',
  description:
    'Search and explore facts, principles, and insights from my portfolio of system notes and projects.',
};

export default function Choices() {
  return (
    <main className={styles.main} id="main-content">
      <Hero
        title="This portfolio isn't browsed."
        titleAccent="It's"
        accentWord="retrieved."
        subtitle="Every decision, principle, and tradeoff I'd defend, in one index. Ask it anything."
      />
      <SearchPageWrapper />
    </main>
  );
}
