import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('Master' | 'Admin' | 'Medico' | 'Enfermeiro')[];
  requireAuth?: boolean;
}

// Verifica se o usuário está autenticado
function isAuthenticated(): boolean {
  const token = (sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token')) || localStorage.getItem('bitpacs_token');
  const user = (sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user')) || localStorage.getItem('bitpacs_user');
  return !!(token && user);
}

// Pega o usuário atual do sessionStorage
function getCurrentUser() {
  const userStr = (sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user')) || localStorage.getItem('bitpacs_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Verifica se o usuário tem uma das roles permitidas
function hasPermission(allowedRoles: string[]): boolean {
  const user = getCurrentUser();
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}

// Retorna a dashboard correta baseada no role do usuário
function getDefaultDashboard(): string {
  const user = getCurrentUser();
  if (!user) return '/login';
  
  if (user.role === 'Master' || user.role === 'Admin') {
    return '/dashboard';
  }
  return '/user-dashboard';
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: ProtectedRouteProps) {
  const location = useLocation();
  
  // Se requer autenticação e não está autenticado
  if (requireAuth && !isAuthenticated()) {
    // Salva a URL atual para redirecionar depois do login (opcional)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se tem roles específicas permitidas, verifica permissão
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasPermission(allowedRoles)) {
      // Redireciona para a dashboard apropriada do usuário
      return <Navigate to={getDefaultDashboard()} replace />;
    }
  }

  // Usuário autenticado e com permissão
  return <>{children}</>;
}

// Componente para rotas que NÃO devem ser acessíveis por usuários logados (ex: Login)
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to={getDefaultDashboard()} replace />;
  }
  return <>{children}</>;
}

// Exporta funções utilitárias para uso em outros componentes
export { isAuthenticated, getCurrentUser, hasPermission, getDefaultDashboard };
