'use client';

import dynamic from 'next/dynamic';

const SearchPage = dynamic(() => import('./SearchPage'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '150px 20px', textAlign: 'center', color: 'hsl(225 20% 60%)' }}>
      Loading search...
    </div>
  ),
});

export default function SearchPageWrapper() {
  return <SearchPage />;
}
