import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/common';

// Lista de unidades
const unidades = [
  { value: 'all',          label: 'Todas as Unidades' },
  { value: 'riobranco',    label: 'CIS - Unidade de Rio Branco'    },
  { value: 'foziguacu',    label: 'CIS - Unidade de Foz do Iguaçu' },
  { value: 'fazenda',      label: 'CIS - Unidade de Fazenda'       },
  { value: 'faxinal',      label: 'CIS - Unidade de Faxinal'       },
  { value: 'santamariana', label: 'CIS - Unidade de Santa Mariana' },
  { value: 'guarapuava',   label: 'CIS - Unidade de Guarapuava'    },
  { value: 'carlopolis',   label: 'CIS - Unidade de Carlópolis'    },
  { value: 'arapoti',      label: 'CIS - Unidade de Arapoti'       },
];

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
  actionType: string;
  count: number;
  percentage: number;
  color: string;
}

interface StorageInfo {
  usedGB: number;
  availableGB: number;
  totalGB: number;
  usedPercentage: number;
}

interface OrthancStats {
  totalStudies: number;
  totalSeries: number;
  totalInstances: number;
  totalPatients: number;
}

interface ReportsData {
  period: { start: string; end: string };
  summary: {
    totalStudies: number;
    totalInstances: number;
    activeModalities: number;
    totalUserActions: number;
  };
  orthancStats: OrthancStats; // Dados reais do Orthanc
  modalityData: ModalityData[];
  userActionData: UserActionData[];
  hourlyVolume: number[];
  storage: StorageInfo;
}

