import { useState, useEffect, useCallback, useRef } from 'react';

// Intervalo entre atualizações (em ms)
const INTERVALO_ATUALIZACAO = 5000;

interface UseOrthancDataReturn {
  pacientes: any[];
  estudos: any[];
  series: any[];
  status: any[];
  isLoading: boolean;
  isMonitoring: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Super Hook que combina:
 * - Fetch inicial de dados do Orthanc (pacientes, estudos, séries)
 * - Monitoramento em tempo real de mudanças
 * - Atualização automática quando novos exames chegam
 */
export function useOrthancData(): UseOrthancDataReturn {
  // Estados de dados
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [estudos, setEstudos] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  
  // Estados de controle
  const [isLoading, setIsLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para o monitoramento de mudanças
  const lastSequenceRef = useRef<number>(0);

  /**
   * Carrega todos os dados do Orthanc
   */
  const carregarTudo = useCallback(async () => {
    const timestamp = Date.now();
    console.log("🔄 Carregando tudo do Orthanc...");
    setError(null);
    
    try {
      const [pacientesRes, estudosRes, seriesRes, statsRes] = await Promise.all([
        fetch(`/orthanc/patients?_t=${timestamp}`),
        fetch(`/orthanc/studies?expand&_t=${timestamp}`),
        fetch(`/orthanc/series?expand&_t=${timestamp}`),
        fetch(`/orthanc/statistics?_t=${timestamp}`)
      ]);

      if (!pacientesRes.ok || !estudosRes.ok || !seriesRes.ok || !statsRes.ok) {
        throw new Error('Falha ao carregar dados do Orthanc');
      }

      const [pacientesData, estudosData, seriesData, statsData] = await Promise.all([
        pacientesRes.json(),
        estudosRes.json(),
        seriesRes.json(),
        statsRes.json()
      ]);

      console.log(`✅ Dados carregados: ${pacientesData.length} pacientes, ${estudosData.length} estudos, ${seriesData.length} séries`);
      
      setPacientes(pacientesData);
      setEstudos(estudosData);
      setSeries(seriesData);
      setStatus(statsData);
      setIsLoading(false);
      
    } catch (erro) {
      console.error("❌ Erro ao carregar dados:", erro);
      setError(erro instanceof Error ? erro.message : 'Erro desconhecido');
      setIsLoading(false);
    }
  }, []);

  /**
   * Verifica mudanças no Orthanc e recarrega se necessário
   */
  const checkChanges = useCallback(async () => {
    try {
      // Primeira execução: pega o último ID de sequência
      if (lastSequenceRef.current === 0) {
        const response = await fetch('/orthanc/changes?descending=true&limit=1');
        const data = await response.json();
        lastSequenceRef.current = data.Last || 0;
        console.log(`🔔 Monitor iniciado. Última sequência: ${lastSequenceRef.current}`);
        setIsMonitoring(true);
        return;
      }

      // Verifica se há mudanças desde a última sequência
      const response = await fetch(`/orthanc/changes?since=${lastSequenceRef.current}&limit=100`);
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
  }, [carregarTudo]);

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
  }, [carregarTudo, checkChanges]);

  return {
    pacientes,
    estudos,
    series,
    status,
    isLoading,
    isMonitoring,
    error,
    refetch: carregarTudo
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
