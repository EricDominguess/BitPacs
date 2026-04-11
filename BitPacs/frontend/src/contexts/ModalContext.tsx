import { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isAnyModalOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        isSettingsOpen,
        setIsSettingsOpen,
        isAnyModalOpen: isSettingsOpen,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
