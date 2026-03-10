import { ModalityBadge } from './ModalityBadge';

export interface SeriesForDownload {
  id: string;
  description: string;
  modality: string;
  instancesCount: number;
  instances: InstanceForDownload[];
  isExpanded: boolean;
  isSelected: boolean;
}

export interface InstanceForDownload {
  id: string;
  instanceNumber: string;
  isSelected: boolean;
}

export interface StudyForDownload {
  id: string;
  patient: string;
  description: string;
  modality: string;
  studyInstanceUID: string;
  date: string;
  birthDate: string;
}

export type DownloadFormat = 'jpeg' | 'pdf';

interface DownloadModalProps {
  isOpen: boolean;
  study: StudyForDownload | null;
  series: SeriesForDownload[];
  isLoadingSeries: boolean;
  isDownloading: boolean;
  downloadFormat: DownloadFormat;
  onClose: () => void;
  onFormatChange: (format: DownloadFormat) => void;
  onToggleSelectAll: () => void;
  onToggleSeriesExpanded: (seriesId: string) => void;
  onToggleSeriesSelection: (seriesId: string) => void;
  onToggleInstanceSelection: (seriesId: string, instanceId: string) => void;
  onDownload: () => void;
  countSelected: () => { seriesCount: number; instancesCount: number };
}

export function DownloadModal({
  isOpen,
  study,
  series,
  isLoadingSeries,
  isDownloading,
  downloadFormat,
  onClose,
  onFormatChange,
  onToggleSelectAll,
  onToggleSeriesExpanded,
  onToggleSeriesSelection,
  onToggleInstanceSelection,
  onDownload,
  countSelected,
}: DownloadModalProps) {
  if (!isOpen || !study) return null;

  const selected = countSelected();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden w-full max-w-2xl mx-4 shadow-2xl animate-scale-up max-h-[85vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-theme-primary">
              Selecionar Download
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
        <div className="px-6 py-3 bg-theme-secondary/50 border-b border-theme-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ModalityBadge modality={study.modality} />
              <span className="text-sm text-theme-muted truncate">{study.description}</span>
            </div>
            {!isLoadingSeries && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={series.length > 0 && series.every(s => s.isSelected)}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-theme-border text-nautico focus:ring-nautico"
                />
                <span className="text-sm text-theme-muted">Selecionar Tudo</span>
              </label>
            )}
          </div>
        </div>

        {/* Lista de Séries */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoadingSeries ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-theme-muted">
                <div className="w-5 h-5 border-2 border-nautico border-t-transparent rounded-full animate-spin" />
                Carregando séries...
              </div>
            </div>
          ) : series.length === 0 ? (
            <div className="text-center py-12 text-theme-muted">
              Nenhuma série encontrada.
            </div>
          ) : (
            series.map((seriesItem) => (
              <div key={seriesItem.id} className="border border-theme-border rounded-lg overflow-hidden">
                {/* Header da Série */}
                <div 
                  className="flex items-center gap-3 p-3 bg-theme-secondary/30 cursor-pointer hover:bg-theme-secondary/50 transition-colors"
                  onClick={() => onToggleSeriesExpanded(seriesItem.id)}
                >
                  <input
                    type="checkbox"
                    checked={seriesItem.isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSeriesSelection(seriesItem.id);
                    }}
                    className="w-4 h-4 rounded border-theme-border text-nautico focus:ring-nautico"
                  />
                  <svg 
                    className={`w-5 h-5 text-theme-muted transition-transform ${seriesItem.isExpanded ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-primary truncate">
                      {seriesItem.description || 'Série sem descrição'}
                    </p>
                    <p className="text-xs text-theme-muted">
                      {seriesItem.instancesCount} imagem(ns)
                    </p>
                  </div>
                  <ModalityBadge modality={seriesItem.modality} className="px-2 py-0.5" />
                </div>

                {/* Lista de Instâncias (expandível) */}
                {seriesItem.isExpanded && (
                  <div className="border-t border-theme-border bg-theme-card">
                    <div className="max-h-48 overflow-y-auto">
                      {seriesItem.instances.map((instance, idx) => (
                        <div 
                          key={instance.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-theme-secondary/20 transition-colors border-b border-theme-light last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={instance.isSelected}
                            onChange={() => onToggleInstanceSelection(seriesItem.id, instance.id)}
                            className="w-4 h-4 rounded border-theme-border text-nautico focus:ring-nautico"
                          />
                          <svg className="w-4 h-4 text-ultra" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-theme-secondary">
                            Imagem {instance.instanceNumber || (idx + 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer com Ações */}
        <div className="px-6 py-4 border-t border-theme-border bg-theme-secondary/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-theme-muted">
                {selected.seriesCount > 0 
                  ? `${selected.seriesCount} série(s), ${selected.instancesCount} imagem(ns)`
                  : 'Nenhuma seleção'}
              </span>
              
              {/* Seletor de formato */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-theme-muted">Formato:</label>
                <select
                  value={downloadFormat}
                  onChange={(e) => onFormatChange(e.target.value as DownloadFormat)}
                  className="px-3 py-1.5 text-sm bg-theme-secondary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico/50"
                >
                  <option value="jpeg">JPEG (ZIP)</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-theme-muted hover:text-theme-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onDownload}
                disabled={selected.instancesCount === 0 || isDownloading}
                className="px-4 py-2 bg-nautico text-white rounded-lg text-sm font-medium hover:bg-nautico/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {downloadFormat === 'pdf' ? 'Gerando PDF...' : 'Gerando ZIP...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar {downloadFormat === 'pdf' ? 'PDF' : 'ZIP'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
