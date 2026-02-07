'use client';

import dynamic from 'next/dynamic';

const SearchPage = dynamic(() => import('./SearchPage'), { ssr: false });

export default function SearchPageDynamic() {
  return <SearchPage />;
}
