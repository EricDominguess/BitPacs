interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmLabel = 'Confirmar',
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-theme-secondary border border-theme-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl transition-colors duration-300">
        <h3 className="text-lg font-semibold text-theme-primary mb-4">{title}</h3>
        <p className="text-theme-muted mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary border border-theme-border hover:bg-theme-tertiary hover:border-nautico/40 hover:text-theme-primary transition-all duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Processando...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
