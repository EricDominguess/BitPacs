import { Link } from 'react-router-dom';
import { Button } from '../../components/common';

export function Home() {
  return (
    <div className="min-h-screen bg-tangaroa overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Decorativo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-nautico/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-ultra/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple/10 rounded-full blur-3xl" />
        </div>

        {/* Header Simples */}
        <header className="relative z-10 px-8 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-ultra rounded-lg transform rotate-45" />
              <div className="absolute inset-1 bg-nautico rounded-md transform rotate-45" />
              <div className="absolute inset-2 bg-ultra rounded-sm transform rotate-45" />
            </div>
            <span className="text-2xl font-bold text-white">
              Bit<span className="text-ultra">Pacs</span>
            </span>
          </Link>

          <nav className="flex items-center gap-8">
            <a href="#features" className="text-white/70 hover:text-white transition-colors">Recursos</a>
            <a href="#about" className="text-white/70 hover:text-white transition-colors">Sobre</a>
            <Link to="/dashboard">
              <Button variant="secondary" size="sm">Acessar Sistema</Button>
            </Link>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 px-8 py-20 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-nautico/20 border border-nautico/30 rounded-full">
                <span className="w-2 h-2 bg-ultra rounded-full animate-pulse" />
                <span className="text-sm text-white/80">Sistema PACS Moderno</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Gestão de Imagens
                <span className="block text-gradient">DICOM Inteligente</span>
              </h1>

              <p className="text-lg text-white/60 max-w-lg">
                Plataforma completa para armazenamento, visualização e gerenciamento 
                de estudos médicos. Performance e segurança para sua instituição.
              </p>

              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button size="lg">
                    Começar Agora
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <Link to="/studies">
                  <Button variant="outline" size="lg">Ver Estudos</Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-8 border-t border-purple/20">
                <div>
                  <p className="text-3xl font-bold text-ultra">50K+</p>
                  <p className="text-sm text-white/50">Estudos Processados</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-ultra">99.9%</p>
                  <p className="text-sm text-white/50">Uptime</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-ultra">10ms</p>
                  <p className="text-sm text-white/50">Latência Média</p>
                </div>
              </div>
            </div>

            {/* Visual Element */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square">
                {/* Grafismo Animado */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-4">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-nautico/20 rounded-lg animate-pulse"
                      style={{
                        animationDelay: `${i * 100}ms`,
                        opacity: Math.random() * 0.5 + 0.3,
                      }}
                    />
                  ))}
                </div>
                
                {/* Centro destacado */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-nautico to-purple-light rounded-2xl shadow-brand flex items-center justify-center">
                  <svg className="w-24 h-24 text-ultra" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="px-8 py-20 bg-purple-dark/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Recursos Principais</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar imagens médicas com eficiência
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                ),
                title: 'Upload DICOM',
                description: 'Importação rápida e segura de arquivos DICOM com validação automática.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
                title: 'Visualizador Avançado',
                description: 'Ferramentas completas de visualização, zoom, pan e medições.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Segurança Total',
                description: 'Criptografia de ponta a ponta e conformidade com LGPD e HIPAA.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Alta Performance',
                description: 'Carregamento otimizado com streaming progressivo de imagens.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: 'Busca Inteligente',
                description: 'Encontre estudos rapidamente por paciente, data ou modalidade.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                ),
                title: 'Integração DICOM',
                description: 'Compatível com protocolos DIMSE e DICOMweb.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-tangaroa/50 border border-purple/20 rounded-xl hover:border-nautico/50 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-nautico/20 rounded-lg flex items-center justify-center text-ultra mb-4 group-hover:bg-nautico/30 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-purple/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-ultra rounded transform rotate-45" />
              <div className="absolute inset-0.5 bg-nautico rounded transform rotate-45" />
            </div>
            <span className="font-semibold text-white">BitPacs</span>
          </div>
          <p className="text-sm text-white/50">
            © 2026 BitFix. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
