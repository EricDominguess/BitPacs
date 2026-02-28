import { useState, useEffect, useCallback, useRef } from 'react';

const INTERVALO_ATUALIZACAO = 15000;

// ✅ Apenas slugs — sem IDs numéricos. O backend agora retorna o slug direto.
const UNIDADES_CONFIG: Record<string, { orthancProxy: string }> = {
  'localhost':     { orthancProxy: '/orthanc' },
  'riobranco':     { orthancProxy: '/orthanc-riobranco' },
  'foziguacu':     { orthancProxy: '/orthanc-foziguacu' },
  'fazenda':       { orthancProxy: '/orthanc-fazenda' },
  'faxinal':       { orthancProxy: '/orthanc-faxinal' },
  'santamariana':  { orthancProxy: '/orthanc-santamariana' },
  'guarapuava':    { orthancProxy: '/orthanc-guarapuava' },
  'carlopolis':    { orthancProxy: '/orthanc-carlopolis' },
  'arapoti':       { orthancProxy: '/orthanc-arapoti' },
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
  carregarSeriesDoEstudo: (studyId: string) => Promise<any[]>;
  buscarEstudosNoServidor: (termo: string) => Promise<any[]>;
  buscarModalidadeNoServidor: (modality: string) => Promise<any[]>;
}

