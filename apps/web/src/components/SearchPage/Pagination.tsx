'use client';

import { usePagination } from 'react-instantsearch';

interface PaginationProps {
  classNames?: {
    root?: string;
    list?: string;
    item?: string;
    itemActive?: string;
    itemDisabled?: string;
    button?: string;
  };
}

export default function Pagination({ classNames = {} }: Readonly<PaginationProps>) {
  const { pages, currentRefinement, nbPages, isFirstPage, isLastPage, refine } = usePagination({
    padding: 2,
  });

  if (nbPages <= 1) return null;

  const go = (page: number) => () => refine(page);

  return (
    <nav className={classNames.root} aria-label="Pagination">
      <ul className={classNames.list}>
        <li
          className={`${classNames.item ?? ''} ${isFirstPage ? (classNames.itemDisabled ?? '') : ''}`}
        >
          <button
            type="button"
            className={classNames.button}
            onClick={go(currentRefinement - 1)}
            disabled={isFirstPage}
            aria-label="Previous page"
          >
            ←
          </button>
        </li>
        {pages.map((page) => {
          const isActive = page === currentRefinement;
          return (
            <li
              key={page}
              className={`${classNames.item ?? ''} ${isActive ? (classNames.itemActive ?? '') : ''}`}
            >
              <button
                type="button"
                className={classNames.button}
                onClick={go(page)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${page + 1}`}
              >
                {String(page + 1).padStart(2, '0')}
              </button>
            </li>
          );
        })}
        <li
          className={`${classNames.item ?? ''} ${isLastPage ? (classNames.itemDisabled ?? '') : ''}`}
        >
          <button
            type="button"
            className={classNames.button}
            onClick={go(currentRefinement + 1)}
            disabled={isLastPage}
            aria-label="Next page"
          >
            →
          </button>
        </li>
      </ul>
    </nav>
  );
}
