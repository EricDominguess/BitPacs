import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card, Button, Input, Badge, UserLogsModal, ToastNotice, ConfirmActionModal } from '../../components/common';

interface User {
  id: number;
  nome: string;
  email: string;
  role: 'Master' | 'Admin' | 'Medico' | 'Enfermeiro';
  // ✅ unidadeId agora é string slug (ex: "guarapuava")
  unidadeId?: string;
  createdAt?: string;
  isActive?: boolean;
}

type UserRole = 'Master' | 'Admin' | 'Medico' | 'Enfermeiro';

interface FormData {
  nome: string;
  email: string;
  password: string;
  role: UserRole;
  unidade: string; // slug da unidade
}

const roleColors: Record<string, { badge: 'default' | 'success' | 'warning' | 'error', label: string }> = {
  Master:     { badge: 'success', label: 'Master' },
  Admin:      { badge: 'warning', label: 'Administrador' },
  Medico:     { badge: 'default', label: 'Médico' },
  Enfermeiro: { badge: 'default', label: 'Enfermeiro' },
};

const allowedRolesToCreate: Record<string, UserRole[]> = {
  Master: ['Master', 'Admin', 'Medico', 'Enfermeiro'],
  Admin:  ['Medico', 'Enfermeiro'],
};

const ITEMS_PER_PAGE = 8;

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'Master', label: roleColors.Master.label },
  { value: 'Admin', label: roleColors.Admin.label },
  { value: 'Medico', label: roleColors.Medico.label },
  { value: 'Enfermeiro', label: roleColors.Enfermeiro.label },
];

// ✅ value agora é o slug — bate 1:1 com o appsettings.json e o banco
const unidades = [
  { value: 'riobranco',    label: import.meta.env.VITE_UNIDADE_RIOBRANCO    || 'CIS - Unidade de Rio Branco'    },
  { value: 'foziguacu',    label: import.meta.env.VITE_UNIDADE_FOZIGUACU    || 'CIS - Unidade de Foz do Iguaçu' },
  { value: 'fazenda',      label: import.meta.env.VITE_UNIDADE_FAZENDA      || 'CIS - Unidade de Fazenda'       },
  { value: 'faxinal',      label: import.meta.env.VITE_UNIDADE_FAXINAL      || 'CIS - Unidade de Faxinal'       },
  { value: 'santamariana', label: import.meta.env.VITE_UNIDADE_SANTAMARIANA || 'CIS - Unidade de Santa Mariana' },
  { value: 'guarapuava',   label: import.meta.env.VITE_UNIDADE_GUARAPUAVA   || 'CIS - Unidade de Guarapuava'    },
  { value: 'carlopolis',   label: import.meta.env.VITE_UNIDADE_CARLOPOLIS   || 'CIS - Unidade de Carlópolis'    },
  { value: 'arapoti',      label: import.meta.env.VITE_UNIDADE_ARAPOTI      || 'CIS - Unidade de Arapoti'       },
];

