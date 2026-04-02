import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/fetchWithAuth';

export const useTokenValidator = () => {
  const navigate = useNavigate();

  const validateToken = useCallback(async () => {
    const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
    
    if (!token) return;

    try {
      const response = await fetchWithAuth('/api/auth/validate-token', {
        method: 'POST',
      });

      if (!response.ok) {
        // Token foi invalidado (novo login em outro lugar)
        handleTokenInvalidation();
        return;
      }

      const data = await response.json();
      if (!data.valid) {
        handleTokenInvalidation();
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      // Em caso de erro de rede, não faz logout (pode ser temporário)
    }
  }, []);

  const handleTokenInvalidation = useCallback(() => {
    // Remove tokens do storage
    localStorage.removeItem('bitpacs_token');
    localStorage.removeItem('bitpacs_user');
    localStorage.removeItem('bitpacs_token_expiry');

    sessionStorage.removeItem('bitpacs_token');
    sessionStorage.removeItem('bitpacs_user');
    sessionStorage.removeItem('bitpacs_token_expiry');

    // Redireciona para login com mensagem
    navigate('/', { state: { message: 'Sua sessão foi encerrada. Faça login novamente.' } });
  }, [navigate]);

  // Valida token a cada 30 segundos
  useEffect(() => {
    validateToken(); // Valida imediatamente ao montar
    const interval = setInterval(validateToken, 30000);

    return () => clearInterval(interval);
  }, [validateToken]);
};
