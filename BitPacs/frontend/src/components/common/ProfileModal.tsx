import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { UNIDADES_CONFIG } from '../../contexts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Cores por role
const roleColors: Record<string, { badge: 'default' | 'success' | 'warning' | 'error', label: string }> = {
  Master: { badge: 'success', label: 'Master' },
  Admin: { badge: 'warning', label: 'Administrador' },
  Medico: { badge: 'default', label: 'Médico' },
  Enfermeiro: { badge: 'default', label: 'Enfermeiro' },
};

// Função para obter o label da unidade
const getUnidadeLabel = (unidadeKey: string | null | undefined, role: string): string => {
  if (role === 'Master') {
    return 'Acesso Global (Todas as Unidades)';
  }
  if (!unidadeKey) {
    return 'Nenhuma unidade vinculada';
  }
  const config = UNIDADES_CONFIG[unidadeKey as keyof typeof UNIDADES_CONFIG];
  return config?.label || unidadeKey;
};

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  // Pega dados do usuário logado
  const [storedUser, setStoredUser] = useState(() => 
    JSON.parse(localStorage.getItem('bitpacs_user') || '{}')
  );
  
  // O Nome continua sendo um estado editável
  const [name, setName] = useState(storedUser.nome || 'Usuário');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(storedUser.avatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualiza o nome e avatar quando o modal abre
  useEffect(() => {
    if (isOpen) {
      const user = JSON.parse(localStorage.getItem('bitpacs_user') || '{}');
      setStoredUser(user);
      setName(user.nome || 'Usuário');
      setAvatarUrl(user.avatarUrl || null);
      setError(null);
    }
  }, [isOpen]);

  // Dados do usuário logado
  const readOnlyData = {
    email: storedUser.email || 'email@exemplo.com',
    cargo: storedUser.role || 'Usuário',
    instituicao: getUnidadeLabel(storedUser.unidade, storedUser.role),
  };

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.');
      return;
    }

    // Valida tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const token = localStorage.getItem('bitpacs_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5151/api/auth/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao enviar imagem');
      }

      const data = await response.json();
      
      // Atualiza estado local
      setAvatarUrl(data.avatarUrl);
      
      // Atualiza localStorage
      const updatedUser = { ...storedUser, avatarUrl: data.avatarUrl };
      localStorage.setItem('bitpacs_user', JSON.stringify(updatedUser));
      setStoredUser(updatedUser);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('bitpacs_token');
      const response = await fetch('http://localhost:5151/api/auth/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao remover avatar');
      }

      // Atualiza estado local
      setAvatarUrl(null);
      
      // Atualiza localStorage
      const updatedUser = { ...storedUser, avatarUrl: null };
      localStorage.setItem('bitpacs_user', JSON.stringify(updatedUser));
      setStoredUser(updatedUser);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    // Se o nome não mudou, só fecha
    if (name === storedUser.nome) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('bitpacs_token');
      const response = await fetch(`http://localhost:5151/api/auth/users/${storedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ nome: name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao salvar');
      }

      const data = await response.json();
      
      // Atualiza localStorage com novo nome
      const updatedUser = { ...storedUser, nome: data.nome };
      localStorage.setItem('bitpacs_user', JSON.stringify(updatedUser));
      
      onClose();
      // Força reload para atualizar sidebar
      window.location.reload();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
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
          {/* Mensagem de erro */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Avatar - Editável */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img 
                  src={`http://localhost:5151${avatarUrl}`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-nautico to-purple-light flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="avatar-upload"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Enviando...' : 'Alterar Foto'}
                </Button>
                {avatarUrl && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isUploading}
                  >
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-xs text-theme-muted">JPG, PNG, GIF ou WebP. Máx 2MB</p>
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
                <Badge variant={roleColors[readOnlyData.cargo]?.badge || 'default'}>
                  {roleColors[readOnlyData.cargo]?.label || readOnlyData.cargo}
                </Badge>
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
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}