import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { MainLayout } from '../../components/layout';
import { Button, Card, Input } from '../../components/common';
import { useUnidade } from '../../contexts';
import type { UnidadeKey } from '../../contexts/UnidadeContext';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

interface StoredUser {
  role?: 'Master' | 'Admin' | 'Medico' | 'Enfermeiro';
  unidadeId?: string;
}

interface ReportTotals {
  totalLogs: number;
  totalStudies: number;
  totalPatients: number;
  totalViews: number;
  totalDownloads: number;
}

interface ReportRecord {
  id: number;
  timestamp: string;
  patientName: string | null;
  studyDescription: string | null;
  modality: string | null;
  unidadeNome: string | null;
  actionType: string;
  userName: string | null;
}

interface ReportResponse {
  totals: ReportTotals;
  records: ReportRecord[];
}

const MODALIDADES = [
  { value: '', label: 'Todas' },
  { value: 'CT', label: 'Tomografia (CT)' },
  { value: 'MR', label: 'Ressonância (MR)' },
  { value: 'US', label: 'Ultrassom (US)' },
  { value: 'CR', label: 'Raio-X (CR)' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in-progress', label: 'Em andamento' },
  { value: 'done', label: 'Finalizado' },
];

export function Reports() {
  const { unidadesDisponiveis, unidade, unidadeLabel } = useUnidade();

  const user = useMemo<StoredUser>(() => {
    const userStr = sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user');
    return userStr ? JSON.parse(userStr) : {};
  }, []);

  const isMaster = user.role === 'Master';
  const isAdmin = user.role === 'Admin';

  const unidadesOptions = useMemo(
    () => Object.values(unidadesDisponiveis).filter((item) => item.value !== 'localhost'),
    [unidadesDisponiveis]
  );

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickRange, setQuickRange] = useState<'30' | '14' | '7' | ''>('');
  const [selectedUnits, setSelectedUnits] = useState<UnidadeKey[]>([]);
  const [modality, setModality] = useState('');
  const [status, setStatus] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getUnidadeLabel = (value: string) => {
    const found = unidadesOptions.find((item) => item.value === value);
    return found?.label ?? value;
  };

  const getSelectedUnidadesLabel = () => {
    if (isMaster) {
      if (!selectedUnits.length) return 'Todas';
      return selectedUnits.map((item) => getUnidadeLabel(item)).join(', ');
    }
    return unidadeLabel;
  };

  useEffect(() => {
    if (!isMaster) return;
    if (selectedUnits.length > 0) return;
    const fallback = unidadesOptions[0]?.value;
    if (fallback) {
      setSelectedUnits([fallback as UnidadeKey]);
    }
  }, [isMaster, selectedUnits.length, unidadesOptions]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setQuickRange('');
    setSelectedUnits(isMaster ? [] : [unidade]);
    setModality('');
    setStatus('');
    setHasGenerated(false);
    setResults(null);
    setError(null);
  };

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const applyQuickRange = (days: 30 | 14 | 7) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);
    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(today));
  };

  const handleGenerateReport = async () => {
    if (!isMaster && !isAdmin) return;
    if (isMaster && selectedUnits.length === 0) return;

    setIsLoading(true);
    setHasGenerated(false);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (isMaster) {
        params.set('unidades', selectedUnits.join(','));
      } else if (isAdmin) {
        params.set('unidades', unidade);
      }
      if (modality) params.set('modality', modality);
      if (status) params.set('status', status);
      params.set('page', '1');
      params.set('pageSize', '50');

      const response = await fetchWithAuth(`/api/reports?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.text();
        try {
          const parsed = JSON.parse(payload);
          throw new Error(parsed?.message || 'Falha ao gerar relatório.');
        } catch {
          throw new Error(payload || 'Falha ao gerar relatório.');
        }
      }

      const data = (await response.json()) as ReportResponse;
      setResults(data);
      setHasGenerated(true);
    } catch (err) {
      setResults(null);
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório.');
      setHasGenerated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const canGenerate = (isMaster || isAdmin) && (!isMaster || selectedUnits.length > 0);
  const hasValidDates = !!startDate && !!endDate && new Date(startDate) <= new Date(endDate);
  const isFormValid = canGenerate && hasValidDates;
  const hasResults = !!results?.records?.length;

  const handleExportCsv = () => {
    if (!results) return;

    const headers = ['Data', 'Paciente', 'Modalidade', 'Unidade', 'Ação', 'Usuário'];
    const rows = results.records.map((record) => [
      record.timestamp ? new Date(record.timestamp).toLocaleString('pt-BR') : '',
      record.patientName ?? '',
      record.modality ?? '',
      record.unidadeNome ?? '',
      record.actionType ?? '',
      record.userName ?? '',
    ]);

    const escapeValue = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = [
      headers.map(escapeValue).join(','),
      ...rows.map((row) => row.map((value) => escapeValue(String(value))).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!results) return;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 10;
    const marginTop = 12;
    const lineHeight = 6.5;
    let cursorY = marginTop;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Relatório de Estudos', marginX, cursorY);
    cursorY += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, marginX, cursorY);
    cursorY += 6;
    pdf.text(`Unidades: ${getSelectedUnidadesLabel()}`, marginX, cursorY);
    cursorY += 6;
    pdf.text(`Período: ${startDate || '—'} até ${endDate || '—'}`, marginX, cursorY);
    cursorY += 6;
    pdf.text(`Modalidade: ${modality || 'Todas'} | Status: ${status || 'Todos'}`, marginX, cursorY);
    cursorY += 8;

    const columns = ['Data', 'Paciente', 'Modalidade', 'Unidade', 'Ação', 'Usuário'];
    const columnWidths = [32, 55, 25, 42, 22, 42];

    const drawHeader = () => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFillColor(230, 230, 230);
      pdf.rect(marginX, cursorY - 4.5, pageWidth - marginX * 2, 7.5, 'F');
      let x = marginX + 1;
      columns.forEach((text, index) => {
        pdf.text(text, x, cursorY);
        x += columnWidths[index];
      });
      cursorY += 6.5;
      pdf.setFont('helvetica', 'normal');
    };

    drawHeader();

    results.records.forEach((record) => {
      if (cursorY + lineHeight > pageHeight - marginTop) {
        pdf.addPage();
        cursorY = marginTop;
        drawHeader();
      }

      let x = marginX + 1;
      const values = [
        record.timestamp ? new Date(record.timestamp).toLocaleString('pt-BR') : '—',
        record.patientName || '—',
        record.modality || '—',
        record.unidadeNome || '—',
        record.actionType || '—',
        record.userName || '—',
      ];

      values.forEach((value, index) => {
        const trimmed = value.length > 42 ? `${value.slice(0, 39)}...` : value;
        pdf.text(trimmed, x, cursorY);
        x += columnWidths[index];
      });

      cursorY += lineHeight;
    });

    pdf.save(`relatorio_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-theme-primary">Relatórios</h1>
          <p className="text-theme-muted">Selecione os filtros e clique em Gerar relatório.</p>
        </div>

        {!isMaster && !isAdmin && (
          <Card className="text-center">
            <p className="text-theme-muted">Você não tem permissão para gerar relatórios.</p>
          </Card>
        )}

        {(isMaster || isAdmin) && (
          <Card title="Filtros">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <Input
                type="date"
                label="Data inicial"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setQuickRange('');
                }}
              />
              <Input
                type="date"
                label="Data final"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setQuickRange('');
                }}
              />

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-theme-secondary">Período rápido</span>
                <div className="flex flex-wrap gap-3">
                  {[30, 14, 7].map((days) => (
                    <label key={days} className="flex items-center gap-2 text-sm text-theme-primary">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-theme-border text-nautico focus:ring-nautico"
                        checked={quickRange === String(days)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setQuickRange(String(days) as '30' | '14' | '7');
                            applyQuickRange(days as 30 | 14 | 7);
                          } else {
                            setQuickRange('');
                          }
                        }}
                      />
                      <span>Últimos {days} dias</span>
                    </label>
                  ))}
                </div>
              </div>

              {isMaster ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-theme-secondary">Unidades</label>
                  <div className="border border-theme-border rounded-lg bg-theme-primary p-3 max-h-44 overflow-y-auto space-y-2">
                    {unidadesOptions.map((item) => {
                      const isChecked = selectedUnits.includes(item.value as UnidadeKey);
                      return (
                        <label key={item.value} className="flex items-center gap-2 text-sm text-theme-primary">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-theme-border text-nautico focus:ring-nautico"
                            checked={isChecked}
                            onChange={(event) => {
                              const value = item.value as UnidadeKey;
                              setSelectedUnits((prev) => {
                                if (event.target.checked) {
                                  return [...prev, value];
                                }
                                return prev.filter((unit) => unit !== value);
                              });
                            }}
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-theme-secondary">Unidade</label>
                  <div className="px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary">
                    {unidadeLabel}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-theme-secondary">Modalidade</label>
                <select
                  value={modality}
                  onChange={(event) => setModality(event.target.value)}
                  className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
                >
                  {MODALIDADES.map((item) => (
                    <option key={item.value} value={item.value} className="text-theme-primary">
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-theme-secondary">Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value} className="text-theme-primary">
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar filtros
              </Button>
              <Button onClick={handleGenerateReport} disabled={!isFormValid || isLoading}>
                {isLoading ? 'Gerando...' : 'Gerar relatório'}
              </Button>
            </div>

            {!hasValidDates && (
              <p className="mt-2 text-xs text-red-200">
                Preencha uma data inicial e final válidas (data inicial menor ou igual à final).
              </p>
            )}
          </Card>
        )}

        {(isMaster || isAdmin) && (
          <Card title="Resultados">
            {isLoading && (
              <div className="flex items-center gap-3 text-theme-muted">
                <div className="w-5 h-5 border-2 border-nautico border-t-transparent rounded-full animate-spin" />
                Gerando relatório...
              </div>
            )}

            {!isLoading && error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {!isLoading && !hasGenerated && (
              <p className="text-theme-muted">Selecione os filtros e clique em Gerar relatório.</p>
            )}

            {!isLoading && hasGenerated && !error && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                    <p className="text-xs text-theme-muted">Total de exames</p>
                    <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalStudies ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                    <p className="text-xs text-theme-muted">Pacientes únicos</p>
                    <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalPatients ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                    <p className="text-xs text-theme-muted">Ações registradas</p>
                    <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalLogs ?? 0}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-theme-border">
                  <div className="px-4 py-3 bg-theme-secondary text-sm text-theme-muted">Tabela detalhada</div>
                  {results?.records?.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-theme-primary">
                        <thead className="bg-theme-card text-theme-muted">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Data</th>
                            <th className="px-4 py-3 text-left font-medium">Paciente</th>
                            <th className="px-4 py-3 text-left font-medium">Modalidade</th>
                            <th className="px-4 py-3 text-left font-medium">Unidade</th>
                            <th className="px-4 py-3 text-left font-medium">Ação</th>
                            <th className="px-4 py-3 text-left font-medium">Usuário</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.records.map((record) => (
                            <tr key={record.id} className="border-t border-theme-border">
                              <td className="px-4 py-3 text-theme-muted">
                                {record.timestamp ? new Date(record.timestamp).toLocaleString('pt-BR') : '—'}
                              </td>
                              <td className="px-4 py-3">{record.patientName || '—'}</td>
                              <td className="px-4 py-3">{record.modality || '—'}</td>
                              <td className="px-4 py-3">{record.unidadeNome || '—'}</td>
                              <td className="px-4 py-3">{record.actionType}</td>
                              <td className="px-4 py-3">{record.userName || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-theme-muted">Nenhum dado encontrado para os filtros selecionados.</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={handleExportCsv} disabled={!hasResults}>
                    Exportar CSV
                  </Button>
                  <Button variant="secondary" onClick={handleExportPdf} disabled={!hasResults}>
                    Exportar PDF
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
