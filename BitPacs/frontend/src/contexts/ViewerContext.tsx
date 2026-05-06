import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type ViewerType = 'bitpacs' | 'ohif' | 'ask';

interface ViewerContextType {
  defaultViewer: ViewerType;
  setDefaultViewer: (viewer: ViewerType) => void;
}

const VIEWER_STORAGE_KEY = 'bitpacs-default-viewer';

const ViewerContext = createContext<ViewerContextType | undefined>(undefined);

interface ViewerProviderProps {
  children: ReactNode;
}

export function ViewerProvider({ children }: ViewerProviderProps) {
  const [defaultViewer, setDefaultViewerState] = useState<ViewerType>(() => {
    const stored = localStorage.getItem(VIEWER_STORAGE_KEY) as ViewerType | null;
    return stored || 'ask';
  });

  useEffect(() => {
    localStorage.setItem(VIEWER_STORAGE_KEY, defaultViewer);
  }, [defaultViewer]);

  const setDefaultViewer = (viewer: ViewerType) => {
    setDefaultViewerState(viewer);
  };

  return (
    <ViewerContext.Provider value={{ defaultViewer, setDefaultViewer }}>
      {children}
    </ViewerContext.Provider>
  );
}

export function useViewer() {
  const context = useContext(ViewerContext);
  if (context === undefined) {
    throw new Error('useViewer must be used within a ViewerProvider');
  }
  return context;
}
