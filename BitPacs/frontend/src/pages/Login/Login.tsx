import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, ContactModal } from '../../components/common';

export function Login() {
  // Estados do Formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Estados de Controle
  const [isLoading, setIsLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [error, setError] = useState(''); // <--- Novo estado para erros

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Limpa erro anterior ao tentar de novo

    try {
      // 1. Conexão real com sua API .NET (que fala com o Postgres)
      // Ajuste a URL '...' para a porta da sua API C#
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password 
        }),
      });

      if (response.ok) {
        // Sucesso: Pega o token que o C# devolveu
        const data = await response.json();
        
        // Salva no navegador para manter logado
        sessionStorage.setItem('bitpacs_token', data.token);
        sessionStorage.setItem('bitpacs_user', JSON.stringify(data.user));
        localStorage.setItem('bitpacs-theme', 'light');        

        // Redireciona baseado no role do usuário
        // Master e Admin vão para /dashboard, outros vão para /user-dashboard
        const isAdminOrMaster = data.user.role === 'Master' || data.user.role === 'Admin';
        window.location.href = isAdminOrMaster ? '/dashboard' : '/user-dashboard';
      } else {
        // Erro: Senha errada ou usuário não existe
        setError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      // Erro de Rede (API fora do ar)
      setError('Erro de conexão com o servidor.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tangaroa flex">
      {/* Lado Esquerdo - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-ultra rounded-lg transform rotate-45" />
              <div className="absolute inset-1 bg-nautico rounded-md transform rotate-45" />
              <div className="absolute inset-2 bg-ultra rounded-sm transform rotate-45" />
            </div>
            <span className="text-2xl font-bold text-white">
              Bit<span className="text-ultra">Pacs</span>
            </span>
          </Link>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo!</h1>
            <p className="text-white/60">Entre com suas credenciais para acessar o sistema</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* MENSAGEM DE ERRO (Aparece só quando necessário) */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 animate-fade-in">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-200">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
            </div>

            {/* Opções */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-purple/40 rounded bg-tangaroa peer-checked:bg-nautico peer-checked:border-nautico transition-all" />
                  <svg 
                    className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  Lembrar de mim
                </span>
              </label>

              {/* Botão Esqueceu a Senha (Com Cursor Pointer e Modal) */}
              <button 
                type="button"
                onClick={() => setShowContactModal(true)}
                className="text-sm text-nautico hover:text-blue-intense transition-colors hover:underline cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão de Login (Com Cursor Pointer) */}
            <Button 
              type="submit" 
              className="w-full cursor-pointer" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </Button>
          </form>

          {/* Link para Criar Conta (Também abre o Modal) */}
          <p className="mt-8 text-center text-white/60">
            Não tem uma conta?{' '}
            <button 
              onClick={() => setShowContactModal(true)}
              className="text-ultra hover:text-green-aqua transition-colors font-medium cursor-pointer"
            >
              Entre em contato
            </button>
          </p>

          {/* Modal de Contato (Reutilizado) */}
          <ContactModal 
            isOpen={showContactModal} 
            onClose={() => setShowContactModal(false)} 
          />
        </div>
      </div>

      {/* Lado Direito - Visual (Mantido igual) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-nautico to-purple-light p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-ultra/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-8 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Sistema PACS Completo
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Gerencie imagens médicas DICOM com eficiência, segurança e conformidade.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-white">50K+</p>
              <p className="text-sm text-white/70">Estudos</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-sm text-white/70">Uptime</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-sm text-white/70">Suporte</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-dark/50 to-transparent" />
      </div>
    </div>
  );
}
