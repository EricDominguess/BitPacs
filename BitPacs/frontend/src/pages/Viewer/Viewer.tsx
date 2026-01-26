import { useState } from 'react';
import { Button } from '../../components/common';

export function Viewer() {
  const [selectedTool, setSelectedTool] = useState('pan');
  const [windowLevel, setWindowLevel] = useState({ width: 400, center: 40 });

  const tools = [
    { 
      id: 'pan', 
      label: 'Pan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
        </svg>
      )
    },
    { 
      id: 'zoom', 
      label: 'Zoom',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      )
    },
    { 
      id: 'window', 
      label: 'Window/Level',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      id: 'measure', 
      label: 'Medir',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      )
    },
    { 
      id: 'annotate', 
      label: 'Anotar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
  ];

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Toolbar */}
      <header className="h-14 bg-tangaroa border-b border-purple/30 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <a href="/studies" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Voltar</span>
          </a>
          <div className="w-px h-6 bg-purple/30" />
          <div>
            <p className="text-sm font-medium text-white">Maria Silva</p>
            <p className="text-xs text-white/50">TC Tórax - 12/01/2026</p>
          </div>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1 bg-purple-dark/50 rounded-lg p-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                selectedTool === tool.id
                  ? 'bg-nautico text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/50">W:</span>
            <span className="text-ultra font-mono">{windowLevel.width}</span>
            <span className="text-white/50 ml-2">L:</span>
            <span className="text-ultra font-mono">{windowLevel.center}</span>
          </div>
          <Button variant="secondary" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar - Thumbnails */}
        <aside className="w-24 bg-tangaroa/80 border-r border-purple/30 overflow-y-auto scrollbar-thin p-2 space-y-2">
          {[...Array(12)].map((_, i) => (
            <button
              key={i}
              className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                i === 0 ? 'border-ultra' : 'border-transparent hover:border-white/30'
              }`}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <span className="text-white/30 text-xs">{i + 1}</span>
              </div>
            </button>
          ))}
        </aside>

        {/* Main Viewer */}
        <main className="flex-1 flex items-center justify-center bg-black relative">
          {/* Placeholder para a imagem DICOM */}
          <div className="w-full h-full max-w-4xl max-h-[80vh] bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center border border-purple/20">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-purple-dark/50 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-ultra" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Área do Visualizador DICOM</p>
                <p className="text-white/50 text-sm mt-1">Integre com Cornerstone.js ou OHIF</p>
              </div>
            </div>
          </div>

          {/* Overlay Info */}
          <div className="absolute top-4 left-28 text-xs text-white/60 space-y-1 font-mono">
            <p>Patient: Maria Silva</p>
            <p>Study: TC Tórax</p>
            <p>Series: 1/3</p>
            <p>Image: 1/245</p>
          </div>

          <div className="absolute bottom-4 right-4 text-xs text-white/60 space-y-1 font-mono text-right">
            <p>512 x 512</p>
            <p>WW: {windowLevel.width} WL: {windowLevel.center}</p>
            <p>Zoom: 100%</p>
          </div>
        </main>

        {/* Right Panel - Info */}
        <aside className="w-72 bg-tangaroa/80 border-l border-purple/30 overflow-y-auto scrollbar-thin">
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Informações do Paciente</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Nome:</span>
                  <span className="text-white">Maria Silva</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">ID:</span>
                  <span className="text-white font-mono">PAC001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Nascimento:</span>
                  <span className="text-white">15/03/1985</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Sexo:</span>
                  <span className="text-white">Feminino</span>
                </div>
              </div>
            </div>

            <div className="border-t border-purple/20 pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Informações do Estudo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Modalidade:</span>
                  <span className="text-ultra font-semibold">CT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Descrição:</span>
                  <span className="text-white">TC Tórax</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Data:</span>
                  <span className="text-white">12/01/2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Séries:</span>
                  <span className="text-white">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Imagens:</span>
                  <span className="text-white">245</span>
                </div>
              </div>
            </div>

            <div className="border-t border-purple/20 pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Séries</h3>
              <div className="space-y-2">
                {['Axial', 'Coronal', 'Sagital'].map((series, i) => (
                  <button
                    key={series}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      i === 0
                        ? 'bg-nautico text-white'
                        : 'bg-purple-dark/50 text-white/70 hover:bg-purple-dark hover:text-white'
                    }`}
                  >
                    <p className="font-medium">{series}</p>
                    <p className="text-xs opacity-70">{80 + i * 20} imagens</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
