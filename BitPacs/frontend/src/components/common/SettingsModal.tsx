import { useTheme } from '../../contexts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Pegamos as novas funções do hook
  const { theme, toggleTheme, enableAnimations, toggleAnimations } = useTheme();
  
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-theme-secondary border border-theme-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-theme-primary">Configurações</h3>
            <p className="text-sm text-theme-muted mt-0.5">Gerencie as preferências do sistema</p>
          </div>
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
        <div className="space-y-3">
          <p className="text-sm font-medium text-theme-muted uppercase tracking-wide">Aparência</p>
          
          {/* Tema Escuro */}
          <div className="flex items-center justify-between p-4 bg-theme-card rounded-xl border border-theme-border">
            <div>
              <p className="font-medium text-theme-primary">Tema Escuro</p>
              <p className="text-sm text-theme-muted">Usar tema escuro na interface</p>
            </div>
            <button 
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-nautico' : 'bg-purple/30'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Animações (AGORA FUNCIONA) */}
          <div className="flex items-center justify-between p-4 bg-theme-card rounded-xl border border-theme-border">
            <div>
              <p className="font-medium text-theme-primary">Animações</p>
              <p className="text-sm text-theme-muted">Habilitar animações de transição</p>
            </div>
            <button 
              onClick={toggleAnimations}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${enableAnimations ? 'bg-nautico' : 'bg-purple/30'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enableAnimations ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}