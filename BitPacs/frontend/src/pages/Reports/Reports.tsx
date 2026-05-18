import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MainLayout } from '../../components/layout';
import { Card } from '../../components/common';
import { useUnidade } from '../../contexts';
import type { UnidadeKey } from '../../contexts/UnidadeContext';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { ReportsFilters, ReportsResults } from './components';
import type { DoctorOption, ReportResponse, ReportType } from './types';

interface StoredUser {
  role?: 'Master' | 'AdminGlobal' | 'AdminLocal' | 'Admin' | 'Medico' | 'Enfermeiro';
  unidadeId?: string;
}

const normalizeRole = (role?: string) => (role === 'Admin' ? 'AdminLocal' : role);

const MODALITY_COLOR_MAP: Record<string, string> = {
  CT: '#0ea5e9',
  MR: '#a855f7',
  CR: '#0ea5e9',
  US: '#22c55e',
  DR: '#f97316',
  DX: '#0284c7',
  OT: '#94a3b8',
  'NÃO INFORMADO': '#94a3b8',
};

const FALLBACK_MODALITY_COLORS = ['#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16'];

export function Reports() {
  const { unidadesDisponiveis, unidade, unidadeLabel } = useUnidade();

  const user = useMemo<StoredUser>(() => {
    const userStr = sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user');
    return userStr ? JSON.parse(userStr) : {};
  }, []);

  const normalizedRole = normalizeRole(user.role);
  const isMaster = normalizedRole === 'Master' || normalizedRole === 'AdminGlobal';
  const isAdmin = normalizedRole === 'AdminLocal';

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

  // useEffect removido - unidades não são mais obrigatoriamente marcadas

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

    if (reportType === 'activity') {
      if (isMaster && !activityUnit) {
        setError('Nenhuma unidade selecionada. Por favor, selecione uma unidade para gerar o relatório.');
        setHasGenerated(true);
        return;
      }
    } else {
      if (isMaster && selectedUnits.length === 0) {
        setError('Nenhuma unidade selecionada. Por favor, selecione pelo menos uma unidade para gerar o relatório.');
        setHasGenerated(true);
        return;
      }
    }

    if (!startDate || !endDate) {
      setError('Preencha uma data inicial e final válidas para gerar o relatório.');
      setHasGenerated(true);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('A data inicial não pode ser maior que a data final.');
      setHasGenerated(true);
      return;
    }

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
          const unitLabel = getUnidadeLabel(String(unitValue));
          const unidadesParam = [unitValue, unitLabel]
            .filter(Boolean)
            .map((item) => String(item).trim())
            .filter((item, index, arr) => item && arr.indexOf(item) === index)
            .join(',');
          params.set('unidades', unidadesParam);
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
      params.set('pageSize', '0');

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
  const canGenerateExams = (isMaster || isAdmin);
  const canGenerate = reportType === 'activity' ? canGenerateActivity : canGenerateExams;
  const hasValidDates = !!startDate && !!endDate && new Date(startDate) <= new Date(endDate);
  const isFormValid = canGenerate;
  const hasResults = !!results?.records?.length;

  const handleExportExcel = async () => {
    if (!results) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BitPacs';
    workbook.created = new Date();

    const NAVY       = 'FF1E3A5F';
    const NAVY_LIGHT = 'FF2E4F7A';
    const WHITE      = 'FFFFFFFF';
    const GRAY_BG    = 'FFF1F5F9';
    const STRIPE     = 'FFEEF2F8';
    const BORDER_CLR = 'FFD1D5DB';
    const TOTALS_BG  = 'FFE2EAF4';

    const TOTAL_COLS = 7; // # + 6 data columns
    const lastCol = String.fromCharCode(64 + TOTAL_COLS); // 'G'

    const reportTitle = reportType === 'activity' ? 'Relatório de Atividade' : 'Relatório de Exames';
    const recordsSheet = workbook.addWorksheet('Registros', { views: [{ state: 'frozen', ySplit: 5 }] });

    // ── Rows 1-4: metadata ──────────────────────────────────────────────────
    recordsSheet.addRow([reportTitle]);
    recordsSheet.addRow([`Gerado em: ${new Date().toLocaleString('pt-BR')}`]);
    recordsSheet.addRow([`Unidades: ${getSelectedUnidadesLabel()}`]);
    recordsSheet.addRow([`Período: ${startDate || '—'} até ${endDate || '—'}`]);

    for (let r = 1; r <= 4; r++) {
      recordsSheet.mergeCells(`A${r}:${lastCol}${r}`);
    }

    const titleRow = recordsSheet.getRow(1);
    titleRow.height = 32;
    titleRow.font = { bold: true, size: 16, color: { argb: WHITE }, name: 'Calibri' };
    titleRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };

    [2, 3, 4].forEach((rowIndex) => {
      const row = recordsSheet.getRow(rowIndex);
      row.height = 18;
      row.font = { size: 10, color: { argb: 'FF374151' }, name: 'Calibri' };
      row.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_BG } };
    });

    // ── Column definitions ──────────────────────────────────────────────────
    recordsSheet.columns = [
      { key: 'seq',             width: 6  },
      { key: 'timestamp',       width: 22, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
      { key: 'primaryName',     width: 32 },
      { key: 'modality',        width: 16 },
      { key: 'studyDescription',width: 44 },
      { key: 'unidadeNome',     width: 28 },
      { key: 'actionType',      width: 14 },
    ];

    // ── Row 5: column headers ───────────────────────────────────────────────
    const headerLabels = [
      '#',
      'Data',
      reportType === 'activity' ? 'Médico' : 'Paciente',
      'Modalidade',
      'Estudos',
      'Unidade',
      'Ação',
    ];
    recordsSheet.addRow(headerLabels);
    const HEADER_ROW_INDEX = 5;
    const headerRow = recordsSheet.getRow(HEADER_ROW_INDEX);
    headerRow.height = 24;
    headerRow.font = { bold: true, size: 11, color: { argb: WHITE }, name: 'Calibri' };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_LIGHT } };
    recordsSheet.autoFilter = { from: `A${HEADER_ROW_INDEX}`, to: `${lastCol}${HEADER_ROW_INDEX}` };

    // ── Data rows ──────────────────────────────────────────────────────────
    results.records.forEach((record, index) => {
      const row = recordsSheet.addRow({
        seq: index + 1,
        timestamp: record.timestamp ? new Date(record.timestamp) : null,
        primaryName: reportType === 'activity' ? record.userName ?? '' : record.patientName ?? '',
        modality: record.modality ?? '',
        studyDescription: record.studyDescription || record.bodyPartExamined || '',
        unidadeNome: record.unidadeNome ?? '',
        actionType: record.actionType ?? '',
      });
      row.height = 20;
      row.alignment = { vertical: 'middle', wrapText: false };
      if (index % 2 !== 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STRIPE } };
      }
      // # column: centered, bold, muted
      const seqCell = row.getCell(1);
      seqCell.font = { bold: true, color: { argb: 'FF6B7280' }, size: 10 };
      seqCell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // ── Totals row ──────────────────────────────────────────────────────────
    const totalsRow = recordsSheet.addRow([
      '',
      'TOTAIS',
      `Pacientes: ${results.totals.totalPatients ?? 0}`,
      '',
      reportType === 'activity'
        ? `Ações: ${results.totals.totalLogs ?? 0}`
        : `Estudos: ${results.totals.totalStudies ?? 0}`,
      '',
      '',
    ]);
    totalsRow.height = 22;
    totalsRow.font = { bold: true, size: 10, color: { argb: NAVY }, name: 'Calibri' };
    totalsRow.alignment = { vertical: 'middle', horizontal: 'left' };
    totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTALS_BG } };

    // ── Borders on header + data + totals (explicit loop prevents phantom columns) ──
    const thinBorder: ExcelJS.Border = { style: 'thin', color: { argb: BORDER_CLR } };
    recordsSheet.eachRow((row, rowNumber) => {
      if (rowNumber < HEADER_ROW_INDEX) return;
      for (let c = 1; c <= TOTAL_COLS; c++) {
        row.getCell(c).border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
      }
    });

    const styleSheetHeader = (sheet: ExcelJS.Worksheet, lastColLetter: string, numCols: number) => {
      const h = sheet.getRow(1);
      h.height = 24;
      h.font = { bold: true, size: 11, color: { argb: WHITE }, name: 'Calibri' };
      h.alignment = { vertical: 'middle', horizontal: 'center' };
      h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY_LIGHT } };
      sheet.autoFilter = { from: 'A1', to: `${lastColLetter}1` };
      const thin: ExcelJS.Border = { style: 'thin', color: { argb: BORDER_CLR } };
      sheet.eachRow((row, rowNumber) => {
        row.height = rowNumber === 1 ? 24 : 20;
        if (rowNumber > 1) {
          row.alignment = { vertical: 'middle' };
          if (rowNumber % 2 === 0) {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STRIPE } };
          }
        }
        const bottomBorder: ExcelJS.Border = rowNumber === 1
          ? { style: 'medium', color: { argb: NAVY } }
          : thin;
        for (let c = 1; c <= numCols; c++) {
          row.getCell(c).border = { top: thin, left: thin, bottom: bottomBorder, right: thin };
        }
      });
      // number columns right-aligned
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        for (let c = 2; c <= numCols; c++) {
          row.getCell(c).alignment = { vertical: 'middle', horizontal: 'right' };
        }
      });
    };

    if (results.summaries?.byDoctor?.length) {
      const doctorSheet = workbook.addWorksheet('Resumo por médico', { views: [{ state: 'frozen', ySplit: 1 }] });
      doctorSheet.columns = [
        { header: 'Médico', key: 'doctorName', width: 36 },
        { header: 'Ações', key: 'totalActions', width: 14 },
        { header: 'Views', key: 'totalViews', width: 14 },
        { header: 'Downloads', key: 'totalDownloads', width: 16 },
      ];
      results.summaries.byDoctor.forEach((item) => {
        doctorSheet.addRow({
          doctorName: item.doctorName,
          totalActions: item.totalActions,
          totalViews: item.totalViews,
          totalDownloads: item.totalDownloads,
        });
      });
      styleSheetHeader(doctorSheet, 'D', 4);
    }

    if (results.summaries?.byUnit?.length) {
      const unitSheet = workbook.addWorksheet('Resumo por unidade', { views: [{ state: 'frozen', ySplit: 1 }] });
      unitSheet.columns = [
        { header: 'Unidade', key: 'unidade', width: 34 },
        { header: 'Ações', key: 'totalActions', width: 14 },
        { header: 'Views', key: 'totalViews', width: 14 },
        { header: 'Downloads', key: 'totalDownloads', width: 16 },
      ];
      results.summaries.byUnit.forEach((item) => {
        unitSheet.addRow({
          unidade: getUnidadeLabel(item.unidade),
          totalActions: item.totalActions,
          totalViews: item.totalViews,
          totalDownloads: item.totalDownloads,
        });
      });
      styleSheetHeader(unitSheet, 'D', 4);
    }

    if (results.summaries?.byModality?.length) {
      const modalitySheet = workbook.addWorksheet('Resumo por modalidade', { views: [{ state: 'frozen', ySplit: 1 }] });
      modalitySheet.columns = [
        { header: 'Modalidade', key: 'modality', width: 20 },
        { header: 'Estudos', key: 'totalStudies', width: 14 },
      ];
      results.summaries.byModality.forEach((item, index) => {
        const row = modalitySheet.addRow({ modality: item.modality, totalStudies: item.totalStudies });
        const swatch = MODALITY_COLOR_MAP[item.modality.trim().toUpperCase()] ?? FALLBACK_MODALITY_COLORS[index % FALLBACK_MODALITY_COLORS.length];
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${swatch.replace('#', '').toUpperCase()}` } };
        row.getCell(1).font = { color: { argb: WHITE }, bold: true };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      });
      styleSheetHeader(modalitySheet, 'B', 2);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `relatorio_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPdf = () => {
    if (!results) return;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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
    const reportLabel = reportType === 'activity' ? 'Atividade dos usuários' : 'Exames realizados';
    pdf.text(`Tipo: ${reportLabel}`, marginX, cursorY);
    cursorY += 8;

    const columns = reportType === 'activity'
      ? ['Data', 'Médico', 'Modalidade', 'Estudos', 'Unidade', 'Ação', 'Paciente']
      : ['Data', 'Paciente', 'Modalidade', 'Estudos', 'Unidade', 'Ação', 'Usuário'];

    const rows = results.records.map((record) => (
      reportType === 'activity'
        ? [
          record.timestamp ? new Date(record.timestamp).toLocaleString('pt-BR') : '—',
          record.userName || '—',
          record.modality || '—',
          record.studyDescription || '—',
          record.unidadeNome || '—',
          record.actionType || '—',
          record.patientName || '—',
        ]
        : [
          record.timestamp ? new Date(record.timestamp).toLocaleString('pt-BR') : '—',
          record.patientName || '—',
          record.modality || '—',
          record.studyDescription || '—',
          record.unidadeNome || '—',
          record.actionType || '—',
          record.userName || '—',
        ]
    ));

    autoTable(pdf, {
      startY: cursorY,
      head: [columns],
      body: rows,
      margin: { left: marginX, right: marginX },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 30,
        fontStyle: 'bold',
      },
      columnStyles: reportType === 'activity'
        ? {
          0: { cellWidth: 30 },
          1: { cellWidth: 45 },
          2: { cellWidth: 20 },
          3: { cellWidth: 50 },
          4: { cellWidth: 35 },
          5: { cellWidth: 20 },
          6: { cellWidth: 45 },
        }
        : {
          0: { cellWidth: 30 },
          1: { cellWidth: 45 },
          2: { cellWidth: 20 },
          3: { cellWidth: 55 },
          4: { cellWidth: 35 },
          5: { cellWidth: 20 },
          6: { cellWidth: 35 },
        },
    });

    const lastTable = (pdf as any).lastAutoTable;
    cursorY = lastTable?.finalY ? lastTable.finalY + 8 : cursorY + 8;

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

    if (results.summaries?.byModality?.length) {
      if (cursorY + 16 > pageHeight - marginTop) {
        pdf.addPage();
        cursorY = marginTop;
      }

      cursorY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo por modalidade', marginX, cursorY);
      cursorY += 6;
      pdf.setFont('helvetica', 'normal');

      results.summaries.byModality.forEach((item) => {
        if (cursorY + lineHeight > pageHeight - marginTop) {
          pdf.addPage();
          cursorY = marginTop;
        }
        const line = `${item.modality} | Estudos: ${item.totalStudies}`;
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
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            getUnidadeLabel={getUnidadeLabel}
          />
        )}
      </div>
    </MainLayout>
  );
}
