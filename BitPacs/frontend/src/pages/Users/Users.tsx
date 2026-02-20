import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card, Button, Input, Badge, UserLogsModal } from '../../components/common';

// Tipos
interface User {
  id: number;
  nome: string;
  email: string;
  role: 'Master' | 'Admin' | 'Medico' | 'Enfermeiro';
  unidade?: string;
  createdAt?: string;
  isActive?: boolean;
}

type UserRole = 'Master' | 'Admin' | 'Medico' | 'Enfermeiro';

interface FormData {
  nome: string;
  email: string;
  password: string;
  role: UserRole;
  unidade: string;
}

// Cores por role
const roleColors: Record<string, { badge: 'default' | 'success' | 'warning' | 'error', label: string }> = {
  Master: { badge: 'success', label: 'Master' },
  Admin: { badge: 'warning', label: 'Administrador' },
  Medico: { badge: 'default', label: 'Médico' },
  Enfermeiro: { badge: 'default', label: 'Enfermeiro' },
};

// Roles que cada tipo de usuário pode criar
const allowedRolesToCreate: Record<string, UserRole[]> = {
  Master: ['Master', 'Admin', 'Medico', 'Enfermeiro'],
  Admin: ['Medico', 'Enfermeiro'],
};

// Constante de itens por página
const ITEMS_PER_PAGE = 8;

// Lista de unidades do .env
const unidades = [
  { value: 'riobranco', label: import.meta.env.VITE_UNIDADE_RIOBRANCO || 'CIS - Unidade de Rio Branco' },
  { value: 'foziguacu', label: import.meta.env.VITE_UNIDADE_FOZIGUACU || 'CIS - Unidade de Foz do Iguaçu' },
  { value: 'fazenda', label: import.meta.env.VITE_UNIDADE_FAZENDA || 'CIS - Unidade de Fazenda' },
  { value: 'faxinal', label: import.meta.env.VITE_UNIDADE_FAXINAL || 'CIS - Unidade de Faxinal' },
  { value: 'santamariana', label: import.meta.env.VITE_UNIDADE_SANTAMARIANA || 'CIS - Unidade de Santa Mariana' },
  { value: 'guarapuava', label: import.meta.env.VITE_UNIDADE_GUARAPUAVA || 'CIS - Unidade de Guarapuava' },
  { value: 'carlopolis', label: import.meta.env.VITE_UNIDADE_CARLOPOLIS || 'CIS - Unidade de Carlópolis' },
  { value: 'arapoti', label: import.meta.env.VITE_UNIDADE_ARAPOTI || 'CIS - Unidade de Arapoti' },
];

