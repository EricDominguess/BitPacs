import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useTokenValidator } from '../../hooks';
import { useModal } from '../../contexts';
import { useState, useEffect } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Valida token periodicamente para garantir single login
  useTokenValidator();
  const { isAnyModalOpen } = useModal();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('bitpacs_sidebar_minimized');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('bitpacs_sidebar_minimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-300">
      <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
      <div className="flex">
        <Sidebar
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />
        <main className={`flex-1 ml-0 ${isMinimized ? 'md:ml-20' : 'md:ml-64'} p-3 sm:p-4 md:p-6 overflow-auto scrollbar-thin transition-all duration-300 ${isAnyModalOpen ? 'pointer-events-none blur-sm' : ''}`}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
