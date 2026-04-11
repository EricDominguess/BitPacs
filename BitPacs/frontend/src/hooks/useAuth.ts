import { useState, useEffect } from 'react';

export interface User {
  id: number;
  nome: string;
  email: string;
  role: 'Master' | 'Admin' | 'Radiologist' | 'Technician';
  unidadeId?: string;
  avatarUrl?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  isTokenExpired: () => boolean;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  // Inicializa com dados salvos
  useEffect(() => {
    const loadStoredAuth = () => {
      // Tenta localStorage primeiro (Lembrar de mim)
      let storedToken = localStorage.getItem('bitpacs_token');
      let storedUser = localStorage.getItem('bitpacs_user');
      let storedExpiry = localStorage.getItem('bitpacs_token_expiry');

      // Se não encontrar, tenta sessionStorage
      if (!storedToken) {
        storedToken = sessionStorage.getItem('bitpacs_token');
        storedUser = sessionStorage.getItem('bitpacs_user');
        storedExpiry = sessionStorage.getItem('bitpacs_token_expiry');
      }

      // Valida token
      if (storedToken && storedExpiry) {
        const now = new Date().getTime();
        const expiry = parseInt(storedExpiry);

        if (now < expiry && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          // Token expirou, limpa tudo
          clearAuth();
        }
      }
    };

    loadStoredAuth();
  }, []);

  const logout = () => {
    // Remove de localStorage
    localStorage.removeItem('bitpacs_token');
    localStorage.removeItem('bitpacs_user');
    localStorage.removeItem('bitpacs_token_expiry');

    // Remove de sessionStorage
    sessionStorage.removeItem('bitpacs_token');
    sessionStorage.removeItem('bitpacs_user');
    sessionStorage.removeItem('bitpacs_token_expiry');

    clearAuth();
  };

  const isTokenExpired = (): boolean => {
    const expiry = localStorage.getItem('bitpacs_token_expiry') || sessionStorage.getItem('bitpacs_token_expiry');
    if (!expiry) return true;
    return new Date().getTime() > parseInt(expiry);
  };

  return {
    user,
    token,
    isAuthenticated,
    logout,
    isTokenExpired,
  };
};