export function Users() {
  const navigate = useNavigate();
  // Usuário logado
  const currentUser = JSON.parse((sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user')) || '{}');
  
  // Verificação de permissão (apenas Master e Admin podem acessar)
  useEffect(() => {
    if (currentUser.role !== 'Master' && currentUser.role !== 'Admin') {
      navigate('/dashboard');
    }
  }, [navigate, currentUser.role]);

  // Roles que o usuário atual pode criar
  const availableRoles = allowedRolesToCreate[currentUser.role] || [];

  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados do Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({ nome: '', email: '', password: '', role: 'Medico', unidade: '' });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Estados do Modal de Logs
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsUserId, setLogsUserId] = useState<number>(0);
  const [logsUserName, setLogsUserName] = useState<string>('');

  // Carregar usuários
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = (sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token'));
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("DADOS DOS USUÁRIOS QUE VIERAM DO BACKEND:", data);
        setUsers(data);
      } else {
        console.error('Erro ao carregar usuários');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtros
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  // Resetar página ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  // Paginação
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Handlers de paginação
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Abrir modal para criar
  const handleCreate = () => {
    setModalMode('create');
    setEditingUser(null);
    // Define o role padrão como o primeiro disponível para o usuário
    const defaultRole = availableRoles[0] || 'Medico';
    setFormData({ nome: '', email: '', password: '', role: defaultRole, unidade: '' });
    setFormError('');
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (user: User) => {
    setModalMode('edit');
    setEditingUser(user);
    setFormData({ nome: user.nome, email: user.email, password: '', role: user.role, unidade: user.unidade || '' });
    setFormError('');
    setShowModal(true);
  };

  // Abrir modal de logs do usuário
  const handleShowLogs = (user: User) => {
    setLogsUserId(user.id);
    setLogsUserName(user.nome);
    setShowLogsModal(true);
  };

  // Salvar (criar ou editar)
  const handleSave = async () => {
    setFormError('');
    
    // Validação básica
    if (!formData.nome.trim() || !formData.email.trim()) {
      setFormError('Nome e e-mail são obrigatórios.');
      return;
    }
    
    if (modalMode === 'create' && !formData.password.trim()) {
      setFormError('A senha é obrigatória para novos usuários.');
      return;
    }

    setIsSaving(true);
    try {
      const token = (sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token'));
      const url = modalMode === 'create' 
        ? '/api/auth/register'
        : `/api/auth/users/${editingUser?.id}`;
      
      const body = modalMode === 'create'
        ? formData
        : { ...formData, password: formData.password || undefined };

      const response = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowModal(false);
        fetchUsers(); // Recarrega a lista
      } else {
        const errorData = await response.json().catch(() => ({}));
        setFormError(errorData.message || 'Erro ao salvar usuário.');
      }
    } catch (err) {
      setFormError('Erro de conexão com o servidor.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Deletar usuário
  const handleDelete = async (userId: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const token = (sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token'));
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Erro ao excluir usuário.');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor.');
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Controle de Usuários</h1>
            <p className="text-theme-muted mt-1">
              {isLoading 
                ? 'Carregando usuários...' 
                : `${filteredUsers.length} usuário(s) encontrado(s)`
              }
            </p>
          </div>
          <Button onClick={handleCreate}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Usuário
          </Button>
        </div>

        {/* Filtros */}
        <Card className="!p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'Master', 'Admin', 'Medico', 'Enfermeiro'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedRole === role
                      ? 'bg-nautico text-white'
                      : 'bg-theme-card text-theme-muted hover:text-theme-primary border border-theme-border'
                  }`}
                >
                  {role === 'all' ? 'Todos' : roleColors[role]?.label || role}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Tabela de Usuários */}
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[700px]">
              <thead className="bg-theme-secondary">
                <tr>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Nome</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">E-mail</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Função</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Unidade</th>
                  <th className="text-right text-sm font-semibold text-theme-secondary px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-light">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-theme-muted">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-nautico border-t-transparent rounded-full animate-spin" />
                        Carregando usuários...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-theme-muted">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((user) => (
                    <tr key={user.id} className="hover:bg-nautico/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-nautico/20 flex items-center justify-center">
                            <span className="text-nautico font-semibold text-sm">
                              {user.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-theme-primary">{user.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-theme-muted">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={roleColors[user.role]?.badge || 'default'}>
                          {roleColors[user.role]?.label || user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-theme-muted text-sm">
                          {user.role === 'Master' 
                            ? <span className="text-nautico font-medium">Todas (Acesso Global)</span>
                            : unidades.find(u => u.value === user.unidade)?.label || user.unidade || <span className="opacity-50">Não atribuída</span>
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" title="Histórico de atividades" onClick={() => handleShowLogs(user)}>
                            <svg className="w-4 h-4 text-green-aqua" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" title="Editar" onClick={() => handleEdit(user)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" title="Excluir" onClick={() => handleDelete(user.id)}>
                            <svg className="w-4 h-4 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer com Paginação */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-secondary">
            <span className="text-sm text-theme-muted">
              {filteredUsers.length > 0 ? (
                <>Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredUsers.length)} de {filteredUsers.length} usuários</>
              ) : (
                'Nenhum resultado'
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePrevPage}
                disabled={currentPage === 1 || filteredUsers.length === 0}
              >
                Anterior
              </Button>
              
              <span className="text-xs text-theme-muted font-medium px-2">
                Pág {currentPage} de {totalPages || 1}
              </span>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNextPage}
                disabled={currentPage === totalPages || filteredUsers.length === 0}
              >
                Próximo
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Criar/Editar Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-theme-card border border-theme-border rounded-xl w-full max-w-md mx-4 shadow-2xl animate-scale-up">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-theme-border">
              <h2 className="text-xl font-bold text-theme-primary">
                {modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-theme-muted hover:text-theme-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-4">
              {/* Mensagem de Erro */}
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 animate-fade-in">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-200">{formError}</span>
                </div>
              )}

              <Input
                label="Nome Completo"
                placeholder="Digite o nome..."
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />

              <Input
                label="E-mail"
                type="email"
                placeholder="usuario@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <Input
                label={modalMode === 'create' ? 'Senha' : 'Nova Senha (deixe em branco para manter)'}
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              {/* Select de Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-theme-secondary">Função</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent transition-all duration-200"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleColors[role]?.label || role}
                    </option>
                  ))}
                </select>
                {currentUser.role === 'Admin' && (
                  <p className="text-xs text-theme-muted mt-1">
                    Como administrador, você só pode criar Médicos e Enfermeiros.
                  </p>
                )}
              </div>

              {/* Select de Unidade - apenas para não-Master */}
              {formData.role !== 'Master' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-theme-secondary">Unidade</label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Selecione uma unidade...</option>
                    {unidades.map((unidade) => (
                      <option key={unidade.value} value={unidade.value}>
                        {unidade.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-theme-border">
              <Button variant="ghost" onClick={() => setShowModal(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  modalMode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Logs do Usuário */}
      <UserLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        userId={logsUserId}
        userName={logsUserName}
      />
    </MainLayout>
  );
}