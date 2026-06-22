'use client';

import { usePagination } from 'react-instantsearch';
import Button from '@/components/Button/Button';

interface PaginationProps {
  classNames?: {
    root?: string;
    list?: string;
    item?: string;
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
        <li className={classNames.item}>
          <Button
            variant="secondary"
            size="sm"
            className={classNames.button}
            onClick={go(currentRefinement - 1)}
            disabled={isFirstPage}
            aria-label="Previous page"
          >
            ←
          </Button>
        </li>
        {pages.map((page) => {
          const isActive = page === currentRefinement;
          return (
            <li key={page} className={classNames.item}>
              <Button
                variant={isActive ? 'primary' : 'secondary'}
                size="sm"
                className={classNames.button}
                data-state={isActive ? 'active' : undefined}
                aria-pressed={isActive}
                onClick={go(page)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${String(page + 1).padStart(2, '0')}`}
              >
                {String(page + 1).padStart(2, '0')}
              </Button>
            </li>
          );
        })}
        <li className={classNames.item}>
          <Button
            variant="secondary"
            size="sm"
            className={classNames.button}
            onClick={go(currentRefinement + 1)}
            disabled={isLastPage}
            aria-label="Next page"
          >
            →
          </Button>
        </li>
      </ul>
    </nav>
  );
}
