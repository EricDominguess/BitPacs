import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../common';

const mockNotifications = [
  {
    id: 1,
    type: 'study',
    title: 'Novo estudo recebido',
    message: 'TC Tórax - Maria Silva',
    time: 'há 5 min',
    unread: true,
  },
  {
    id: 2,
    type: 'system',
    title: 'Backup concluído',
    message: 'Backup automático realizado com sucesso',
    time: 'há 30 min',
    unread: true,
  },
  {
    id: 3,
    type: 'study',
    title: 'Upload finalizado',
    message: 'RM Crânio - João Santos (45 imagens)',
    time: 'há 1 hora',
    unread: false,
  },
  {
    id: 4,
    type: 'warning',
    title: 'Armazenamento',
    message: 'Uso de disco acima de 75%',
    time: 'há 2 horas',
    unread: false,
  },
];

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fecha o popup ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'study':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'system':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'study':
        return 'bg-nautico/20 text-nautico';
      case 'system':
        return 'bg-ultra/20 text-ultra';
      case 'warning':
        return 'bg-accent-orange/20 text-accent-orange';
      default:
        return 'bg-purple/20 text-purple-light';
    }
  };

  return (
    <header className="h-[72px] bg-theme-primary/95 backdrop-blur-md border-b border-theme-light sticky top-0 z-50 transition-colors duration-300">
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
            <span className="text-xl font-bold text-theme-primary tracking-tight">
              Bit<span className="text-ultra">Pacs</span>
            </span>
            <span className="text-[10px] text-theme-muted -mt-1">suporte sob medida</span>
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar paciente, estudo ou ID..."
              className="w-full pl-10 pr-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent transition-all"
            />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notificações */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-theme-muted hover:text-theme-primary hover:bg-nautico/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-accent-red rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Popup de Notificações */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-theme-secondary border border-theme-border rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                {/* Header do Popup */}
                <div className="px-4 py-3 border-b border-theme-border flex items-center justify-between">
                  <h3 className="font-semibold text-theme-primary">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-nautico/20 text-nautico px-2 py-0.5 rounded-full">
                      {unreadCount} novas
                    </span>
                  )}
                </div>

                {/* Lista de Notificações */}
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-theme-light hover:bg-nautico/5 cursor-pointer transition-colors ${
                        notification.unread ? 'bg-nautico/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${notification.unread ? 'text-theme-primary' : 'text-theme-muted'}`}>
                              {notification.title}
                            </p>
                            {notification.unread && (
                              <span className="w-2 h-2 bg-nautico rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-theme-muted truncate mt-0.5">{notification.message}</p>
                          <p className="text-[10px] text-theme-muted mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer do Popup */}
                <div className="px-4 py-2 border-t border-theme-border bg-theme-card">
                  <button className="w-full text-center text-sm text-nautico hover:text-blue-intense font-medium py-1 transition-colors">
                    Ver todas as notificações
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ajuda */}
          <button className="p-2 text-theme-muted hover:text-theme-primary hover:bg-nautico/10 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
