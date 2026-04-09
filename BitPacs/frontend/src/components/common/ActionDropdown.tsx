import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ActionItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

interface ActionDropdownProps {
  actions: ActionItem[];
}

export function ActionDropdown({ actions }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleActionClick = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Botão de toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-theme-muted hover:text-theme-primary hover:bg-nautico/10 rounded-lg transition-colors"
        title="Ações"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-theme-card border border-theme-border rounded-lg shadow-lg z-50 overflow-hidden">
          {actions.map((action, index) => (
            <div key={index}>
              {action.divider && index > 0 && (
                <div className="border-t border-theme-border" />
              )}
              <button
                onClick={() => handleActionClick(action.onClick)}
                className={`w-full px-4 py-2 flex items-center gap-3 text-sm font-medium transition-colors ${
                  action.variant === 'danger'
                    ? 'text-red-500 hover:bg-red-500/10'
                    : 'text-theme-primary hover:bg-nautico/10'
                }`}
              >
                <span className="flex-shrink-0">{action.icon}</span>
                <span className="flex-1 text-left">{action.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
