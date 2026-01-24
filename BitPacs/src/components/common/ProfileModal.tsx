import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  // O Nome continua sendo um estado editável
  const [name, setName] = useState('Usuário Admin');

  // Estes dados agora simulam informações vindas do Backend (não editáveis aqui)
  const readOnlyData = {
    email: 'admin@bitpacs.com',
    cargo: 'Administrador',
    instituicao: import.meta.env.VITE_UNIDADE_FAZENDA || 'Unidade Padrão',
  };

  if (!isOpen) return null;

  const handleSave = () => {
    // Aqui você enviaria apenas o novo nome e/ou foto para a API
    console.log("Salvando novo nome:", name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-theme-secondary border border-theme-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl transition-colors duration-300 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-theme-primary">Meu Perfil</h3>
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
        <div className="space-y-6">
          {/* Avatar - Continua Editável */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-nautico to-purple-light flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <Button variant="outline" size="sm">Alterar Foto</Button>
              <p className="text-xs text-theme-muted mt-2">JPG, PNG ou GIF. Máx 2MB</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nome - Único Campo Editável */}
            <div>
              <Input 
                label="Nome de Exibição" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como você quer ser chamado"
              />
            </div>

            {/* Grid de Informações Somente Leitura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Card de Email */}
              <div className="p-3 bg-theme-light/30 border border-theme-border rounded-lg opacity-80">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Email</span>
                </div>
                <p className="text-sm font-medium text-theme-primary truncate" title={readOnlyData.email}>
                  {readOnlyData.email}
                </p>
              </div>

              {/* Card de Cargo */}
              <div className="p-3 bg-theme-light/30 border border-theme-border rounded-lg opacity-80">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Cargo</span>
                </div>
                <p className="text-sm font-medium text-theme-primary">
                  {readOnlyData.cargo}
                </p>
              </div>

              {/* Card de Instituição - Full Width */}
              <div className="md:col-span-2 p-3 bg-theme-light/30 border border-theme-border rounded-lg opacity-80">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Instituição</span>
                  <span className="ml-auto text-[10px] bg-theme-light px-2 py-0.5 rounded-full text-theme-muted">Vinculado</span>
                </div>
                <p className="text-sm font-medium text-theme-primary">
                  {readOnlyData.instituicao}
                </p>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </div>
        </div>
      </div>
    </div>
  );
}