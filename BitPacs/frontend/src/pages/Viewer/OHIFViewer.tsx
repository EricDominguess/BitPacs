import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useUnidade } from '../../contexts';

// Configuração dos proxies por unidade (deve corresponder ao vite.config.ts)
const UNIDADE_PROXY: Record<string, string> = {
  // IDs Numéricos (Novo padrão do banco de dados)
  '1': '/orthanc-riobranco',
  '2': '/orthanc-foziguacu',
  '3': '/orthanc-fazenda',
  '4': '/orthanc-faxinal',
  '5': '/orthanc-santamariana',
  '6': '/orthanc-guarapuava',
  '7': '/orthanc-carlopolis',
  '8': '/orthanc-arapoti',
  
  // Textos legados (Mantidos como salva-vidas)
  'localhost': '/orthanc',
  'riobranco': '/orthanc-riobranco',
  'foziguacu': '/orthanc-foziguacu',
  'fazenda': '/orthanc-fazenda',
  'faxinal': '/orthanc-faxinal',
  'santamariana': '/orthanc-santamariana',
  'guarapuava': '/orthanc-guarapuava',
  'carlopolis': '/orthanc-carlopolis',
  'arapoti': '/orthanc-arapoti',
};

export function OHIFViewer() {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { unidade } = useUnidade();

  // Obtém o proxy correto baseado na unidade selecionada
  const proxyPrefix = UNIDADE_PROXY[unidade] || '/orthanc';

  // URL do OHIF Viewer - usa StudyInstanceUID como parâmetro
  const viewerUrl = studyId 
    ? `${proxyPrefix}/ohif/viewer?StudyInstanceUIDs=${encodeURIComponent(studyId)}`
    : `${proxyPrefix}/ohif/`;

  const handleIframeLoad = () => {
    setIsLoading(false);
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      const iframeDoc = iframe.contentWindow.document;
      const style = iframeDoc.createElement('style');
      
      // CSS INJECT: Aplica ajustes de tema
      style.innerHTML = `
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `;
      iframeDoc.head.appendChild(style);

    } catch (e) {
      // Ignora erros de cross-origin se ocorrerem
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-tangaroa border-b border-purple/30 flex items-center justify-between px-4 flex-shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/studies')} 
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
          >
            <div className="p-1 rounded-full group-hover:bg-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </div>
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="w-px h-6 bg-purple/30" />
          <p className="text-sm font-medium text-white">
            <span className="text-purple-light">OHIF</span> Viewer
          </p>
        </div>
        
        {/* Botão para abrir BitPacs Viewer como alternativa */}
        <button
          onClick={() => navigate(`/viewer/${studyId}`)}
          className="flex items-center gap-2 px-3 py-1.5 bg-nautico/20 hover:bg-nautico/30 border border-nautico/30 rounded-lg text-nautico text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Abrir no BitPacs
        </button>
      </header>

      {/* Área do Visualizador */}
      <div className="flex-1 relative bg-black w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-tangaroa z-10">
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div className="w-10 h-10 border-4 border-purple-light border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white/60 text-sm">Carregando OHIF Viewer...</p>
            </div>
          </div>
        )}
        
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-tangaroa z-10">
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Erro ao carregar OHIF</h3>
                <p className="text-white/60 text-sm mb-4">
                  O visualizador OHIF não está disponível neste momento.
                </p>
                <button
                  onClick={() => navigate(`/viewer/${studyId}`)}
                  className="px-4 py-2 bg-nautico text-white rounded-lg text-sm font-medium hover:bg-nautico/90 transition-colors"
                >
                  Usar BitPacs Viewer
                </button>
              </div>
            </div>
          </div>
        )}
        
        <iframe 
          ref={iframeRef}
          src={viewerUrl}
          className="w-full h-full border-none"
          title="OHIF Viewer"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  );
}
