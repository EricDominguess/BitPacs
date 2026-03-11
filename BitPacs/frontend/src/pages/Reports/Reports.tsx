import { useState, useMemo } from 'react';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/common';

// Tipos
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

interface StorageData {
  label: string;
  value: number;
  color: string;
}

// Dados mockados (serão substituídos por dados reais da API)
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

// Dados de armazenamento mockados (GB)
const mockStorageData: StorageData[] = [
  { label: 'Utilizado', value: 320, color: '#3B82F6' },
  { label: 'Disponível', value: 180, color: '#E5E7EB' },
];

// Dados do gráfico de volume por hora (24 horas)
const mockHourlyVolume = [
  5, 3, 2, 1, 1, 2, 8, 25, 45, 62, 58, 48, 
  52, 65, 55, 42, 38, 28, 22, 18, 15, 12, 8, 6
];

export function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Calcular métricas totais
  const totalStudies = useMemo(() => mockModalityData.reduce((acc, m) => acc + m.count, 0), []);
  const totalInstances = 14580; // Mock
  const activeModalities = mockModalityData.length;
  const totalUserActions = useMemo(() => mockUserActions.reduce((acc, a) => acc + a.count, 0), []);
  
  // Cálculos de armazenamento
  const totalStorage = useMemo(() => mockStorageData.reduce((acc, s) => acc + s.value, 0), []);
  const usedStorage = mockStorageData[0].value;
  const usedPercentage = Math.round((usedStorage / totalStorage) * 100);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Relatórios</h1>
            <p className="text-theme-muted mt-1">
              Visão geral do sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filtro de Período */}
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  if (e.target.value === 'custom') {
                    setShowCustomDatePicker(true);
                  } else {
                    setShowCustomDatePicker(false);
                  }
                }}
                className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-nautico/50"
              >
                <option value="today">Hoje</option>
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="custom">Período Personalizado</option>
              </select>
            </div>
            
            {/* Seletores de data customizada */}
            {showCustomDatePicker && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-nautico/50"
                />
                <span className="text-theme-muted">até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-nautico/50"
                />
              </div>
            )}
            
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
          
          {/* Gráfico SVG - Melhorado com curvas suaves */}
          <div className="h-52 relative">
            {/* Linhas de grade horizontais */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-theme-border/30" />
              ))}
            </div>
            
            <svg viewBox="0 0 920 180" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              
              {/* Área preenchida com curva suave */}
              <path
                d={`M 0,180 ${mockHourlyVolume.map((value, index) => {
                  const maxValue = Math.max(...mockHourlyVolume);
                  const x = (index / (mockHourlyVolume.length - 1)) * 920;
                  const y = 180 - (value / maxValue) * 160;
                  return `L ${x},${y}`;
                }).join(' ')} L 920,180 Z`}
                fill="url(#areaGradient)"
              />
              
              {/* Linha do gráfico com curva suave usando spline */}
              <path
                d={(() => {
                  const maxValue = Math.max(...mockHourlyVolume);
                  const points = mockHourlyVolume.map((value, index) => ({
                    x: (index / (mockHourlyVolume.length - 1)) * 920,
                    y: 180 - (value / maxValue) * 160
                  }));
                  
                  // Criar curva spline suave
                  let path = `M ${points[0].x},${points[0].y}`;
                  for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i === 0 ? i : i - 1];
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
                    
                    const cp1x = p1.x + (p2.x - p0.x) / 6;
                    const cp1y = p1.y + (p2.y - p0.y) / 6;
                    const cp2x = p2.x - (p3.x - p1.x) / 6;
                    const cp2y = p2.y - (p3.y - p1.y) / 6;
                    
                    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
                  }
                  return path;
                })()}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            {/* Labels do eixo X */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-theme-muted">
              {['00:00h', '02:00h', '04:00h', '06:00h', '08:00h', '10:00h', '12:00h', '14:00h', '16:00h', '18:00h', '20:00h', '22:00h', '00:00h'].map((label, i) => (
                <span key={i}>{label}</span>
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

          {/* Armazenamento do Sistema */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-theme-primary">Armazenamento</h2>
              <button className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-secondary rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {/* Gráfico de Rosca */}
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Círculo de fundo */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-theme-secondary"
                  />
                  {/* Círculo de progresso */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${usedPercentage * 2.51} 251`}
                    className="transition-all duration-1000"
                  />
                </svg>
                {/* Texto central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-theme-primary">{usedPercentage}%</span>
                  <span className="text-xs text-theme-muted">utilizado</span>
                </div>
              </div>
              
              {/* Legenda */}
              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-theme-muted">Utilizado</span>
                  </div>
                  <span className="text-sm font-medium text-theme-primary">{usedStorage} GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-theme-secondary" />
                    <span className="text-sm text-theme-muted">Disponível</span>
                  </div>
                  <span className="text-sm font-medium text-theme-primary">{mockStorageData[1].value} GB</span>
                </div>
                <div className="pt-3 border-t border-theme-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-theme-muted">Total</span>
                    <span className="text-sm font-bold text-theme-primary">{totalStorage} GB</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
