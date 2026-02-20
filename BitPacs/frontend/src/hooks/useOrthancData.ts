import { useState, useEffect, useCallback, useRef } from 'react';

// Intervalo entre atualizações (em ms)
const INTERVALO_ATUALIZACAO = 15000;

// Configuração das unidades
const UNIDADES_CONFIG: Record<string, { orthancProxy: string }> = {
  localhost: { orthancProxy: '/orthanc' }, // Localhost usa o proxy padrão
  fazenda: { orthancProxy: '/orthanc-fazenda' },
  riobranco: { orthancProxy: '/orthanc-riobranco' },
  foziguacu: { orthancProxy: '/orthanc-foziguacu' },
};

interface UseOrthancDataReturn {
  pacientes: any[];
  estudos: any[];
  series: any[];
  seriesByStudy: Map<string, any[]>;
  status: any;
  isLoading: boolean;
  isMonitoring: boolean;
  error: string | null;
  refetch: () => void;
  unidadeAtual: string;
}

/**
 * Super Hook OTIMIZADO que combina:
 * - Fetch inicial de dados do Orthanc (pacientes, estudos, séries)
 * - Monitoramento em tempo real de mudanças
 * - Indexação de séries por estudo para busca O(1)
 * - Suporte a múltiplas unidades
 */
