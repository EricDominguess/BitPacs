import { useEffect, useCallback, useRef } from 'react';
import { fetchWithAuth } from '../utils/fetchWithAuth';

export const useTokenValidator = () => {
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTokenInvalidation = useCallback(() => {
    // Remove tokens do storage
    localStorage.removeItem('bitpacs_token');
    localStorage.removeItem('bitpacs_user');
    localStorage.removeItem('bitpacs_token_expiry');

    sessionStorage.removeItem('bitpacs_token');
    sessionStorage.removeItem('bitpacs_user');
    sessionStorage.removeItem('bitpacs_token_expiry');

    // Redireciona para login
    window.location.href = '/';
  }, []);

  const validateToken = useCallback(async () => {
    const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
    
    if (!token) {
      return;
    }

    try {
      const response = await fetchWithAuth('/api/auth/validate-token', {
        method: 'POST',
      });

      if (!response.ok) {
        // Token foi invalidado (novo login em outro lugar)
        console.log('Token inválido - fazendo logout');
        handleTokenInvalidation();
        return;
      }

      const data = await response.json();
      if (!data.valid) {
        console.log('Token não é válido - fazendo logout');
        handleTokenInvalidation();
        return;
      }

      // Se tudo ok, agenda próxima validação
      scheduleNextValidation();
    } catch (error) {
      console.error('Erro ao validar token:', error);
      // Em caso de erro de rede, agenda nova tentativa
      scheduleNextValidation();
    }
  }, [handleTokenInvalidation]);

  const scheduleNextValidation = useCallback(() => {
    // Limpa timeout anterior se existir
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Agenda próxima validação em 30 segundos
    validationTimeoutRef.current = setTimeout(validateToken, 30000);
  }, [validateToken]);

  // Configura validação inicial
  useEffect(() => {
    const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
    
    if (token) {
      // Valida imediatamente
      validateToken();
    }

    // Cleanup
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [validateToken]);
};
