import { Metadata } from 'next';
import Header from '@/components/Header/Header';
import SearchPageWrapper from '@/components/SearchPage/SearchPageWrapper';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Fact Index | System Notes',
  description:
    'Search and explore facts, principles, and insights from my portfolio of system notes and projects.',
};

export default function Search() {
  return (
    <main className={styles.main} id="main-content">
      <Header />
      <SearchPageWrapper />
    </main>
  );
}
