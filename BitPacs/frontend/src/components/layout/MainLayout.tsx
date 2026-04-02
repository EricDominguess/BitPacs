import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useTokenValidator } from '../../hooks';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Valida token periodicamente para garantir single login
  useTokenValidator();

  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-300">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
