import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/common';
import { useUnidade } from '../../contexts';
import type { UnidadeKey } from '../../contexts/UnidadeContext';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { ReportsFilters, ReportsResults } from './components';
import type { DoctorOption, ReportResponse, ReportType } from './types';

interface StoredUser {
  role?: 'Master' | 'Admin' | 'Medico' | 'Enfermeiro';
  unidadeId?: string;
}

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

  const [reportType, setReportType] = useState<ReportType>('exams');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quickRange, setQuickRange] = useState<'30' | '14' | '7' | ''>('');
  const [selectedUnits, setSelectedUnits] = useState<UnidadeKey[]>([]);
  const [activityUnit, setActivityUnit] = useState<UnidadeKey | ''>('');
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
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
        const list = (await response.json()) as DoctorOption[];
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

        <ReportsFilters
          isMaster={isMaster}
          isAdmin={isAdmin}
          reportType={reportType}
          setReportType={(value) => {
            setReportType(value);
            setResults(null);
            setHasGenerated(false);
          }}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          quickRange={quickRange}
          setQuickRange={setQuickRange}
          applyQuickRange={applyQuickRange}
          unidadesOptions={unidadesOptions}
          selectedUnits={selectedUnits}
          setSelectedUnits={setSelectedUnits}
          activityUnit={activityUnit}
          setActivityUnit={setActivityUnit}
          unidadeLabel={unidadeLabel}
          doctors={doctors}
          selectedDoctorId={selectedDoctorId}
          setSelectedDoctorId={setSelectedDoctorId}
          isLoadingDoctors={isLoadingDoctors}
          modality={modality}
          setModality={setModality}
          status={status}
          setStatus={setStatus}
          onClearFilters={handleClearFilters}
          onGenerateReport={handleGenerateReport}
          isFormValid={isFormValid}
          isLoading={isLoading}
          hasValidDates={hasValidDates}
        />

        {(isMaster || isAdmin) && (
          <ReportsResults
            isLoading={isLoading}
            error={error}
            hasGenerated={hasGenerated}
            reportType={reportType}
            results={results}
            hasResults={hasResults}
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
            getUnidadeLabel={getUnidadeLabel}
          />
        )}
      </div>
    </MainLayout>
  );
}
