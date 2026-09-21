import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Generate an array of page numbers and ellipsis strings for smart pagination.
 * e.g., [1, '...', 4, 5, 6, '...', 20]
 */
function getPageRange(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= maxVisible + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(2, currentPage - half);
  let end = Math.min(totalPages - 1, currentPage + half);

  if (currentPage <= half + 2) {
    start = 2;
    end = Math.min(totalPages - 1, maxVisible);
  } else if (currentPage >= totalPages - half - 1) {
    start = Math.max(2, totalPages - maxVisible + 1);
    end = totalPages - 1;
  }

  pages.push(1);
  if (start > 2) {
    pages.push('ellipsis-start');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) {
    pages.push('ellipsis-end');
  }
  pages.push(totalPages);

  return pages;
}

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'items',
  scrollToTop = true,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  const handlePageClick = (page) => {
    if (page < 1 || page > totalPages || page === validCurrentPage) return;
    if (onPageChange) {
      onPageChange(page);
    }
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
    if (onPageChange) {
      onPageChange(1);
    }
  };

  if (totalItems <= 0) return null;

  const pageRange = getPageRange(validCurrentPage, totalPages);

  return (
    <div className={`pagination-container ${className}`}>
      {/* Summary info */}
      <div className="pagination-info">
        <span>
          Showing <strong>{startItem.toLocaleString('en-IN')}</strong>–<strong>{endItem.toLocaleString('en-IN')}</strong> of{' '}
          <strong>{totalItems.toLocaleString('en-IN')}</strong> {itemLabel}
        </span>
      </div>

      {/* Center: Page Controls */}
      <div className="pagination-controls" role="navigation" aria-label="Pagination">
        {/* Jump First */}
        <button
          type="button"
          onClick={() => handlePageClick(1)}
          disabled={validCurrentPage === 1}
          className="pagination-btn pagination-nav-btn"
          title="First Page"
          aria-label="Go to first page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          onClick={() => handlePageClick(validCurrentPage - 1)}
          disabled={validCurrentPage === 1}
          className="pagination-btn pagination-nav-btn"
          title="Previous Page"
          aria-label="Go to previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Number Buttons */}
        <div className="pagination-pages-group">
          {pageRange.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis" aria-hidden="true">
                  •••
                </span>
              );
            }

            const isActive = p === validCurrentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => handlePageClick(p)}
                className={`pagination-btn pagination-page-btn${isActive ? ' active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${p}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activePaginationPill"
                    className="pagination-active-bg"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="pagination-page-number">{p}</span>
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => handlePageClick(validCurrentPage + 1)}
          disabled={validCurrentPage === totalPages}
          className="pagination-btn pagination-nav-btn"
          title="Next Page"
          aria-label="Go to next page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Jump Last */}
        <button
          type="button"
          onClick={() => handlePageClick(totalPages)}
          disabled={validCurrentPage === totalPages}
          className="pagination-btn pagination-nav-btn"
          title="Last Page"
          aria-label="Go to last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Right: Page Size Selector */}
      {pageSizeOptions && pageSizeOptions.length > 1 && (
        <div className="pagination-page-size">
          <label htmlFor="pagination-select-size" className="pagination-size-label">
            Per page:
          </label>
          <select
            id="pagination-select-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="pagination-size-select"
            aria-label="Select items per page"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