export function Users() {
  const navigate = useNavigate();
  const currentUser = JSON.parse((sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user')) || '{}');

  useEffect(() => {
    if (currentUser.role !== 'Master' && currentUser.role !== 'Admin') {
      navigate('/dashboard');
    }
  }, [navigate, currentUser.role]);

  const availableRoles = allowedRolesToCreate[currentUser.role] || [];

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({ nome: '', email: '', password: '', role: 'Medico', unidade: '' });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteFinalConfirm, setShowDeleteFinalConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsUserId, setLogsUserId] = useState<number>(0);
  const [logsUserName, setLogsUserName] = useState<string>('');
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = (sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token'));
      const response = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!roleDropdownRef.current) return;
      if (!roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedRole]);

  const indexOfLastItem  = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems     = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages       = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const selectedRoleOption = ROLE_FILTER_OPTIONS.find((r) => r.value === selectedRole) || ROLE_FILTER_OPTIONS[0];

  const getUserInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const getUserUnitLabel = (user: User) => {
    if (user.role === 'Master') return 'Todas (Acesso Global)';
    return unidades.find(u => u.value === user.unidadeId)?.label || 'Não atribuída';
  };

  const handleCreate = () => {
    setModalMode('create');
    setEditingUser(null);
    // Admin: pré-seleciona sua própria unidade (lockada)
    const initialUnidade = currentUser.role === 'Admin' ? (currentUser.unidadeId || '') : '';
    setFormData({ nome: '', email: '', password: '', role: availableRoles[0] || 'Medico', unidade: initialUnidade });
    setFormError('');
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setEditingUser(user);
    // ✅ unidadeId já é string slug — sem .toString() ou parseInt
    setFormData({ nome: user.nome, email: user.email, password: '', role: user.role, unidade: user.unidadeId || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleShowLogs = (user: User) => {
    setLogsUserId(user.id);
    setLogsUserName(user.nome);
    setShowLogsModal(true);
  };

  const handleSave = async () => {
    setFormError('');

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
      const url = modalMode === 'create' ? '/api/auth/register' : `/api/auth/users/${editingUser?.id}`;

      const payload: any = {
        nome: formData.nome,
        email: formData.email,
        // Não envia role se Admin estiver editando seu próprio perfil (role já está travado)
        role: (modalMode === 'edit' && currentUser.role === 'Admin' && editingUser?.id === currentUser.id) 
          ? undefined 
          : formData.role,
        // ✅ Envia o slug direto — sem parseInt
        unidadeId: formData.unidade || null,
      };

      if (formData.password) payload.password = formData.password;

      const response = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        fetchUsers();
        setNotice({
          title: modalMode === 'create' ? 'Usuário criado' : 'Usuário atualizado',
          message: modalMode === 'create' ? 'Novo usuário criado com sucesso.' : 'Dados do usuário atualizados com sucesso.',
          type: 'success',
        });
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

  const handleDelete = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const token = (sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token'));
      const response = await fetch(`/api/auth/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchUsers();
        setShowDeleteConfirm(false);
        setShowDeleteFinalConfirm(false);
        setUserToDelete(null);
        setNotice({
          title: 'Usuário excluído',
          message: 'Usuário removido com sucesso.',
          type: 'success',
        });
      }
      else {
        setNotice({
          title: 'Falha ao excluir',
          message: 'Erro ao excluir usuário.',
          type: 'error',
        });
      }
    } catch (err) {
      setNotice({
        title: 'Falha de conexão',
        message: 'Erro de conexão com o servidor.',
        type: 'error',
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <MainLayout>
      {notice && (
        <ToastNotice
          title={notice.title}
          message={notice.message}
          type={notice.type}
          onClose={() => setNotice(null)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Controle de Usuários</h1>
            <p className="text-theme-muted mt-1">
              {isLoading ? 'Carregando usuários...' : `${filteredUsers.length} usuário(s) encontrado(s)`}
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
        <Card className="!p-4 relative z-30">
          <div className="flex flex-col gap-4">
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

            <div className="relative z-[80] w-full sm:w-auto" ref={roleDropdownRef}>
              <button
                onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-2 rounded-lg border transition-all duration-200 bg-theme-secondary border-theme-border hover:border-nautico/50 text-theme-primary text-sm font-medium ${
                  isRoleDropdownOpen ? 'ring-2 ring-nautico border-transparent' : 'hover:bg-theme-tertiary/70 hover:shadow-sm'
                }`}
              >
                <svg className="w-4 h-4 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A8.969 8.969 0 0012 21a8.969 8.969 0 006.879-3.196M15 11a3 3 0 11-6 0 3 3 0 016 0zM19.938 8.016A8.956 8.956 0 0012 3a8.956 8.956 0 00-7.938 5.016" />
                </svg>
                <span>{selectedRoleOption.label}</span>
                <svg className={`w-4 h-4 text-theme-muted transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute top-full mt-2 w-full sm:w-72 z-[70] bg-theme-secondary border border-theme-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="p-2">
                    {ROLE_FILTER_OPTIONS.map((role) => {
                      const isSelected = selectedRole === role.value;
                      return (
                        <button
                          key={role.value}
                          onClick={() => {
                            setSelectedRole(role.value);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                            isSelected
                              ? 'bg-nautico/10 text-nautico'
                              : 'text-theme-primary hover:bg-nautico/15 hover:text-nautico'
                          }`}
                        >
                          <span>{role.label}</span>
                          {isSelected && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </Card>

        {/* Tabela */}
        <Card className="overflow-hidden !p-0 relative z-10">
          <div className="lg:hidden divide-y divide-theme-light">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-theme-muted">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-nautico border-t-transparent rounded-full animate-spin" />
                  Carregando usuários...
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-4 py-8 text-center text-theme-muted">Nenhum usuário encontrado.</div>
            ) : (
              currentItems.map((user) => (
                <div key={user.id} className="p-4 space-y-3 hover:bg-nautico/5 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-nautico/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-nautico font-semibold text-sm">{getUserInitials(user.nome)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-theme-primary truncate">{user.nome}</p>
                        <p className="text-sm text-theme-muted truncate">{user.email}</p>
                      </div>
                    </div>

                    <Badge variant={roleColors[user.role]?.badge || 'default'}>
                      {roleColors[user.role]?.label || user.role}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-theme-muted">Unidade</p>
                    {user.role === 'Master' ? (
                      <p className="text-sm text-nautico font-medium break-words">{getUserUnitLabel(user)}</p>
                    ) : (
                      <p className="text-sm text-theme-secondary break-words">{getUserUnitLabel(user)}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
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
                    <Button variant="ghost" size="sm" title="Excluir" onClick={() => {
                      setUserToDelete(user);
                      setShowDeleteFinalConfirm(false);
                      setShowDeleteConfirm(true);
                    }}>
                      <svg className="w-4 h-4 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden lg:block overflow-x-auto scrollbar-thin">
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
                              {getUserInitials(user.nome)}
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
                            ? <span className="text-nautico font-medium">{getUserUnitLabel(user)}</span>
                            : getUserUnitLabel(user)
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
                          <Button variant="ghost" size="sm" title="Excluir" onClick={() => {
                            setUserToDelete(user);
                            setShowDeleteFinalConfirm(false);
                            setShowDeleteConfirm(true);
                          }}>
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-4 border-t border-theme-border bg-theme-secondary">
            <span className="text-sm text-theme-muted">
              {filteredUsers.length > 0
                ? <>Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredUsers.length)} de {filteredUsers.length} usuários</>
                : 'Nenhum resultado'
              }
            </span>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || filteredUsers.length === 0}>
                Anterior
              </Button>
              <span className="text-xs text-theme-muted font-medium px-2">
                Pág {currentPage} de {totalPages || 1}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || filteredUsers.length === 0}>
                Próximo
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-3 sm:p-4">
          <div className="bg-theme-card border border-theme-border rounded-xl w-full max-w-md shadow-2xl animate-scale-up max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-theme-border">
              <h2 className="text-lg sm:text-xl font-bold text-theme-primary">
                {modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-theme-muted hover:text-theme-primary transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 animate-fade-in">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-200">{formError}</span>
                </div>
              )}

              <Input label="Nome Completo" placeholder="Digite o nome..." value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />

              <Input label="E-mail" type="email" placeholder="usuario@exemplo.com" value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />

              <Input label={modalMode === 'create' ? 'Senha' : 'Nova Senha (deixe em branco para manter)'} type="password" placeholder="••••••••" value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-theme-secondary">Função</label>
                {/* Admin editando seu próprio perfil: função travada */}
                {modalMode === 'edit' && currentUser.role === 'Admin' && editingUser?.id === currentUser.id ? (
                  <>
                    <div className="w-full px-4 py-2.5 bg-theme-secondary border border-theme-border rounded-lg text-theme-muted cursor-not-allowed">
                      {roleColors[formData.role]?.label || formData.role}
                    </div>
                    <p className="text-xs text-theme-muted mt-1">Você não pode alterar sua própria função.</p>
                  </>
                ) : (
                  <>
                    <select value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      className="w-full px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent transition-all duration-200">
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>{roleColors[role]?.label || role}</option>
                      ))}
                    </select>
                    {currentUser.role === 'Admin' && (
                      <p className="text-xs text-theme-muted mt-1">Como administrador, você só pode criar Médicos e Enfermeiros.</p>
                    )}
                  </>
                )}
              </div>

              {formData.role !== 'Master' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-theme-secondary">Unidade</label>
                  {currentUser.role === 'Admin' ? (
                    // Admin: mostra unidade lockada (não editável)
                    <>
                      <div className="w-full px-4 py-2.5 bg-theme-secondary border border-theme-border rounded-lg text-theme-muted cursor-not-allowed">
                        {unidades.find(u => u.value === currentUser.unidadeId)?.label || 'Unidade não definida'}
                      </div>
                      <p className="text-xs text-theme-muted mt-1">Você só pode criar usuários para sua própria unidade.</p>
                    </>
                  ) : (
                    // Master: pode escolher qualquer unidade
                    <select value={formData.unidade} onChange={(e) => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent transition-all duration-200">
                      <option value="">Selecione uma unidade...</option>
                      {unidades.map((unidade) => (
                        <option key={unidade.value} value={unidade.value}>{unidade.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-theme-border">
              <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setShowModal(false)} disabled={isSaving}>Cancelar</Button>
              <Button className="w-full sm:w-auto" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
                ) : (
                  modalMode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <UserLogsModal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} userId={logsUserId} userName={logsUserName} />

      <ConfirmActionModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (isDeletingUser) return;
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          setShowDeleteFinalConfirm(true);
        }}
        isLoading={isDeletingUser}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir ${userToDelete?.nome || 'este usuário'}?`}
        confirmLabel="Continuar"
      />

      <ConfirmActionModal
        isOpen={showDeleteFinalConfirm}
        onClose={() => {
          if (isDeletingUser) return;
          setShowDeleteFinalConfirm(false);
        }}
        onConfirm={handleDelete}
        isLoading={isDeletingUser}
        title="Confirmação final"
        message={`Tem certeza que deseja excluir ${userToDelete?.nome || 'este usuário'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir usuário"
      />
    </MainLayout>
  );
}
