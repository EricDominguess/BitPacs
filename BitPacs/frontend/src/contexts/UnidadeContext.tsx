import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const UNIDADES_CONFIG = {
  localhost: {
    value: 'localhost',
    label: 'Nenhuma (Localhost)',
    orthancUrl: '/orthanc',
    storageTotalGB: 0,
  },
  riobranco: {
    value: 'riobranco',
    label: import.meta.env.VITE_UNIDADE_RIOBRANCO || 'CIS - Unidade de Rio Branco',
    orthancUrl: '/orthanc-riobranco',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_RIOBRANCO) || 1020,
  },
  foziguacu: {
    value: 'foziguacu',
    label: import.meta.env.VITE_UNIDADE_FOZIGUACU || 'CIS - Unidade de Foz do Iguaçu',
    orthancUrl: '/orthanc-foziguacu',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_FOZIGUACU) || 1020,
  },
  fazenda: {
    value: 'fazenda',
    label: import.meta.env.VITE_UNIDADE_FAZENDA || 'CIS - Unidade de Fazenda',
    orthancUrl: '/orthanc-fazenda',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_FAZENDA) || 1080,
  },
  faxinal: {
    value: 'faxinal',
    label: import.meta.env.VITE_UNIDADE_FAXINAL || 'CIS - Unidade de Faxinal',
    orthancUrl: '/orthanc-faxinal',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_FAXINAL) || 1020,
  },
  santamariana: {
    value: 'santamariana',
    label: import.meta.env.VITE_UNIDADE_SANTAMARIANA || 'CIS - Unidade de Santa Mariana',
    orthancUrl: '/orthanc-santamariana',
    storageTotalGB: 1020,
  },
  guarapuava: {
    value: 'guarapuava',
    label: import.meta.env.VITE_UNIDADE_GUARAPUAVA || 'CIS - Unidade de Guarapuava',
    orthancUrl: '/orthanc-guarapuava',
    storageTotalGB: 1020,
  },
  carlopolis: {
    value: 'carlopolis',
    label: import.meta.env.VITE_UNIDADE_CARLOPOLIS || 'CIS - Unidade de Carlópolis',
    orthancUrl: '/orthanc-carlopolis',
    storageTotalGB: 1020,
  },
  arapoti: {
    value: 'arapoti',
    label: import.meta.env.VITE_UNIDADE_ARAPOTI || 'CIS - Unidade de Arapoti',
    orthancUrl: '/orthanc-arapoti',
    storageTotalGB: 1020,
  },
};

type UnidadeKey = keyof typeof UNIDADES_CONFIG;

interface UnidadeContextType {
  unidade: UnidadeKey;
  unidadeLabel: string;
  orthancUrl: string;
  storageTotalBytes: number;
  setUnidade: (unidade: UnidadeKey) => void;
  unidadesDisponiveis: typeof UNIDADES_CONFIG;
  isMaster: boolean;
  isUnidadeSelected: boolean;
}

const UnidadeContext = createContext<UnidadeContextType | undefined>(undefined);

interface UnidadeProviderProps {
  children: ReactNode;
}

export function UnidadeProvider({ children }: UnidadeProviderProps) {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user');
    return stored ? JSON.parse(stored) : null;
  });

  const isMaster = currentUser?.role === 'Master';

  const getInitialUnidade = (): UnidadeKey => {
    if (isMaster) {
      const stored = localStorage.getItem('bitpacs-unidade-master');
      if (stored && stored in UNIDADES_CONFIG) return stored as UnidadeKey;
      return 'localhost';
    }

    // ✅ Lê unidadeId (slug string) em vez de unidade
    const slug = currentUser?.unidadeId;
    if (slug && slug in UNIDADES_CONFIG) return slug as UnidadeKey;

    return 'localhost';
  };

  const [unidade, setUnidadeState] = useState<UnidadeKey>(getInitialUnidade);

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user');
      const user = stored ? JSON.parse(stored) : null;
      setCurrentUser(user);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ✅ Atualiza unidade quando currentUser muda, lendo unidadeId
  useEffect(() => {
    if (!isMaster) {
      const slug = currentUser?.unidadeId;
      if (slug && slug in UNIDADES_CONFIG) {
        setUnidadeState(slug as UnidadeKey);
      }
    }
  }, [currentUser, isMaster]);

  useEffect(() => {
    if (isMaster) {
      const stored = localStorage.getItem('bitpacs-unidade-master');
      if (!stored) setUnidadeState('localhost');
    }
  }, [isMaster]);

  const setUnidade = (novaUnidade: UnidadeKey) => {
    if (isMaster) {
      setUnidadeState(novaUnidade);
      localStorage.setItem('bitpacs-unidade-master', novaUnidade);
    }
  };

  const config = UNIDADES_CONFIG[unidade];
  const isUnidadeSelected = unidade !== 'localhost';
  const storageTotalBytes = config.storageTotalGB * 1024 * 1024 * 1024;

  return (
    <UnidadeContext.Provider
      value={{
        unidade,
        unidadeLabel: config.label,
        orthancUrl: config.orthancUrl,
        storageTotalBytes,
        setUnidade,
        unidadesDisponiveis: UNIDADES_CONFIG,
        isMaster,
        isUnidadeSelected,
      }}
    >
      {children}
    </UnidadeContext.Provider>
  );
}

export function useUnidade() {
  const context = useContext(UnidadeContext);
  if (context === undefined) {
    throw new Error('useUnidade must be used within a UnidadeProvider');
  }
  return context;
}

export { UNIDADES_CONFIG };
export type { UnidadeKey };