export function useOrthancData(): UseOrthancDataReturn {
  // Pega a unidade do localStorage/contexto
  const getUnidadeAtual = useCallback(() => {
    const userStorage = sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user');
    const user = JSON.parse(userStorage || '{}');
    const isMaster = user?.role === 'Master';
    
    if (isMaster) {
      return localStorage.getItem('bitpacs-unidade-master') || 'fazenda';
    }
    return user?.unidade || 'fazenda';
  }, []);

  const [unidadeAtual, setUnidadeAtual] = useState(getUnidadeAtual);

  // Estados de dados
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [estudos, setEstudos] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [seriesByStudy, setSeriesByStudy] = useState<Map<string, any[]>>(new Map());
  const [status, setStatus] = useState<any>(null);
  
  // Estados de controle
  const [isLoading, setIsLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para o monitoramento de mudanças
  const lastSequenceRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);

  // Obtém o prefixo do proxy baseado na unidade
  const getProxyPrefix = useCallback(() => {
    const config = UNIDADES_CONFIG[unidadeAtual];
    return config?.orthancProxy || '/orthanc';
  }, [unidadeAtual]);

  /**
   * Carrega todos os dados do Orthanc
   */
  const carregarTudo = useCallback(async () => {
    // Evita múltiplas requisições simultâneas
    if (isLoadingRef.current) {
      console.log("⏳ Já está carregando, ignorando...");
      return;
    }

    isLoadingRef.current = true;
    const timestamp = Date.now();
    const proxyPrefix = getProxyPrefix();
    console.log(`🔄 Carregando tudo do Orthanc (${unidadeAtual})... Proxy: ${proxyPrefix}`);
    setError(null);
    
    try {
      // Carrega estudos e estatísticas primeiro (mais importantes)
      const [estudosRes, statsRes] = await Promise.all([
        fetch(`${proxyPrefix}/studies?expand&_t=${timestamp}`),
        fetch(`${proxyPrefix}/statistics?_t=${timestamp}`)
      ]);

      if (!estudosRes.ok || !statsRes.ok) {
        throw new Error('Falha ao carregar dados do Orthanc');
      }

      const [estudosData, statsData] = await Promise.all([
        estudosRes.json(),
        statsRes.json()
      ]);

      // Atualiza estudos e status imediatamente para UI responsiva
      setEstudos(estudosData);
      setStatus(statsData);
      setIsLoading(false);

      // Carrega séries em paralelo
      console.log(`🛡️ Buscando séries via Cache do C# para a unidade: ${unidadeAtual}`);
      const seriesRes = await fetch(`/api/dashboard/series/${unidadeAtual}`);
      if (seriesRes.ok) {
        const seriesData = await seriesRes.json();
        
        // Cria índice de séries por estudo para busca O(1)
        const seriesMap = new Map<string, any[]>();
        seriesData.forEach((serie: any) => {
          const studyId = serie.ParentStudy;
          if (!seriesMap.has(studyId)) {
            seriesMap.set(studyId, []);
          }
          seriesMap.get(studyId)!.push(serie);
        });
        
        setSeries(seriesData);
        setSeriesByStudy(seriesMap);
      } else {
        console.warn(`⚠️ Falha ao carregar séries do Cache do C#. Status: ${seriesRes.status}`);
      }

      // Carrega pacientes
      const pacientesRes = await fetch(`${proxyPrefix}/patients?_t=${timestamp}`);
      if (pacientesRes.ok) {
        const pacientesData = await pacientesRes.json();
        setPacientes(pacientesData);
      }

      console.log(`✅ Dados carregados: ${estudosData.length} estudos`);
      
    } catch (erro) {
      console.error("❌ Erro ao carregar dados:", erro);
      setError(erro instanceof Error ? erro.message : 'Erro desconhecido');
      setIsLoading(false);
    } finally {
      isLoadingRef.current = false;
    }
  }, [getProxyPrefix, unidadeAtual]);

  /**
   * Verifica mudanças no Orthanc e recarrega se necessário
   */
  const checkChanges = useCallback(async () => {
    const proxyPrefix = getProxyPrefix();
    
    try {
      // Primeira execução: pega o último ID de sequência
      if (lastSequenceRef.current === 0) {
        const response = await fetch(`${proxyPrefix}/changes?descending=true&limit=1`);
        const data = await response.json();
        lastSequenceRef.current = data.Last || 0;
        console.log(`🔔 Monitor iniciado. Última sequência: ${lastSequenceRef.current}`);
        setIsMonitoring(true);
        return;
      }

      // Verifica se há mudanças desde a última sequência
      const response = await fetch(`${proxyPrefix}/changes?since=${lastSequenceRef.current}&limit=100`);
      const data = await response.json();

      if (data.Last > lastSequenceRef.current) {
        console.log(`🔔 Novas mudanças detectadas! (De ${lastSequenceRef.current} para ${data.Last})`);
        lastSequenceRef.current = data.Last;

        // Filtra apenas mudanças relevantes (novos estudos ou séries)
        const listaDeTipos = data.Changes.map((change: any) => change.ChangeType);
        console.log("📋 Tipos de mudanças:", listaDeTipos);

        const temNovidadeReal = listaDeTipos.includes('NewStudy') || listaDeTipos.includes('NewSeries');

        if (temNovidadeReal) {
          console.log("🆕 Novo exame detectado. Recarregando dados...");
          carregarTudo();
        }
      }
    } catch (error) {
      console.error("❌ Erro ao verificar mudanças:", error);
    }
  }, [carregarTudo, getProxyPrefix]);

  // Efeito para detectar mudanças de unidade (via storage event)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bitpacs-unidade-master' || e.key === 'bitpacs_user') {
        const novaUnidade = getUnidadeAtual();
        if (novaUnidade !== unidadeAtual) {
          console.log(`🔄 Unidade alterada: ${unidadeAtual} -> ${novaUnidade}`);
          setUnidadeAtual(novaUnidade);
          lastSequenceRef.current = 0; // Reset do monitor
          setIsLoading(true);
        }
      }
    };

    // Também verifica periodicamente (para mudanças na mesma aba)
    const checkUnidade = () => {
      const novaUnidade = getUnidadeAtual();
      if (novaUnidade !== unidadeAtual) {
        console.log(`🔄 Unidade alterada: ${unidadeAtual} -> ${novaUnidade}`);
        setUnidadeAtual(novaUnidade);
        lastSequenceRef.current = 0;
        setIsLoading(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const unidadeCheckInterval = setInterval(checkUnidade, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(unidadeCheckInterval);
    };
  }, [getUnidadeAtual, unidadeAtual]);

  // Efeito principal: carrega dados e inicia monitoramento
  useEffect(() => {
    // Carrega dados inicialmente
    carregarTudo();

    // Inicia o monitoramento
    checkChanges();

    // Configura o intervalo para checagem periódica
    const intervalId = setInterval(checkChanges, INTERVALO_ATUALIZACAO);

    // Cleanup: para o monitoramento ao desmontar
    return () => {
      clearInterval(intervalId);
      console.log("🛑 Monitor parado");
    };
  }, [carregarTudo, checkChanges, unidadeAtual]);

  return {
    pacientes,
    estudos,
    series,
    seriesByStudy,
    status,
    isLoading,
    isMonitoring,
    error,
    refetch: carregarTudo,
    unidadeAtual
  };
}

/**
 * Hook auxiliar para calcular estatísticas baseadas nos dados do Orthanc
 */
export function useOrthancStats(estudos: any[], pacientes: any[]) {
  const dataHoje = (() => {
    const data = new Date();
    return `${data.getFullYear()}${(data.getMonth() + 1).toString().padStart(2, '0')}${data.getDate().toString().padStart(2, '0')}`;
  })();

  const estudosHoje = estudos.filter(
    (estudo) => estudo.MainDicomTags?.StudyDate === dataHoje
  ).length;

  const totalPacientes = pacientes.length;

  return {
    estudosHoje,
    totalPacientes,
    dataHoje
  };
}
