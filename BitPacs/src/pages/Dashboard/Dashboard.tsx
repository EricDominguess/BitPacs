import { MainLayout } from '../../components/layout';
import { Card, Badge } from '../../components/common';

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
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-white/60 mt-1">Visão geral do sistema PACS</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span>Última atualização:</span>
            <span className="text-ultra">há 2 minutos</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="hover:border-nautico/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/60">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <Badge variant={stat.positive ? 'success' : 'warning'}>
                  {stat.change}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Studies */}
          <Card title="Estudos Recentes" className="lg:col-span-2">
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-purple/20">
                    <th className="text-left text-sm font-medium text-white/60 pb-3">Paciente</th>
                    <th className="text-left text-sm font-medium text-white/60 pb-3">Modalidade</th>
                    <th className="text-left text-sm font-medium text-white/60 pb-3">Data</th>
                    <th className="text-left text-sm font-medium text-white/60 pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple/10">
                  {recentStudies.map((study, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors cursor-pointer">
                      <td className="py-3">
                        <span className="text-white font-medium">{study.patient}</span>
                      </td>
                      <td className="py-3">
                        <Badge>{study.modality}</Badge>
                      </td>
                      <td className="py-3 text-white/70">{study.date}</td>
                      <td className="py-3">
                        <Badge variant={study.status === 'Completo' ? 'success' : 'warning'}>
                          {study.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Storage */}
            <Card title="Armazenamento">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Usado</span>
                  <span className="text-white font-medium">2.4 TB / 4 TB</span>
                </div>
                <div className="h-3 bg-purple-dark rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-nautico to-ultra rounded-full transition-all"
                    style={{ width: '60%' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-purple-dark/50 rounded-lg">
                    <p className="text-xl font-bold text-white">1,247</p>
                    <p className="text-xs text-white/50">Total Estudos</p>
                  </div>
                  <div className="text-center p-3 bg-purple-dark/50 rounded-lg">
                    <p className="text-xl font-bold text-white">45,892</p>
                    <p className="text-xs text-white/50">Total Imagens</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Modalidades */}
            <Card title="Por Modalidade">
              <div className="space-y-3">
                {[
                  { name: 'CT', count: 423, color: 'bg-nautico' },
                  { name: 'MR', count: 312, color: 'bg-purple-light' },
                  { name: 'CR', count: 289, color: 'bg-ultra' },
                  { name: 'US', count: 156, color: 'bg-green-aqua' },
                  { name: 'Outros', count: 67, color: 'bg-purple' },
                ].map((mod) => (
                  <div key={mod.name} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded ${mod.color}`} />
                    <span className="flex-1 text-sm text-white/80">{mod.name}</span>
                    <span className="text-sm font-medium text-white">{mod.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
