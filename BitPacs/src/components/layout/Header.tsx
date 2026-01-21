import { Link } from 'react-router-dom';
import { Button } from '../common';

export function Header() {
  return (
    <header className="h-[72px] bg-tangaroa/95 backdrop-blur-md border-b border-purple/20 sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          {/* Ícone estilizado baseado na identidade */}
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-ultra rounded-lg transform rotate-45 group-hover:rotate-90 transition-transform duration-300" />
            <div className="absolute inset-1 bg-nautico rounded-md transform rotate-45 group-hover:rotate-90 transition-transform duration-300" />
            <div className="absolute inset-2 bg-ultra rounded-sm transform rotate-45 group-hover:rotate-90 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white tracking-tight">
              Bit<span className="text-ultra">Pacs</span>
            </span>
            <span className="text-[10px] text-white/50 -mt-1">suporte sob medida</span>
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar paciente, estudo ou ID..."
              className="w-full pl-10 pr-4 py-2 bg-purple-dark/50 border border-purple/30 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notificações */}
          <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full" />
          </button>

          {/* Ajuda */}
          <button className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <div className="w-px h-8 bg-purple/30" />

          <Button variant="secondary" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Upload
          </Button>
        </div>
      </div>
    </header>
  );
}
