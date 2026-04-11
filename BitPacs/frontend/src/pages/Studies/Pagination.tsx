interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  itemsPerPage: number;
  totalItems: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  itemsPerPage,
  totalItems
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-6 pt-6 border-t border-theme-border">
      <div className="text-sm text-theme-muted">
        Mostrando {startItem} a {endItem} de {totalItems} estudos
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg border border-theme-border text-theme-primary hover:bg-theme-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <span key={page} className={`px-2 py-1 rounded ${
              page === currentPage
                ? 'bg-nautico text-white font-semibold'
                : 'text-theme-muted'
            }`}>
              {page}
            </span>
          ))}
        </div>

        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg border border-theme-border text-theme-primary hover:bg-theme-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Próximo
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
