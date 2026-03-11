import { useState, useMemo } from 'react';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/common';

// Tipos
interface ActivityLog {
  id: string;
  time: string;
  user: string;
  role: 'MÉDICO' | 'ADMIN' | 'TÉCNICO' | 'ENFERMEIRO';
  action: string;
}

interface ModalityData {
  name: string;
  shortName: string;
  count: number;
  percentage: number;
  color: string;
}

interface UserActionData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

// Dados mockados (serão substituídos por dados reais da API)
const mockActivityLogs: ActivityLog[] = [
  { id: '1', time: '15:42', user: 'Dr. Roberto Silva', role: 'MÉDICO', action: 'Validou e assinou Laudo do Estudo #10928' },
  { id: '2', time: '15:30', user: 'João Gonçalves', role: 'ADMIN', action: 'Criou acesso para "Dra. Paula"' },
  { id: '3', time: '15:16', user: 'Carlos Mendes', role: 'TÉCNICO', action: 'Registrou rejeição no Estudo #10926' },
  { id: '4', time: '14:50', user: 'Dra. Ana Costa', role: 'MÉDICO', action: 'Solicitou segunda opinião (Estudo #10911)' },
  { id: '5', time: '14:32', user: 'Maria Santos', role: 'ENFERMEIRO', action: 'Visualizou Estudo #10905' },
];

const mockModalityData: ModalityData[] = [
  { name: 'Raio-X', shortName: 'CR/DX', count: 420, percentage: 58, color: 'bg-nautico' },
  { name: 'Tomografia', shortName: 'CT', count: 185, percentage: 25, color: 'bg-purple-light' },
  { name: 'Ultrassom', shortName: 'US', count: 92, percentage: 12, color: 'bg-emerald-500' },
  { name: 'Ressonância', shortName: 'MR', count: 25, percentage: 5, color: 'bg-pink-500' },
];

const mockUserActions: UserActionData[] = [
  { name: 'Visualização de Estudos', count: 840, percentage: 61, color: 'bg-nautico' },
  { name: 'Exportação p/ Governo', count: 315, percentage: 23, color: 'bg-amber-500' },
  { name: 'Criação de Laudos', count: 180, percentage: 13, color: 'bg-purple-light' },
  { name: 'Ações Administrativas', count: 42, percentage: 3, color: 'bg-slate-400' },
];

// Dados do gráfico de volume por hora (24 horas)
const mockHourlyVolume = [
  5, 3, 2, 1, 1, 2, 8, 25, 45, 62, 58, 48, 
  52, 65, 55, 42, 38, 28, 22, 18, 15, 12, 8, 6
];

