import React from 'react';

function buildPages(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('start-ellipsis');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < total - 1) pages.push('end-ellipsis');
  pages.push(total);

  return pages;
}

function Pagination({ page, totalPages, onChange, totalItems, pageSize }) {
  if (totalItems === 0) return null;

  const pages = buildPages(page, totalPages);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination-wrap">
      <div className="pagination-info">
        แสดง {from}-{to} จาก {totalItems} รายการ · หน้า {page}/{totalPages}
      </div>
      <nav className="pagination-modern" aria-label="pagination">
        <button
          type="button"
          className="page-btn"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
        >
          ← ก่อนหน้า
        </button>
        {pages.map((item) =>
          typeof item === 'number' ? (
            <button
              type="button"
              key={item}
              className={`page-btn page-number ${item === page ? 'active' : ''}`}
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="page-ellipsis">…</span>
          )
        )}
        <button
          type="button"
          className="page-btn"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
        >
          ถัดไป →
        </button>
      </nav>
    </div>
  );
}

export default Pagination;
