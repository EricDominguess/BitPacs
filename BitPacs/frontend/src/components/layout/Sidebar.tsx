import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { ContactModalLogged, ProfileModal } from '../common';

const navItems = [
  {
    label: 'Controle de usuários',
    href: '/users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Dashboard',
    href: '/user-dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Estudos',
    href: '/studies',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const location = useLocation();
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Pegando usuário logado dentro do componente para garantir dados atualizados
  const user = JSON.parse((sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user')) || '{}');

  return (
    <>
    <aside className={cn(
      "fixed left-0 top-[72px] h-[calc(100vh-72px)] bg-theme-secondary/50 border-r border-theme-light flex flex-col transition-all duration-300 z-50",
      isMinimized ? "w-20" : "w-64"
    )}>
      {/*Navegação scrollável*/}
      <nav className={cn(
        "p-4 flex flex-col gap-1 overflow-y-auto flex-1",
        isMinimized && "p-2"
      )}>
        {navItems
          .filter(item => {
            if (item.href === '/dashboard') return user.role === 'Master' || user.role === 'Admin';
            if (item.href === '/user-dashboard') return user.role !== 'Master' && user.role !== 'Admin';
            if (item.href === '/users') return user.role === 'Master' || user.role === 'Admin';

            return true;
          })
          .map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={isMinimized ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group justify-center md:justify-start',
                  isActive
                    ? 'bg-nautico text-white shadow-brand'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-nautico/10',
                  isMinimized && "px-3"
                )}
              >
                <span className={cn(
                  'transition-colors flex-shrink-0',
                  isActive ? 'text-ultra' : 'text-theme-muted group-hover:text-ultra'
                )}>
                  {item.icon}
                </span>
                {!isMinimized && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      {/* Botão Contatar Suporte */}
      <div className={cn(
        "px-4 py-2 bg-theme-secondary/50 border-b border-theme-light",
        isMinimized && "px-2"
      )}>
        <button
          onClick={() => setShowSupportModal(true)}
          title={isMinimized ? "Contatar Suporte" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-theme-muted hover:text-ultra hover:bg-ultra/10 transition-all duration-200 group justify-center md:justify-start",
            isMinimized && "px-3"
          )}
        >
          <span className="text-theme-muted group-hover:text-ultra transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          {!isMinimized && <span className="font-medium">Contatar Suporte</span>}
        </button>
      </div>

      {/* Footer do Sidebar */}
      <div className={cn(
        "p-4 border-t border-theme-light bg-theme-secondary/50",
        isMinimized && "p-2"
      )}>
        <button 
          onClick={() => setShowProfileModal(true)}
          className={cn(
            "w-full flex items-center gap-3 px-2 rounded-lg hover:bg-nautico/10 py-2 transition-colors group justify-center md:justify-start",
            isMinimized && "px-1"
          )}
        >
          {user.avatarUrl ? (
            <img 
              src={`${user.avatarUrl}`}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nautico to-purple-light flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
          {!isMinimized && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-theme-primary truncate group-hover:text-nautico transition-colors">
                {user.nome || 'Usuário'}
              </p>
              <p className="text-xs text-theme-muted truncate">{user.email || 'email@bitpacs.com'}</p>
            </div>
          )}
          {!isMinimized && (
            <svg className="w-4 h-4 text-theme-muted group-hover:text-nautico transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Botão de Minimizar */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Expandir" : "Minimizar"}
          className={cn(
            "w-full flex items-center gap-3 px-2 rounded-lg hover:bg-nautico/10 py-2 transition-colors group mt-2 justify-center md:justify-start"
          )}
        >
          <span className="text-theme-muted group-hover:text-ultra transition-colors flex-shrink-0">
            {isMinimized ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7m0 0l-7 7m7-7H6" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 0l-7 7 7 7" />
              </svg>
            )}
          </span>
          {!isMinimized && <span className="font-medium text-sm">Minimizar</span>}
        </button>
      </div>
    </aside>

    {/* Modal de Suporte */}
    <ContactModalLogged
      isOpen={showSupportModal} 
      onClose={() => setShowSupportModal(false)} 
    />

    {/* Modal de Perfil */}
    <ProfileModal
      isOpen={showProfileModal}
      onClose={() => setShowProfileModal(false)}
    />
    </>
  );
}
