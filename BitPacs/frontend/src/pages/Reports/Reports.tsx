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
  summaries?: {
    byDoctor?: Array<{ doctorId: number; doctorName: string; totalActions: number; totalViews: number; totalDownloads: number }>;
    byUnit?: Array<{ unidade: string; totalActions: number; totalViews: number; totalDownloads: number }>;
  };
}

const MODALIDADES = [
  { value: '', label: 'Todas' },
  { value: 'CR', label: 'Raio-X (CR)' },
  { value: 'CT', label: 'Tomografia (CT)' },
  { value: 'MR', label: 'Ressonância (MR)' },
  { value: 'US', label: 'Ultrassom (US)' },
  { value: 'DX', label: 'Radiografia Digital (DX)' },
  { value: 'MG', label: 'Mamografia (MG)' },
  { value: 'XA', label: 'Angiografia (XA)' },
  { value: 'NM', label: 'Medicina Nuclear (NM)' },
  { value: 'PT', label: 'PET (PT)' },
  { value: 'RF', label: 'Fluoroscopia (RF)' },
  { value: 'SC', label: 'Cintilografia (SC)' },
  { value: 'OT', label: 'Outros (OT)' },
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

  const [reportType, setReportType] = useState<'activity' | 'exams'>('exams');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickRange, setQuickRange] = useState<'30' | '14' | '7' | ''>('');
  const [selectedUnits, setSelectedUnits] = useState<UnidadeKey[]>([]);
  const [activityUnit, setActivityUnit] = useState<UnidadeKey | ''>('');
  const [doctors, setDoctors] = useState<Array<{ id: number; nome: string; unidadeId?: string }>>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
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

  useEffect(() => {
    if (!isMaster) {
      setActivityUnit(unidade);
      return;
    }

    if (reportType !== 'activity') return;
    if (activityUnit) return;
    const fallback = unidadesOptions[0]?.value;
    if (fallback) {
      setActivityUnit(fallback as UnidadeKey);
    }
  }, [activityUnit, isMaster, reportType, unidade, unidadesOptions]);

  useEffect(() => {
    if (reportType !== 'activity') return;

    const targetUnit = isMaster ? activityUnit : unidade;
    if (!targetUnit) {
      setDoctors([]);
      return;
    }

    const loadDoctors = async () => {
      try {
        setIsLoadingDoctors(true);
        const unitValue = isMaster ? activityUnit : unidade;
        const unitLabel = unitValue ? getUnidadeLabel(String(unitValue)) : '';
        const params = new URLSearchParams();
        if (unitValue) params.set('unidade', unitValue);
        if (unitLabel) params.set('unidadeLabel', unitLabel);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await fetchWithAuth(`/api/reports/doctors${query}`);
        if (!response.ok) return;
        const list = (await response.json()) as Array<{ id: number; nome: string; unidadeId?: string }>;
        setDoctors(list);
      } catch {
        setDoctors([]);
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [activityUnit, isMaster, reportType, unidade]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setQuickRange('');
    setSelectedUnits(isMaster ? [] : [unidade]);
    setActivityUnit(isMaster ? '' : unidade);
    setSelectedDoctorId('');
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
      params.set('reportType', reportType);
      if (reportType === 'activity') {
        const unitValue = isMaster ? activityUnit : unidade;
        if (unitValue) {
          params.set('unidades', unitValue);
        }
        if (selectedDoctorId) {
          params.set('medicoId', selectedDoctorId);
        }
      } else {
        if (isMaster) {
          params.set('unidades', selectedUnits.join(','));
        } else if (isAdmin) {
          params.set('unidades', unidade);
        }
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

  const canGenerateActivity = (isMaster || isAdmin) && (!!activityUnit || !isMaster);
  const canGenerateExams = (isMaster || isAdmin) && (!isMaster || selectedUnits.length > 0);
  const canGenerate = reportType === 'activity' ? canGenerateActivity : canGenerateExams;
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
    const contentLines = [
      headers.map(escapeValue).join(','),
      ...rows.map((row) => row.map((value) => escapeValue(String(value))).join(',')),
    ];

    if (results.summaries?.byDoctor?.length) {
      contentLines.push('');
      contentLines.push(escapeValue('Resumo por médico'));
      contentLines.push(['Médico', 'Ações', 'Views', 'Downloads'].map(escapeValue).join(','));
      results.summaries.byDoctor.forEach((item) => {
        contentLines.push([
          item.doctorName,
          String(item.totalActions),
          String(item.totalViews),
          String(item.totalDownloads),
        ].map(escapeValue).join(','));
      });
    }

    if (results.summaries?.byUnit?.length) {
      contentLines.push('');
      contentLines.push(escapeValue('Resumo por unidade'));
      contentLines.push(['Unidade', 'Ações', 'Views', 'Downloads'].map(escapeValue).join(','));
      results.summaries.byUnit.forEach((item) => {
        contentLines.push([
          getUnidadeLabel(item.unidade),
          String(item.totalActions),
          String(item.totalViews),
          String(item.totalDownloads),
        ].map(escapeValue).join(','));
      });
    }

    const csvContent = contentLines.join('\n');

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
    const reportLabel = reportType === 'activity' ? 'Atividade dos médicos' : 'Exames realizados';
    pdf.text(`Tipo: ${reportLabel}`, marginX, cursorY);
    cursorY += 8;

    const columns = reportType === 'activity'
      ? ['Data', 'Médico', 'Modalidade', 'Unidade', 'Ação', 'Paciente']
      : ['Data', 'Paciente', 'Modalidade', 'Unidade', 'Ação', 'Usuário'];
    const columnWidths = reportType === 'activity'
      ? [32, 50, 25, 40, 22, 50]
      : [32, 55, 25, 42, 22, 42];

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
      const values = reportType === 'activity'
        ? [
          record.timestamp ? new Date(record.timestamp).toLocaleString('pt-BR') : '—',
          record.userName || '—',
          record.modality || '—',
          record.unidadeNome || '—',
          record.actionType || '—',
          record.patientName || '—',
        ]
        : [
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

    if (results.summaries?.byDoctor?.length) {
      if (cursorY + 16 > pageHeight - marginTop) {
        pdf.addPage();
        cursorY = marginTop;
      }

      cursorY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo por médico', marginX, cursorY);
      cursorY += 6;
      pdf.setFont('helvetica', 'normal');

      results.summaries.byDoctor.forEach((item) => {
        if (cursorY + lineHeight > pageHeight - marginTop) {
          pdf.addPage();
          cursorY = marginTop;
        }
        const line = `${item.doctorName} | Ações: ${item.totalActions} | Views: ${item.totalViews} | Downloads: ${item.totalDownloads}`;
        pdf.text(line, marginX, cursorY);
        cursorY += lineHeight;
      });
    }

    if (results.summaries?.byUnit?.length) {
      if (cursorY + 16 > pageHeight - marginTop) {
        pdf.addPage();
        cursorY = marginTop;
      }

      cursorY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo por unidade', marginX, cursorY);
      cursorY += 6;
      pdf.setFont('helvetica', 'normal');

      results.summaries.byUnit.forEach((item) => {
        if (cursorY + lineHeight > pageHeight - marginTop) {
          pdf.addPage();
          cursorY = marginTop;
        }
        const label = getUnidadeLabel(item.unidade);
        const line = `${label} | Ações: ${item.totalActions} | Views: ${item.totalViews} | Downloads: ${item.totalDownloads}`;
        pdf.text(line, marginX, cursorY);
        cursorY += lineHeight;
      });
    }

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
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-theme-secondary">Tipo de relatório</label>
                <select
                  value={reportType}
                  onChange={(event) => {
                    setReportType(event.target.value as 'activity' | 'exams');
                    setResults(null);
                    setHasGenerated(false);
                  }}
                  className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
                >
                  <option value="activity">Atividade dos médicos</option>
                  <option value="exams">Exames realizados</option>
                </select>
              </div>

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

              <div className="md:col-span-2 xl:col-span-2 text-xs text-theme-muted">
                Para períodos personalizados, preencha as datas acima.
              </div>

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

              {reportType === 'activity' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-theme-secondary">Unidade</label>
                  {isMaster ? (
                    <select
                      value={activityUnit}
                      onChange={(event) => {
                        setActivityUnit(event.target.value as UnidadeKey);
                        setSelectedDoctorId('');
                      }}
                      className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
                    >
                      <option value="" className="text-theme-muted">Selecione</option>
                      {unidadesOptions.map((item) => (
                        <option key={item.value} value={item.value} className="text-theme-primary">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary">
                      {unidadeLabel}
                    </div>
                  )}
                </div>
              ) : isMaster ? (
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

              {reportType === 'activity' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-theme-secondary">Médico</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(event) => setSelectedDoctorId(event.target.value)}
                    className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {isLoadingDoctors && (
                      <option value="" disabled>Carregando médicos...</option>
                    )}
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={String(doctor.id)}>
                        {doctor.nome}
                      </option>
                    ))}
                    {!isLoadingDoctors && doctors.length === 0 && (
                      <option value="" disabled>Nenhum médico encontrado</option>
                    )}
                  </select>
                  {!isLoadingDoctors && doctors.length === 0 && (
                    <span className="text-xs text-theme-muted">Cadastre usuários com função Médico para aparecer aqui.</span>
                  )}
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
                    <p className="text-xs text-theme-muted">
                      {reportType === 'activity' ? 'Total de ações' : 'Total de exames'}
                    </p>
                    <p className="text-xl font-semibold text-theme-primary">
                      {reportType === 'activity' ? results?.totals.totalLogs ?? 0 : results?.totals.totalStudies ?? 0}
                    </p>
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
                            <th className="px-4 py-3 text-left font-medium">
                              {reportType === 'activity' ? 'Médico' : 'Paciente'}
                            </th>
                            <th className="px-4 py-3 text-left font-medium">Modalidade</th>
                            <th className="px-4 py-3 text-left font-medium">Unidade</th>
                            <th className="px-4 py-3 text-left font-medium">Ação</th>
                            <th className="px-4 py-3 text-left font-medium">
                              {reportType === 'activity' ? 'Paciente' : 'Usuário'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.records.map((record) => (
                            <tr key={record.id} className="border-t border-theme-border">
                              <td className="px-4 py-3 text-theme-muted">
                                {record.timestamp ? new Date(record.timestamp).toLocaleString('pt-BR') : '—'}
                              </td>
                              <td className="px-4 py-3">
                                {reportType === 'activity' ? record.userName || '—' : record.patientName || '—'}
                              </td>
                              <td className="px-4 py-3">{record.modality || '—'}</td>
                              <td className="px-4 py-3">{record.unidadeNome || '—'}</td>
                              <td className="px-4 py-3">{record.actionType}</td>
                              <td className="px-4 py-3">
                                {reportType === 'activity' ? record.patientName || '—' : record.userName || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-theme-muted">Nenhum dado encontrado para os filtros selecionados.</div>
                  )}
                </div>

                {(results?.summaries?.byDoctor?.length || results?.summaries?.byUnit?.length) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {!!results?.summaries?.byDoctor?.length && (
                      <div className="rounded-lg border border-theme-border">
                        <div className="px-4 py-3 bg-theme-secondary text-sm text-theme-muted">Resumo por médico</div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm text-theme-primary">
                            <thead className="bg-theme-card text-theme-muted">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium">Médico</th>
                                <th className="px-4 py-2 text-left font-medium">Ações</th>
                                <th className="px-4 py-2 text-left font-medium">Views</th>
                                <th className="px-4 py-2 text-left font-medium">Downloads</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.summaries?.byDoctor?.map((item) => (
                                <tr key={item.doctorId} className="border-t border-theme-border">
                                  <td className="px-4 py-2">{item.doctorName}</td>
                                  <td className="px-4 py-2">{item.totalActions}</td>
                                  <td className="px-4 py-2">{item.totalViews}</td>
                                  <td className="px-4 py-2">{item.totalDownloads}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {!!results?.summaries?.byUnit?.length && (
                      <div className="rounded-lg border border-theme-border">
                        <div className="px-4 py-3 bg-theme-secondary text-sm text-theme-muted">Resumo por unidade</div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm text-theme-primary">
                            <thead className="bg-theme-card text-theme-muted">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium">Unidade</th>
                                <th className="px-4 py-2 text-left font-medium">Ações</th>
                                <th className="px-4 py-2 text-left font-medium">Views</th>
                                <th className="px-4 py-2 text-left font-medium">Downloads</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.summaries?.byUnit?.map((item) => (
                                <tr key={item.unidade} className="border-t border-theme-border">
                                  <td className="px-4 py-2">{getUnidadeLabel(item.unidade)}</td>
                                  <td className="px-4 py-2">{item.totalActions}</td>
                                  <td className="px-4 py-2">{item.totalViews}</td>
                                  <td className="px-4 py-2">{item.totalDownloads}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
