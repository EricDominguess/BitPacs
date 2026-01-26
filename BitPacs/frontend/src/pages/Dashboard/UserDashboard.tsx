import { MainLayout } from '../../components/layout';
import { StatCard, RecentStudiesTable, ModalityStats } from '../../components/dashboard';
import { useOrthancData, useOrthancStats } from '../../hooks';

export function UserDashboard() {
  // Super hook: fetch + monitoramento em tempo real
  const { pacientes, estudos, series, isLoading, isMonitoring } = useOrthancData();
  
  // Hook de estatísticas derivadas
  const { estudosHoje, totalPacientes } = useOrthancStats(estudos, pacientes);

  const stats = [
    { label: 'Estudos Hoje', value: estudosHoje.toString() },
    { label: 'Pacientes Ativos', value: totalPacientes.toString() },
  ];

  console.log(`📊 UserDashboard: ${isLoading ? 'Carregando...' : 'Dados prontos'} | Monitorando: ${isMonitoring}`);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Dashboard</h1>
            <p className="text-theme-muted mt-1">Visão geral do sistema PACS</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Studies */}
          <RecentStudiesTable dados={estudos} series={series} className="lg:col-span-2" />

          {/* Modalidades */}
          <ModalityStats estudos={series} />
        </div>
      </div>
    </MainLayout>
  );
}
