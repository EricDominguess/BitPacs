import { ModalityBadge } from './ModalityBadge';

interface SelectedStudy {
  id: string;
  studyInstanceUID: string;
  patient: string;
  modality: string;
  description: string;
}

interface ViewerModalProps {
  isOpen: boolean;
  study: SelectedStudy | null;
  onClose: () => void;
  onOpenInternal: () => void;
  onOpenOHIF: () => void;
}

export function ViewerModal({ isOpen, study, onClose, onOpenInternal, onOpenOHIF }: ViewerModalProps) {
  if (!isOpen || !study) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden w-full max-w-md mx-4 shadow-2xl animate-scale-up">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <div>
            <h2 className="text-xl font-bold text-theme-primary">
              Escolher Visualizador
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              {study.patient}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Informações do Estudo */}
        <div className="px-6 py-4 bg-theme-secondary/50 border-b border-theme-border">
          <div className="flex items-center gap-4 text-sm">
            <ModalityBadge modality={study.modality} />
            <span className="text-theme-muted truncate">{study.description}</span>
          </div>
        </div>

        {/* Opções de Visualizador */}
        <div className="p-6 space-y-3">
          {/* Visualizador Interno */}
          <button
            onClick={onOpenInternal}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-theme-border hover:border-nautico hover:bg-nautico/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-nautico/10 flex items-center justify-center group-hover:bg-nautico/20 transition-colors">
              <svg className="w-6 h-6 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-theme-primary group-hover:text-nautico transition-colors">
                Visualizador BitPacs
              </h3>
              <p className="text-sm text-theme-muted">Visualizador integrado do sistema</p>
            </div>
            <svg className="w-5 h-5 text-theme-muted group-hover:text-nautico transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* OHIF Viewer */}
          <button
            onClick={onOpenOHIF}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-theme-border hover:border-purple-light hover:bg-purple-light/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-light/10 flex items-center justify-center group-hover:bg-purple-light/20 transition-colors">
              <svg className="w-6 h-6 text-purple-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-theme-primary group-hover:text-purple-light transition-colors">
                OHIF Viewer
              </h3>
              <p className="text-sm text-theme-muted">Visualizador avançado</p>
            </div>
            <svg className="w-5 h-5 text-theme-muted group-hover:text-purple-light transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-theme-border bg-theme-secondary/30">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-theme-muted hover:text-theme-primary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
