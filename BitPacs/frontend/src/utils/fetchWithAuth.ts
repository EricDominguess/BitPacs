/**
 * Utilitário para fazer requisições HTTP com token JWT automaticamente
 * Detecta expiração e redireciona para login se necessário
 */

export interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function fetchWithAuth(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;

  // Se não precisa de autenticação, faz requisição normal
  if (skipAuth) {
    return fetch(url, fetchOptions);
  }

  // Pega o token (localStorage primeiro, depois sessionStorage)
  let token = localStorage.getItem('bitpacs_token');
  if (!token) {
    token = sessionStorage.getItem('bitpacs_token');
  }

  // Verifica expiração
  let expiry = localStorage.getItem('bitpacs_token_expiry');
  if (!expiry) {
    expiry = sessionStorage.getItem('bitpacs_token_expiry');
  }

  if (expiry && new Date().getTime() > parseInt(expiry)) {
    // Token expirou, limpa tudo e redireciona
    localStorage.removeItem('bitpacs_token');
    localStorage.removeItem('bitpacs_user');
    localStorage.removeItem('bitpacs_token_expiry');
    sessionStorage.removeItem('bitpacs_token');
    sessionStorage.removeItem('bitpacs_user');
    sessionStorage.removeItem('bitpacs_token_expiry');
    
    window.location.href = '/login';
    throw new Error('Token expirado');
  }

  // Adiciona o token no header
  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Se recebeu 401 (não autorizado), token pode ter expirado
  if (response.status === 401) {
    localStorage.removeItem('bitpacs_token');
    localStorage.removeItem('bitpacs_user');
    localStorage.removeItem('bitpacs_token_expiry');
    sessionStorage.removeItem('bitpacs_token');
    sessionStorage.removeItem('bitpacs_user');
    sessionStorage.removeItem('bitpacs_token_expiry');
    
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return response;
}
