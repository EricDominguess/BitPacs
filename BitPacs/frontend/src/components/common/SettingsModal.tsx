import { useTheme, useUnidade } from '../../contexts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Pegamos as novas funções do hook
  const { theme, toggleTheme, enableAnimations, toggleAnimations } = useTheme();
  const { unidade, setUnidade, unidadesDisponiveis, isMaster, unidadeLabel, isUnidadeSelected } = useUnidade();
  
  const isDark = theme === 'dark';

  // Filtra apenas as unidades reais (exclui localhost) para o select do Master
  const unidadesReais = Object.entries(unidadesDisponiveis).filter(([key]) => key !== 'localhost');

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
        <div className="space-y-4">
          {/* Seção de Unidade (apenas para Master) */}
          {isMaster && (
            <>
              <p className="text-sm font-medium text-theme-muted uppercase tracking-wide">Unidade</p>
              <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
                <div className="mb-3">
                  <p className="font-medium text-theme-primary">Selecionar Unidade</p>
                  <p className="text-sm text-theme-muted">
                    {isUnidadeSelected 
                      ? 'Unidade atual: ' + unidadeLabel
                      : 'Selecione uma unidade para visualizar os dados do PACS'
                    }
                  </p>
                </div>
                <select
                  value={unidade === 'localhost' ? '' : unidade}
                  onChange={(e) => setUnidade(e.target.value as keyof typeof unidadesDisponiveis)}
                  className="w-full px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent transition-all duration-200"
                >
                  <option value="" disabled>Selecione uma unidade...</option>
                  {unidadesReais.map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
                {!isUnidadeSelected && (
                  <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Nenhuma unidade selecionada. Os dados do PACS não serão carregados.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Mostrar unidade atual para não-Master */}
          {!isMaster && (
            <>
              <p className="text-sm font-medium text-theme-muted uppercase tracking-wide">Unidade</p>
              <div className="p-4 bg-theme-card rounded-xl border border-theme-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-theme-primary">Unidade Atual</p>
                    <p className="text-sm text-theme-muted">{unidadeLabel}</p>
                  </div>
                  <div className="p-2 bg-nautico/20 rounded-lg">
                    <svg className="w-5 h-5 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

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