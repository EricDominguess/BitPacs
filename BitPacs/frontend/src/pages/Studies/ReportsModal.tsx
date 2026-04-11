import { useState } from 'react';

interface Report {
  id: number;
  fileName: string;
  uploadedAt: string;
  fileSize: number;
  patientName: string;
}

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: Report[];
  isLoading?: boolean;
  onDeleteReport: () => void;
}

export function ReportsModal({
  isOpen,
  onClose,
  reports,
  isLoading = false,
  onDeleteReport
}: ReportsModalProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-theme-secondary border border-theme-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-theme-primary">Laudos Anexados</h3>
          <button
            onClick={onClose}
            className="p-1 text-theme-muted hover:text-theme-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="text-center py-8 text-theme-muted">
            Carregando laudos...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-theme-muted">
            Nenhum laudo anexado.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-theme-card border border-theme-border rounded-lg hover:bg-nautico/5 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-nautico" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h6a1 1 0 01.707.293l6 6a1 1 0 01.293.707v8a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 3a1 1 0 000 2h.01a1 1 0 000-2H6zm0 4a1 1 0 000 2h.01a1 1 0 000-2H6z" />
                    </svg>
                    <p className="font-medium text-theme-primary text-sm">
                      {report.fileName}
                    </p>
                  </div>
                  <div className="text-xs text-theme-muted space-y-1">
                    <p>Tamanho: {(report.fileSize / 1024).toFixed(2)} KB</p>
                    <p>Anexado em: {new Date(report.uploadedAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Deletar laudo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Confirm Delete Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(false)}
            />
            <div className="relative bg-theme-secondary border border-theme-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
              <h3 className="text-lg font-semibold text-theme-primary mb-4">Confirmação</h3>
              <p className="text-theme-muted mb-6">Tem certeza que deseja deletar este laudo?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary hover:bg-theme-border transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteReport();
                    setDeleteConfirm(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
