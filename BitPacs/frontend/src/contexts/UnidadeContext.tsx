import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Configuração das unidades do .env
const UNIDADES_CONFIG = {
  localhost: {
    value: 'localhost',
    label: 'Nenhuma (Localhost)',
    orthancUrl: 'http://localhost:8042',
    storageTotalGB: 0,
  },
  riobranco: {
    value: 'riobranco',
    label: import.meta.env.VITE_UNIDADE_RIOBRANCO || 'CIS - Unidade de Rio Branco',
    orthancUrl: import.meta.env.VITE_ORTHANC_IP_RIOBRANCO || 'http://localhost:8042',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_RIOBRANCO) || 1020,
  },
  foziguacu: {
    value: 'foziguacu',
    label: import.meta.env.VITE_UNIDADE_FOZIGUACU || 'CIS - Unidade de Foz do Iguaçu',
    orthancUrl: import.meta.env.VITE_ORTHANC_IP_FOZIGUACU || 'http://localhost:8042',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_FOZIGUACU) || 1020,
  },
  fazenda: {
    value: 'fazenda',
    label: import.meta.env.VITE_UNIDADE_FAZENDA || 'CIS - Unidade de Fazenda',
    orthancUrl: import.meta.env.VITE_ORTHANC_IP_FAZENDA || 'http://localhost:8042',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_FAZENDA) || 1080,
  },
  faxinal: {
    value: 'faxinal',
    label: import.meta.env.VITE_UNIDADE_FAXINAL || 'CIS - Unidade de Faxinal',
    orthancUrl: import.meta.env.VITE_ORTHANC_IP_FAXINAL || 'http://localhost:8042',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_FAXINAL) || 1020,
  },
  santamariana: {
    value: 'santamariana',
    label: import.meta.env.VITE_UNIDADE_SANTAMARIANA || 'CIS - Unidade de Santa Mariana',
    orthancUrl: import.meta.env.VITE_ORTHANC_IP_SANTAMARIANA || 'http://localhost:8042',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_SANTAMARIANA) || 1020,
  },
  guarapuava: {
    value: 'guarapuava',
    label: import.meta.env.VITE_UNIDADE_GUARAPUAVA || 'CIS - Unidade de Guarapuava',
    orthancUrl: import.meta.env.VITE_ORTHANC_IP_GUARAPUAVA || 'http://localhost:8042',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_GUARAPUAVA) || 1020,
  },
  carlopolis: {
    value: 'carlopolis',
    label: import.meta.env.VITE_UNIDADE_CARLOPOLIS || 'CIS - Unidade de Carlópolis',
    orthancUrl: import.meta.env.VITE_ORTHANC_IP_CARLOPOLIS || 'http://localhost:8042',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_CARLOPOLIS) || 1020,
  },
  arapoti: {
    value: 'arapoti',
    label: import.meta.env.VITE_UNIDADE_ARAPOTI || 'CIS - Unidade de Arapoti',
    orthancUrl: import.meta.env.VITE_ORTHANC_IP_ARAPOTI || 'http://localhost:8042',
    storageTotalGB: Number(import.meta.env.VITE_STORAGE_TOTAL_ARAPOTI) || 1020,
  },
};

type UnidadeKey = keyof typeof UNIDADES_CONFIG;

interface UnidadeContextType {
  unidade: UnidadeKey;
  unidadeLabel: string;
  orthancUrl: string;
  storageTotalBytes: number; // Capacidade total de armazenamento em bytes
  setUnidade: (unidade: UnidadeKey) => void;
  unidadesDisponiveis: typeof UNIDADES_CONFIG;
  isMaster: boolean;
  isUnidadeSelected: boolean; // Indica se o Master já escolheu uma unidade real
}

const UnidadeContext = createContext<UnidadeContextType | undefined>(undefined);

interface UnidadeProviderProps {
  children: ReactNode;
}

export function UnidadeProvider({ children }: UnidadeProviderProps) {
  // Pega o usuário logado
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = (sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user')) || localStorage.getItem('bitpacs_user');
    return stored ? JSON.parse(stored) : null;
  });

  const isMaster = currentUser?.role === 'Master';

  // Determina a unidade inicial
  const getInitialUnidade = (): UnidadeKey => {
    // Se for Master, verifica se tem preferência salva, senão inicia em localhost
    if (isMaster) {
      const stored = localStorage.getItem('bitpacs-unidade-master');
      if (stored && stored in UNIDADES_CONFIG) {
        return stored as UnidadeKey;
      }
      // Master inicia em localhost (sem unidade selecionada)
      return 'localhost';
    } else if (currentUser?.unidade) {
      // Se não for Master, usa a unidade do usuário
      if (currentUser.unidade in UNIDADES_CONFIG) {
        return currentUser.unidade as UnidadeKey;
      }
    }
    // Padrão: fazenda
    return 'fazenda';
  };

  const [unidade, setUnidadeState] = useState<UnidadeKey>(getInitialUnidade);

  // Atualiza quando o usuário muda
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = (sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user')) || localStorage.getItem('bitpacs_user');
      const user = stored ? JSON.parse(stored) : null;
      setCurrentUser(user);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Atualiza a unidade quando o usuário muda (para não-Master)
  useEffect(() => {
    if (!isMaster && currentUser?.unidade && currentUser.unidade in UNIDADES_CONFIG) {
      setUnidadeState(currentUser.unidade as UnidadeKey);
    }
  }, [currentUser, isMaster]);

  // Reset para localhost quando Master faz login
  useEffect(() => {
    if (isMaster) {
      const stored = localStorage.getItem('bitpacs-unidade-master');
      if (!stored) {
        setUnidadeState('localhost');
      }
    }
  }, [isMaster]);

  const setUnidade = (novaUnidade: UnidadeKey) => {
    // Apenas Master pode trocar manualmente
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

// Exporta as configurações para uso em outros lugares
export { UNIDADES_CONFIG };
export type { UnidadeKey };
