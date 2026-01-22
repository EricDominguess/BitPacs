import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [name, setName] = useState('Usuário Admin');
  const [email, setEmail] = useState('admin@bitpacs.com');
  const [cargo, setCargo] = useState('Administrador');
  const [instituicao, setInstituicao] = useState('Hospital BitFix');

  if (!isOpen) return null;

  const handleSave = () => {
    // Simulação de salvamento
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
      <div className="relative bg-theme-secondary border border-theme-border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl transition-colors duration-300">
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
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-nautico to-purple-light flex items-center justify-center">
              <span className="text-2xl font-bold text-white">U</span>
            </div>
            <div>
              <Button variant="outline" size="sm">Alterar Foto</Button>
              <p className="text-xs text-theme-muted mt-2">JPG, PNG ou GIF. Máx 2MB</p>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Nome" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input 
              label="Email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input 
              label="Cargo" 
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            />
            <Input 
              label="Instituição" 
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
            />
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
