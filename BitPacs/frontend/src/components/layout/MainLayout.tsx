import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useTokenValidator } from '../../hooks';
import { useState } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Valida token periodicamente para garantir single login
  useTokenValidator();
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-300">
      <Header />
      <div className="flex">
        <Sidebar isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
        <main className={`flex-1 ${isMinimized ? 'ml-20' : 'ml-64'} p-6 overflow-auto scrollbar-thin transition-all duration-300`}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
