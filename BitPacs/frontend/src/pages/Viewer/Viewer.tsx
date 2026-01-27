import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';

export function Viewer() {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // URL do Stone Viewer - usa StudyInstanceUID como parâmetro
  // O Stone WebViewer espera o StudyInstanceUID do DICOM, não o ID interno do Orthanc
  const viewerUrl = studyId 
    ? `/orthanc/stone-webviewer/index.html?study=${encodeURIComponent(studyId)}`
    : `/orthanc/stone-webviewer/index.html`;

  const handleIframeLoad = () => {
    setIsLoading(false);
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      const iframeDoc = iframe.contentWindow.document;
      const style = iframeDoc.createElement('style');
      
      // CSS INJECT: Remove logo e aplica tema Dark
      style.innerHTML = `
        .navbar-brand, .os-logo, .brand, a[href*="orthanc"], img[src*="orthanc"] {
           display: none !important;
           pointer-events: none !important;
        }
        body, #app, .full-screen {
           background-color: #000 !important;
           color: #eee !important;
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `;
      iframeDoc.head.appendChild(style);
    } catch (e) {
      // Ignora erros de cross-origin se ocorrerem
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header Simples (Sem links externos) */}
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
            Visualizador <span className="text-ultra">BitPacs</span>
          </p>
        </div>
      </header>

      {/* Área do Visualizador */}
      <div className="flex-1 relative bg-black w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-tangaroa z-0">
             <div className="flex flex-col items-center gap-4 animate-fade-in">
               <div className="w-10 h-10 border-4 border-nautico border-t-transparent rounded-full animate-spin"></div>
               <p className="text-white/60 text-sm">Carregando imagens...</p>
             </div>
          </div>
        )}
        <iframe 
          ref={iframeRef}
          src={viewerUrl}
          className="w-full h-full border-none"
          title="DICOM Viewer"
          allowFullScreen
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}