export function Reports() {
  // Obter dados do usuário logado
  const currentUser = JSON.parse((sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user')) || '{}');
  const isMaster = currentUser.role === 'Master';
  
  // Para Admin, sempre usar sua própria unidade; para Master, permitir escolher
  const [selectedUnidade, setSelectedUnidade] = useState<string>(
    isMaster ? 'all' : (currentUser.unidadeId || '')
  );
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Estados para dados da API
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar dados da API
  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
      if (!token) {
        setError('Não autenticado');
        return;
      }

      let url = `/api/reports/statistics?period=${selectedPeriod}&unidade=${selectedUnidade}`;
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar relatórios:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, customStartDate, customEndDate, selectedUnidade]);

  // Buscar dados quando período ou unidade mudar
  useEffect(() => {
    // Só busca se não for custom ou se tiver as datas preenchidas
    if (selectedPeriod !== 'custom' || (customStartDate && customEndDate)) {
      fetchReportsData();
    }
  }, [selectedPeriod, fetchReportsData]);

  // Valores padrão enquanto carrega ou se não tem dados
  const summary = data?.summary ?? { totalStudies: 0, totalInstances: 0, activeModalities: 0, totalUserActions: 0 };
  const orthancStats = data?.orthancStats ?? { totalStudies: 0, totalSeries: 0, totalInstances: 0, totalPatients: 0 };
  const modalityData = data?.modalityData ?? [];
  const userActionData = data?.userActionData ?? [];
  const hourlyVolume = data?.hourlyVolume ?? Array(24).fill(0);
  const storage = data?.storage ?? { usedGB: 0, availableGB: 0, totalGB: 1, usedPercentage: 0 };

  // Exportar dados
  const handleExport = async (format: 'excel' | 'pdf') => {
    setShowExportMenu(false);
    
    try {
      const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
      if (!token) return;

      // Por enquanto, gera os dados no frontend
      if (format === 'excel') {
        // Criar CSV simples (pode ser aberto no Excel)
        const csvContent = generateCSV();
        downloadFile(csvContent, 'relatorio-bitpacs.csv', 'text/csv');
      } else {
        // Para PDF, podemos usar uma biblioteca como jsPDF
        alert('Exportação PDF será implementada em breve');
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  };

  const generateCSV = () => {
    const lines = [
      'Relatório BitPacs',
      `Período: ${getPeriodLabel()}`,
      '',
      'Resumo',
      `Total de Estudos,${summary.totalStudies}`,
      `Total de Instâncias,${summary.totalInstances}`,
      `Modalidades Ativas,${summary.activeModalities}`,
      `Total de Ações,${summary.totalUserActions}`,
      '',
      'Estudos por Modalidade',
      'Modalidade,Quantidade,Porcentagem',
      ...modalityData.map(m => `${m.name} (${m.shortName}),${m.count},${m.percentage}%`),
      '',
      'Ações dos Usuários',
      'Ação,Quantidade,Porcentagem',
      ...userActionData.map(a => `${a.name},${a.count},${a.percentage}%`),
      '',
      'Armazenamento',
      `Utilizado (GB),${storage.usedGB}`,
      `Disponível (GB),${storage.availableGB}`,
      `Total (GB),${storage.totalGB}`,
      `Percentual Utilizado,${storage.usedPercentage}%`
    ];
    return lines.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoje';
      case 'week': return 'Última Semana';
      case 'month': return 'Último Mês';
      case 'custom': return `${customStartDate} até ${customEndDate}`;
      default: return '';
    }
  };

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
            {/* Filtro de Unidade - Apenas para Master */}
            {isMaster ? (
              <div className="relative">
                <select
                  value={selectedUnidade}
                  onChange={(e) => setSelectedUnidade(e.target.value)}
                  className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-nautico/50"
                >
                  {unidades.map((unidade) => (
                    <option key={unidade.value} value={unidade.value}>
                      {unidade.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="px-4 py-2 bg-theme-secondary rounded-lg text-theme-primary text-sm">
                {unidades.find(u => u.value === selectedUnidade)?.label || 'Minha Unidade'}
              </div>
            )}
            
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
            
            {/* Botão Exportar com Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-nautico text-white rounded-lg text-sm font-medium hover:bg-nautico/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar Dados
                <svg className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showExportMenu && (
                <>
                  {/* Overlay para fechar ao clicar fora */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-theme-card border border-theme-border rounded-lg shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-theme-primary hover:bg-theme-secondary transition-colors"
                    >
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium">Excel (.csv)</p>
                        <p className="text-xs text-theme-muted">Planilha com dados</p>
                      </div>
                    </button>
                    <div className="border-t border-theme-border" />
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-theme-primary hover:bg-theme-secondary transition-colors"
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium">PDF (.pdf)</p>
                        <p className="text-xs text-theme-muted">Relatório formatado</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Estado de Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nautico"></div>
          </div>
        )}

        {/* Estado de Erro */}
        {error && !loading && (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-theme-primary font-medium mb-2">Erro ao carregar dados</p>
              <p className="text-theme-muted text-sm mb-4">{error}</p>
              <button 
                onClick={fetchReportsData}
                className="px-4 py-2 bg-nautico text-white rounded-lg text-sm font-medium hover:bg-nautico/90 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </Card>
        )}

        {/* Conteúdo principal */}
        {!loading && !error && (
          <>
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total de Estudos - Do Orthanc */}
              <Card className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-theme-muted">Total de Estudos</p>
                    <p className="text-3xl font-bold text-theme-primary mt-1">{orthancStats.totalStudies.toLocaleString()}</p>
                    <p className="text-sm text-theme-muted mt-1">No sistema PACS</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-nautico/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </Card>

              {/* Total de Instâncias - Do Orthanc */}
              <Card className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-theme-muted">Total de Instâncias</p>
                    <p className="text-3xl font-bold text-theme-primary mt-1">{orthancStats.totalInstances.toLocaleString()}</p>
                    <p className="text-sm text-theme-muted mt-1">Imagens armazenadas</p>
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
                    <p className="text-3xl font-bold text-theme-primary mt-1">{summary.activeModalities}</p>
                    <p className="text-sm text-theme-muted mt-1">
                      {modalityData.slice(0, 3).map(m => m.shortName).join(', ')}{modalityData.length > 3 ? '...' : ''}
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
                    <p className="text-3xl font-bold text-theme-primary mt-1">{summary.totalUserActions.toLocaleString()}</p>
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
                <button 
                  onClick={fetchReportsData}
                  className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-secondary rounded-lg transition-colors"
                  title="Atualizar dados"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
                
                {hourlyVolume.every(v => v === 0) ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-theme-muted">Sem dados de volume para o período selecionado</p>
                  </div>
                ) : (
                  <svg viewBox="0 0 920 180" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    
                    {/* Área preenchida com curva suave */}
                    <path
                      d={`M 0,180 ${hourlyVolume.map((value, index) => {
                        const maxValue = Math.max(...hourlyVolume, 1);
                        const x = (index / (hourlyVolume.length - 1)) * 920;
                        const y = 180 - (value / maxValue) * 160;
                        return `L ${x},${y}`;
                      }).join(' ')} L 920,180 Z`}
                      fill="url(#areaGradient)"
                    />
                    
                    {/* Linha do gráfico com curva suave usando spline */}
                    <path
                      d={(() => {
                        const maxValue = Math.max(...hourlyVolume, 1);
                        const points = hourlyVolume.map((value, index) => ({
                          x: (index / (hourlyVolume.length - 1)) * 920,
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
                )}
                
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-theme-primary">Estudos por Modalidade</h2>
                  <button className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-secondary rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                </div>
                
                {modalityData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg className="w-12 h-12 text-theme-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-theme-muted text-sm">Sem dados no período</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {(() => {
                          let offset = 0;
                          return modalityData.map((modality) => {
                            const strokeDasharray = `${modality.percentage * 2.51} 251`;
                            const strokeDashoffset = -offset * 2.51;
                            offset += modality.percentage;
                            return (
                              <circle
                                key={modality.shortName}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={modality.color}
                                strokeWidth="10"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000"
                              />
                            );
                          });
                        })()}
                      </svg>
                      {/* Texto central */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-theme-primary">{summary.totalStudies}</span>
                        <span className="text-xs text-theme-muted">estudos</span>
                      </div>
                    </div>
                    
                    {/* Legenda */}
                    <div className="mt-4 w-full space-y-2">
                      {modalityData.map((modality) => (
                        <div key={modality.shortName} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: modality.color }} />
                            <span className="text-sm text-theme-muted">{modality.name} ({modality.shortName})</span>
                          </div>
                          <span className="text-sm font-medium text-theme-primary">{modality.count} ({modality.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Ações dos Usuários */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-theme-primary">Ações dos Usuários</h2>
                  <button className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-secondary rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
                
                {userActionData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg className="w-12 h-12 text-theme-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-theme-muted text-sm">Sem dados no período</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {(() => {
                          let offset = 0;
                          return userActionData.map((action, index) => {
                            const strokeDasharray = `${action.percentage * 2.51} 251`;
                            const strokeDashoffset = -offset * 2.51;
                            offset += action.percentage;
                            return (
                              <circle
                                key={index}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={action.color}
                                strokeWidth="10"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000"
                              />
                            );
                          });
                        })()}
                      </svg>
                      {/* Texto central */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-theme-primary">{summary.totalUserActions}</span>
                        <span className="text-xs text-theme-muted">ações</span>
                      </div>
                    </div>
                    
                    {/* Legenda */}
                    <div className="mt-4 w-full space-y-2">
                      {userActionData.map((action, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: action.color }} />
                            <span className="text-sm text-theme-muted truncate max-w-[140px]">{action.name}</span>
                          </div>
                          <span className="text-sm font-medium text-theme-primary whitespace-nowrap">{action.count} ({action.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Armazenamento do Sistema */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-theme-primary">Armazenamento</h2>
                  <button 
                    onClick={fetchReportsData}
                    className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-secondary rounded-lg transition-colors"
                    title="Atualizar dados"
                  >
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
                        strokeDasharray={`${storage.usedPercentage * 2.51} 251`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    {/* Texto central */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-theme-primary">{storage.usedPercentage}%</span>
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
                      <span className="text-sm font-medium text-theme-primary">{storage.usedGB} GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-theme-secondary" />
                        <span className="text-sm text-theme-muted">Disponível</span>
                      </div>
                      <span className="text-sm font-medium text-theme-primary">{storage.availableGB} GB</span>
                    </div>
                    <div className="pt-3 border-t border-theme-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-theme-muted">Total</span>
                        <span className="text-sm font-bold text-theme-primary">{storage.totalGB} GB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
