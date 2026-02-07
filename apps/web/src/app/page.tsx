import { Metadata } from 'next';
import Header from '@/components/Header/Header';
import Hero from '@/components/Hero/Hero';
import SearchPageWrapper from '@/components/SearchPage/SearchPageWrapper';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Choices | System Notes',
  description:
    'Search and explore facts, principles, and insights from my portfolio of system notes and projects.',
};

export default function Home() {
  return (
    <main className={styles.main} id="main-content">
      <Header />
      <Hero title="This portfolio isn't browsed—" subtitle="It's retrieved." />
      <SearchPageWrapper />
    </main>
  );
}
