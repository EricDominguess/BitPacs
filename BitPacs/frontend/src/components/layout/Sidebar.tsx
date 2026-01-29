import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { ContactModal, ProfileModal } from '../common';

const navItems = [
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

  return (
    <>
    <aside className="w-64 bg-theme-secondary/50 border-r border-theme-light min-h-[calc(100vh-72px)] flex flex-col transition-colors duration-300">
      <nav className="p-4 flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-nautico text-white shadow-brand'
                  : 'text-theme-muted hover:text-theme-primary hover:bg-nautico/10'
              )}
            >
              <span className={cn(
                'transition-colors',
                isActive ? 'text-ultra' : 'text-theme-muted group-hover:text-ultra'
              )}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Botão Contatar Suporte */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowSupportModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-theme-muted hover:text-ultra hover:bg-ultra/10 transition-all duration-200 group"
        >
          <span className="text-theme-muted group-hover:text-ultra transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          <span className="font-medium">Contatar Suporte</span>
        </button>
      </div>

      {/* Footer do Sidebar */}
      <div className="p-4 border-t border-theme-light">
        <button 
          onClick={() => setShowProfileModal(true)}
          className="w-full flex items-center gap-3 px-2 rounded-lg hover:bg-nautico/10 py-2 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nautico to-purple-light flex items-center justify-center">
            <span className="text-sm font-semibold text-white">U</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-theme-primary truncate group-hover:text-nautico transition-colors">Usuário</p>
            <p className="text-xs text-theme-muted truncate">admin@bitpacs.com</p>
          </div>
          <svg className="w-4 h-4 text-theme-muted group-hover:text-nautico transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </aside>

    {/* Modal de Suporte */}
    <ContactModal 
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
