import { MainLayout } from '../../components/layout';
import { StatCard, RecentStudiesTable, StorageCard, ModalityStats } from '../../components/dashboard';

const stats = [
  { label: 'Estudos Hoje', value: '24', change: '+12%', positive: true },
  { label: 'Pacientes Ativos', value: '1,847', change: '+5%', positive: true },
  { label: 'Armazenamento', value: '2.4 TB', change: '78%', positive: false },
  { label: 'Uploads Pendentes', value: '3', change: '-2', positive: true },
];

const recentStudies = [
  { patient: 'Maria Silva', modality: 'CT', date: '12/01/2026', status: 'Completo' },
  { patient: 'João Santos', modality: 'MR', date: '12/01/2026', status: 'Processando' },
  { patient: 'Ana Oliveira', modality: 'CR', date: '11/01/2026', status: 'Completo' },
  { patient: 'Carlos Lima', modality: 'US', date: '11/01/2026', status: 'Completo' },
  { patient: 'Paula Costa', modality: 'CT', date: '10/01/2026', status: 'Completo' },
];

export function Dashboard() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Dashboard</h1>
            <p className="text-theme-muted mt-1">Visão geral do sistema PACS</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-theme-muted">
            <span>Última atualização:</span>
            <span className="text-ultra">há 2 minutos</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Studies */}
          <RecentStudiesTable studies={recentStudies} className="lg:col-span-2" />

          {/* Quick Stats */}
          <div className="space-y-6">
            <StorageCard />
            <ModalityStats />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