export function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  
  // Calcular métricas totais
  const totalStudies = useMemo(() => mockModalityData.reduce((acc, m) => acc + m.count, 0), []);
  const totalInstances = 14580; // Mock
  const activeModalities = mockModalityData.length;
  const totalUserActions = useMemo(() => mockUserActions.reduce((acc, a) => acc + a.count, 0), []);
  
  // Badge de role com cores
  const getRoleBadgeClass = (role: ActivityLog['role']) => {
    switch (role) {
      case 'MÉDICO': return 'bg-emerald-500/20 text-emerald-400';
      case 'ADMIN': return 'bg-amber-500/20 text-amber-400';
      case 'TÉCNICO': return 'bg-purple-light/20 text-purple-light';
      case 'ENFERMEIRO': return 'bg-nautico/20 text-nautico';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  // Calcular pontos do gráfico SVG
  const chartPoints = useMemo(() => {
    const maxValue = Math.max(...mockHourlyVolume);
    const width = 100;
    const height = 100;
    const padding = 5;
    
    return mockHourlyVolume.map((value, index) => {
      const x = padding + (index / (mockHourlyVolume.length - 1)) * (width - padding * 2);
      const y = height - padding - (value / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');
  }, []);

  const chartAreaPoints = useMemo(() => {
    const maxValue = Math.max(...mockHourlyVolume);
    const width = 100;
    const height = 100;
    const padding = 5;
    
    const points = mockHourlyVolume.map((value, index) => {
      const x = padding + (index / (mockHourlyVolume.length - 1)) * (width - padding * 2);
      const y = height - padding - (value / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    });
    
    // Adicionar pontos para fechar a área
    const lastX = padding + ((mockHourlyVolume.length - 1) / (mockHourlyVolume.length - 1)) * (width - padding * 2);
    const firstX = padding;
    
    return `${firstX},${height - padding} ${points.join(' ')} ${lastX},${height - padding}`;
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Analytics & Telemetria</h1>
            <p className="text-theme-muted mt-1">
              Monitoramento de Volumetria, Instâncias e Atividade de Usuários
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-nautico/50"
            >
              <option value="today">Hoje</option>
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
              <option value="year">Último Ano</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-nautico text-white rounded-lg text-sm font-medium hover:bg-nautico/90 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Dados
            </button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Estudos */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-theme-muted">Total de Estudos (Hoje)</p>
                <p className="text-3xl font-bold text-theme-primary mt-1">{totalStudies.toLocaleString()}</p>
                <p className="text-sm text-emerald-500 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  +15%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-nautico/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Total de Instâncias */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-theme-muted">Total de Instâncias</p>
                <p className="text-3xl font-bold text-theme-primary mt-1">{totalInstances.toLocaleString()}</p>
                <p className="text-sm text-theme-muted mt-1">Imagens trafegadas</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-light/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Modalidades Ativas */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-theme-muted">Modalidades Ativas</p>
                <p className="text-3xl font-bold text-theme-primary mt-1">{activeModalities}</p>
                <p className="text-sm text-theme-muted mt-1">
                  {mockModalityData.map(m => m.shortName).join(', ')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </Card>

          {/* Ações de Usuários */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-theme-muted">Ações de Usuários</p>
                <p className="text-3xl font-bold text-theme-primary mt-1">{totalUserActions.toLocaleString()}</p>
                <p className="text-sm text-theme-muted mt-1">Interações no sistema</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Gráfico de Volume por Hora */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-theme-primary">Volume de Estudos por Hora</h2>
              <p className="text-sm text-theme-muted">Distribuição completa do dia (00:00 até 00:00)</p>
            </div>
            <button className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-secondary rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          {/* Gráfico SVG */}
          <div className="h-48 relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {/* Área preenchida */}
              <polygon
                points={chartAreaPoints}
                fill="url(#gradient)"
                opacity="0.3"
              />
              {/* Linha do gráfico */}
              <polyline
                points={chartPoints}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Gradiente */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Labels do eixo X */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-theme-muted px-1">
              {['00:00h', '02:00h', '04:00h', '06:00h', '08:00h', '10:00h', '12:00h', '14:00h', '16:00h', '18:00h', '20:00h', '22:00h', '00:00h'].map((label, i) => (
                <span key={i} className="hidden sm:inline">{label}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Grid de 3 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estudos por Modalidade */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-theme-primary">Estudos por Modalidade</h2>
              <button className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-secondary rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {mockModalityData.map((modality) => (
                <div key={modality.shortName}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-theme-primary">{modality.name} ({modality.shortName})</span>
                    <span className="text-sm text-theme-muted">{modality.count} ({modality.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-theme-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${modality.color} rounded-full transition-all duration-500`}
                      style={{ width: `${modality.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Ações dos Usuários */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-theme-primary">Ações dos Usuários</h2>
              <button className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-secondary rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {mockUserActions.map((action) => (
                <div key={action.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-theme-primary">{action.name}</span>
                    <span className="text-sm text-theme-muted">{action.count} ({action.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-theme-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${action.color} rounded-full transition-all duration-500`}
                      style={{ width: `${action.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Log de Atividade */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-theme-primary">Log de Atividade</h2>
              <button className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-secondary rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {mockActivityLogs.map((log, index) => (
                <div key={log.id} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-nautico' : 'bg-theme-muted/30'}`} />
                    {index < mockActivityLogs.length - 1 && (
                      <div className="w-0.5 h-full bg-theme-border mt-1" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-theme-muted">{log.time}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeClass(log.role)}`}>
                        {log.role}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-theme-primary">{log.user}</p>
                    <p className="text-sm text-theme-muted">{log.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
