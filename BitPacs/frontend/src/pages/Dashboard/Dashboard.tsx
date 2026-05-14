import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '../../components/layout';
import { StatCard, RecentStudiesTable, StorageCard, ModalityStats } from '../../components/dashboard';
import { useOrthancData, useOrthancStats } from '../../hooks';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

export function Dashboard() {
  // Super hook: fetch + monitoramento em tempo real
  const { pacientes, estudos, isLoading, isMonitoring, status, carregarSeriesDoEstudo, unidadeAtual } = useOrthancData();
  
  // Hook de estatísticas derivadas
  const { estudosHoje, pacientesUnicosHoje, dataHoje } = useOrthancStats(estudos, pacientes);

  const [viewsHoje, setViewsHoje] = useState<number | null>(null);
  const [downloadsHoje, setDownloadsHoje] = useState<number | null>(null);

  const dataHojeIso = useMemo(() => {
    if (!dataHoje || dataHoje.length !== 8) return '';
    return `${dataHoje.slice(0, 4)}-${dataHoje.slice(4, 6)}-${dataHoje.slice(6, 8)}`;
  }, [dataHoje]);

  useEffect(() => {
    if (!unidadeAtual || !dataHojeIso) return;

    const controller = new AbortController();

    setViewsHoje(null);
    setDownloadsHoje(null);

    const carregarResumo = async () => {
      try {
        const response = await fetchWithAuth(
          `/api/studylogs/summary?unidade=${encodeURIComponent(unidadeAtual)}&date=${encodeURIComponent(dataHojeIso)}`,
          { signal: controller.signal }
        );
        if (!response.ok) return;
        const data = await response.json();
        setViewsHoje(Number(data.totalViews || 0));
        setDownloadsHoje(Number(data.totalDownloads || 0));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Erro ao carregar resumo de logs do dia:', error);
        }
      }
    };

    void carregarResumo();

    return () => controller.abort();
  }, [unidadeAtual, dataHojeIso]);

  const stats = [
    { label: 'Estudos', value: isLoading ? '—' : estudosHoje.toString() },
    { label: 'Pacientes Unicos', value: isLoading ? '—' : pacientesUnicosHoje.toString() },
    { label: 'Visualizações', value: isLoading || viewsHoje === null ? '—' : viewsHoje.toString() },
    { label: 'Downloads', value: isLoading || downloadsHoje === null ? '—' : downloadsHoje.toString() },
  ];

  console.log(`📊 Dashboard Admin: ${isLoading ? 'Carregando...' : 'Dados prontos'} | Monitorando: ${isMonitoring}`);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Dashboard</h1>
            <p className="text-theme-muted mt-1">Visão geral de hoje</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Studies */}
          <RecentStudiesTable dados={estudos} className="lg:col-span-2" carregarSeriesDoEstudo={carregarSeriesDoEstudo} />

          {/* Quick Stats */}
          <div className="space-y-6">
            <StorageCard stats={status} />
            <ModalityStats estudos={estudos} carregarSeriesDoEstudo={carregarSeriesDoEstudo} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
