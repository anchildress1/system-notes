import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from './Pagination';
import { usePagination } from 'react-instantsearch';

const mockRefine = vi.fn();

vi.mock('react-instantsearch', () => ({
  usePagination: vi.fn(),
}));

const baseState = {
  pages: [0, 1, 2, 3, 4],
  currentRefinement: 2,
  nbPages: 10,
  isFirstPage: false,
  isLastPage: false,
  refine: mockRefine,
  createURL: vi.fn(),
  canRefine: true,
  nbHits: 100,
};

describe('Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePagination).mockReturnValue(baseState as never);
  });

  it('renders nothing when nbPages <= 1', () => {
    vi.mocked(usePagination).mockReturnValue({ ...baseState, nbPages: 1 } as never);
    const { container } = render(<Pagination />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one button per page plus prev/next', () => {
    render(<Pagination />);
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 5')).toBeInTheDocument();
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination />);
    expect(screen.getByLabelText('Page 3')).toHaveAttribute('aria-current', 'page');
  });

  it('calls refine with the target page on click', () => {
    render(<Pagination />);
    fireEvent.click(screen.getByLabelText('Page 5'));
    expect(mockRefine).toHaveBeenCalledWith(4);
  });

  it('disables the previous button on the first page', () => {
    vi.mocked(usePagination).mockReturnValue({
      ...baseState,
      currentRefinement: 0,
      isFirstPage: true,
    } as never);
    render(<Pagination />);
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('disables the next button on the last page', () => {
    vi.mocked(usePagination).mockReturnValue({
      ...baseState,
      currentRefinement: 9,
      isLastPage: true,
    } as never);
    render(<Pagination />);
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });

  it('applies custom classNames', () => {
    const { container } = render(
      <Pagination
        classNames={{
          root: 'nav-root',
          list: 'nav-list',
          item: 'nav-item',
          itemActive: 'nav-active',
          button: 'nav-btn',
        }}
      />
    );
    expect(container.querySelector('.nav-root')).toBeInTheDocument();
    expect(container.querySelector('.nav-list')).toBeInTheDocument();
    expect(container.querySelectorAll('.nav-item').length).toBeGreaterThan(0);
    expect(container.querySelector('.nav-active')).toBeInTheDocument();
    expect(container.querySelectorAll('.nav-btn').length).toBeGreaterThan(0);
  });
});