export function useOrthancData(): UseOrthancDataReturn {
  const getUnidadeAtual = useCallback(() => {
    const userStorage = sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user');
    const user = JSON.parse(userStorage || '{}');
    const isMaster = user?.role === 'Master';

    if (isMaster) {
      return localStorage.getItem('bitpacs-unidade-master') || 'riobranco';
    }

    // ✅ unidadeId agora já é o slug (ex: "guarapuava") — sem conversão necessária
    return user?.unidadeId || 'riobranco';
  }, []);

  const [unidadeAtual, setUnidadeAtual] = useState(getUnidadeAtual);

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [estudos, setEstudos] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [seriesByStudy, setSeriesByStudy] = useState<Map<string, any[]>>(new Map());
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSequenceRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);

  const getProxyPrefix = useCallback(() => {
    const config = UNIDADES_CONFIG[unidadeAtual];
    return config?.orthancProxy || '/orthanc';
  }, [unidadeAtual]);

  const carregarTudo = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    const timestamp = Date.now();
    const proxyPrefix = getProxyPrefix();
    setError(null);

    try {
      const [estudosRes, statsRes, pacientesRes] = await Promise.all([
        fetch(`${proxyPrefix}/studies?expand&_t=${timestamp}`),
        fetch(`${proxyPrefix}/statistics?_t=${timestamp}`),
        fetch(`${proxyPrefix}/patients?_t=${timestamp}`)
      ]);

      if (!estudosRes.ok || !statsRes.ok) throw new Error('Falha ao carregar dados principais');

      const [estudosData, statsData, pacientesData] = await Promise.all([
        estudosRes.json(),
        statsRes.json(),
        pacientesRes.ok ? pacientesRes.json() : []
      ]);

      setEstudos(estudosData);
      setStatus(statsData);
      setPacientes(pacientesData);
      setIsLoading(false);

      // ✅ unidadeAtual já é o slug — passa direto para o C#
      console.log(`Buscando séries no C# para a unidade: ${unidadeAtual}`);
      const seriesRes = await fetch(`/api/dashboard/series/${unidadeAtual}`);

      if (seriesRes.ok) {
        const seriesData = await seriesRes.json();
        const seriesMap = new Map<string, any[]>();
        seriesData.forEach((serie: any) => {
          const studyId = serie.ParentStudy;
          if (!seriesMap.has(studyId)) seriesMap.set(studyId, []);
          seriesMap.get(studyId)!.push(serie);
        });
        setSeries(seriesData);
        setSeriesByStudy(seriesMap);
      }
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : 'Erro desconhecido');
      setIsLoading(false);
    } finally {
      isLoadingRef.current = false;
    }
  }, [getProxyPrefix, unidadeAtual]);

  const checkChanges = useCallback(async () => {
    const proxyPrefix = getProxyPrefix();

    try {
      if (lastSequenceRef.current === 0) {
        const response = await fetch(`${proxyPrefix}/changes?descending=true&limit=1`);
        const data = await response.json();
        lastSequenceRef.current = data.Last || 0;
        console.log(`🔔 Monitor iniciado. Última sequência: ${lastSequenceRef.current}`);
        setIsMonitoring(true);
        return;
      }

      const response = await fetch(`${proxyPrefix}/changes?since=${lastSequenceRef.current}&limit=100`);
      const data = await response.json();

      if (data.Last > lastSequenceRef.current) {
        console.log(`🔔 Novas mudanças detectadas! (De ${lastSequenceRef.current} para ${data.Last})`);
        lastSequenceRef.current = data.Last;

        const listaDeTipos = data.Changes.map((change: any) => change.ChangeType);
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

  const carregarSeriesDoEstudo = async (studyId: string) => {
    const proxyPrefix = getProxyPrefix();
    try {
      const res = await fetch(`${proxyPrefix}/studies/${studyId}/series?expand`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error(`Erro ao carregar séries do estudo ${studyId}:`, e);
    }
    return [];
  };

  const buscarEstudosNoServidor = async (termo: string) => {
    const proxyPrefix = getProxyPrefix();
    try {
      const payloadNome = { Level: "Study", Query: { PatientName: `*${termo}*` }, Expand: true, Limit: 50 };
      const payloadId   = { Level: "Study", Query: { PatientID: `*${termo}*` },   Expand: true, Limit: 50 };

      const [resNome, resId] = await Promise.all([
        fetch(`${proxyPrefix}/tools/find`, { method: 'POST', body: JSON.stringify(payloadNome) }),
        fetch(`${proxyPrefix}/tools/find`, { method: 'POST', body: JSON.stringify(payloadId) })
      ]);

      const estudosNome = resNome.ok ? await resNome.json() : [];
      const estudosId   = resId.ok   ? await resId.json()   : [];

      const todos = [...estudosNome, ...estudosId];
      return Array.from(new Map(todos.map((e: any) => [e.ID, e])).values());
    } catch (e) {
      console.error("Erro na busca universal:", e);
      return [];
    }
  };

  const buscarModalidadeNoServidor = async (modality: string) => {
    const proxyPrefix = getProxyPrefix();
    const PAGE_SIZE = 100;
    const todos: any[] = [];
    let since = 0;

    try {
      // Pagina 100 por vez com Expand:true — acumula até não ter mais resultados
      while (true) {
        const payload = {
          Level: "Study",
          Query: { ModalitiesInStudy: modality },
          Expand: true,
          Limit: PAGE_SIZE,
          Since: since,
        };
        const res = await fetch(`${proxyPrefix}/tools/find`, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) break;

        const pagina: any[] = await res.json();
        todos.push(...pagina);

        // Se veio menos que o limite, chegamos na última página
        if (pagina.length < PAGE_SIZE) break;
        since += pagina.length;
      }

      return todos;
    } catch (e) {
      console.error("Erro na busca de modalidade:", e);
      return todos; // retorna o que já buscou até o erro
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bitpacs-unidade-master' || e.key === 'bitpacs_user') {
        const novaUnidade = getUnidadeAtual();
        if (novaUnidade !== unidadeAtual) {
          setUnidadeAtual(novaUnidade);
          window.location.reload();
        }
      }
    };

    const checkUnidade = () => {
      const novaUnidade = getUnidadeAtual();
      if (novaUnidade !== unidadeAtual) {
        setUnidadeAtual(novaUnidade);
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const unidadeCheckInterval = setInterval(checkUnidade, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(unidadeCheckInterval);
    };
  }, [getUnidadeAtual, unidadeAtual]);

  useEffect(() => {
    carregarTudo();
    checkChanges();
    const intervalId = setInterval(checkChanges, INTERVALO_ATUALIZACAO);
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
    unidadeAtual,
    carregarSeriesDoEstudo,
    buscarEstudosNoServidor,
    buscarModalidadeNoServidor,
  };
}

export function useOrthancStats(estudos: any[], pacientes: any[]) {
  const dataHoje = (() => {
    const data = new Date();
    return `${data.getFullYear()}${(data.getMonth() + 1).toString().padStart(2, '0')}${data.getDate().toString().padStart(2, '0')}`;
  })();

  const estudosHoje = estudos.filter(
    (estudo) => estudo.MainDicomTags?.StudyDate === dataHoje
  ).length;

  return {
    estudosHoje,
    totalPacientes: pacientes.length,
    dataHoje
  };
}