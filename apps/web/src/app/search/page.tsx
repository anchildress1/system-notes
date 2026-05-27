import Header from '@/components/Header/Header';
import Masthead from '@/components/Masthead/Masthead';
import SearchPageWrapper from '@/components/SearchPage/SearchPageWrapper';

export const metadata = {
  title: 'Choices',
  description: 'Search across all system notes and facts.',
};

export default function Page() {
  return (
    <main id="main-content">
      <Header />
      <Masthead />
      <SearchPageWrapper />
    </main>
  );
}
