import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 192 });

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 192; // w-48
    const dividerCount = actions.filter((a) => a.divider).length;
    const estimatedHeight = Math.max(140, actions.length * 40 + dividerCount * 2 + 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    const measuredHeight = menuRef.current?.offsetHeight || estimatedHeight;

    const top = shouldOpenUp
      ? Math.max(8, rect.top - measuredHeight - 8)
      : Math.min(window.innerHeight - measuredHeight - 8, rect.bottom + 8);

    const left = Math.min(
      window.innerWidth - menuWidth - 8,
      Math.max(8, rect.right - menuWidth)
    );

    setMenuPosition({ top, left, width: menuWidth });
  }, [actions]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideMenu = menuRef.current?.contains(target);
      const clickedInsideButton = buttonRef.current?.contains(target);

      if (!clickedInsideMenu && !clickedInsideButton) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    updateMenuPosition();
    const raf = window.requestAnimationFrame(updateMenuPosition);

    const handleViewportChange = () => updateMenuPosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, updateMenuPosition]);

  const handleActionClick = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* Botão de toggle */}
      <button
        ref={buttonRef}
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
        createPortal(
          <div
            ref={menuRef}
            className="fixed bg-theme-card border border-theme-border rounded-lg shadow-xl z-[200] overflow-hidden"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
          >
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
          </div>,
          document.body
        )
      )}
    </div>
  );
}
