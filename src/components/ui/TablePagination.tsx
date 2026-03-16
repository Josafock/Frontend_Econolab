'use client';

import { useEffect, useState } from 'react';

type TablePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export default function TablePagination({
  page,
  pageSize,
  totalItems,
  itemLabel = 'registros',
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const [draftPageSize, setDraftPageSize] = useState(String(pageSize));
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  useEffect(() => {
    setDraftPageSize(String(pageSize));
  }, [pageSize]);

  const applyPageSize = () => {
    const parsed = Number(draftPageSize);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      setDraftPageSize(String(pageSize));
      return;
    }

    onPageSizeChange(parsed);
  };

  return (
    <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center">
        <label className="inline-flex items-center gap-2">
          <span>Mostrar</span>
          <input
            type="number"
            min="1"
            step="1"
            value={draftPageSize}
            onChange={(event) => setDraftPageSize(event.target.value)}
            onBlur={applyPageSize}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyPageSize();
              }
            }}
            className="w-20 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
          <span>{itemLabel}</span>
        </label>

        <p>
          Mostrando registros del <span className="font-semibold">{start}</span> al{' '}
          <span className="font-semibold">{end}</span> de un total de{' '}
          <span className="font-semibold">{totalItems}</span> {itemLabel}
        </p>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>

        <span className="inline-flex min-w-10 items-center justify-center rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white">
          {currentPage}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
