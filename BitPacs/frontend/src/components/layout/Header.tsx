import { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsModal } from '../common';

export function Header() {
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  // Função de logout
  const handleLogout = () => {
    localStorage.removeItem('bitpacs_token');
    localStorage.removeItem('bitpacs_user');
    navigate('/');
  };

  return (
    <>
    <header className="h-[72px] bg-theme-primary/95 backdrop-blur-md border-b border-theme-light sticky top-0 z-50 transition-colors duration-300">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo - Clica para fazer logout e voltar para home */}
        <button onClick={handleLogout} className="flex items-center gap-2 group">
          {/* Ícone estilizado baseado na identidade */}
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-ultra rounded-lg transform rotate-45 group-hover:rotate-90 transition-transform duration-300" />
            <div className="absolute inset-1 bg-nautico rounded-md transform rotate-45 group-hover:rotate-90 transition-transform duration-300" />
            <div className="absolute inset-2 bg-ultra rounded-sm transform rotate-45 group-hover:rotate-90 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-theme-primary tracking-tight">
              Bit<span className="text-ultra">Pacs</span>
            </span>
            <span className="text-[10px] text-theme-muted -mt-1">suporte sob medida</span>
          </div>
        </button>

        <div className="flex-1 flex justify-center items-center">
          <div className="flex items-center gap-2 bg-theme-card border border-theme-border px-4 py-2 rounded-full">
            <svg className="w-4 h-4 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-medium text-theme-primary">
              {import.meta.env.VITE_UNIDADE_FAZENDA}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-500 ml-2"></span>
          </div>
        </div>
                
        {/* Actions */}
        <div className="flex items-center gap-4">

          {/* Configurações */}
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-theme-muted hover:text-theme-primary hover:bg-nautico/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    {/* Modal de Configurações */}
    <SettingsModal 
      isOpen={showSettings} 
      onClose={() => setShowSettings(false)} 
    />
    </>
  );
}
