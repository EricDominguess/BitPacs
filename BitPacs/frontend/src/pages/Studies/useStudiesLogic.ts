import { useState, useRef, useCallback } from 'react';

const UNIT_NAMES: Record<string, string> = {
  '1': 'Rio Branco', '2': 'Foz do Iguaçu', '3': 'Fazenda', 
  '4': 'Faxinal', '5': 'Santa Mariana', '6': 'Guarapuava', 
  '7': 'Carlópolis', '8': 'Arapoti', 'riobranco': 'Rio Branco',
  'foziguacu': 'Foz do Iguaçu', 'fazenda': 'Fazenda', 'faxinal': 'Faxinal'
};

export function useStudiesLogic(unidadeAtual: string) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Estados
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [studyReports, setStudyReports] = useState<any[]>([]);
  const [studyToDelete, setStudyToDelete] = useState<{ id: string; patient: string } | null>(null);
  const [isDeletingStudy, setIsDeletingStudy] = useState(false);
  const [selectedStudyForReport, setSelectedStudyForReport] = useState<any>(null);
  const [selectedStudyForReports, setSelectedStudyForReports] = useState<any>(null);
  const [reportStatusEvent, setReportStatusEvent] = useState<{ studyId: string; hasReport: boolean; at: number } | null>(null);
  const [serverSearchResults, setServerSearchResults] = useState<any[] | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // Log de auditoria
  const registrarLog = useCallback(async (
    actionType: 'VIEW' | 'DOWNLOAD' | 'DELETE' | 'UPLOAD',
    study: any,
    details?: string
  ) => {
    try {
      const nomeUnidade = UNIT_NAMES[unidadeAtual] || 'Unidade Geral';
      const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
      
      await fetch('/api/studylogs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType,
          unidadeNome: nomeUnidade,
          studyId: study.id,
          studyInstanceUID: study.studyInstanceUID,
          patientName: study.patient,
          studyDescription: study.description,
          modality: study.modality,
          details,
        }),
      });
    } catch (err) {
      console.error('Erro ao registrar log:', err);
    }
  }, [unidadeAtual]);

  // Delete study
  const handleDeleteStudy = useCallback(async () => {
    if (!studyToDelete) return;
    
    setIsDeletingStudy(true);
    try {
      const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
      const response = await fetch(`/api/dashboard/study/${unidadeAtual}/${studyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        await registrarLog('DELETE', { id: studyToDelete.id, patient: studyToDelete.patient });
        setShowDeleteConfirm(false);
        setStudyToDelete(null);
        window.location.reload();
      } else {
        alert('Erro ao deletar estudo');
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao deletar estudo');
    } finally {
      setIsDeletingStudy(false);
    }
  }, [studyToDelete, registrarLog, unidadeAtual]);

  // Attach report
  const handleAttachReportClick = useCallback((study: any) => {
    setSelectedStudyForReport(study);
    fileInputRef.current?.click();
  }, []);

  // View reports
  const handleViewReports = useCallback(async (study: any) => {
    setSelectedStudyForReports(study);
    setShowReportsModal(true);
    setReportLoading(true);

    try {
      const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
      const response = await fetch(`/api/dashboard/reports/${unidadeAtual}/${study.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const reports = await response.json();
        setStudyReports(reports);
      }
    } catch (err) {
      console.error('Erro ao buscar laudos:', err);
    } finally {
      setReportLoading(false);
    }
  }, [unidadeAtual]);

  // Delete report
  const handleDeleteReport = useCallback(async () => {
    if (!selectedStudyForReports) return;

    try {
      const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
      const response = await fetch(`/api/dashboard/reports/${unidadeAtual}/${selectedStudyForReports.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await registrarLog('DELETE', selectedStudyForReports, 'Laudo deletado');
        // Reload laudos - fetch directly without calling handleViewReports
        try {
          const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
          const response = await fetch(`/api/dashboard/reports/${unidadeAtual}/${selectedStudyForReports.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });

          if (response.ok) {
            const reports = await response.json();
            setStudyReports(reports);
            setReportStatusEvent({
              studyId: selectedStudyForReports.id,
              hasReport: Array.isArray(reports) && reports.length > 0,
              at: Date.now(),
            });
          }
        } catch (err) {
          console.error('Erro ao recarregar laudos:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao deletar laudo:', err);
    }
  }, [selectedStudyForReports, registrarLog, unidadeAtual]);

  // Upload file
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedStudyForReport) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setReportLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('studyId', selectedStudyForReport.id);
      formData.append('patientName', selectedStudyForReport.patient);

      const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
      const response = await fetch(`/api/dashboard/reports/${unidadeAtual}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        await response.json();
        alert(`Laudo anexado com sucesso para ${selectedStudyForReport.patient}!`);
        await registrarLog('UPLOAD', selectedStudyForReport, `Laudo anexado: ${file.name}`);
        setReportStatusEvent({
          studyId: selectedStudyForReport.id,
          hasReport: true,
          at: Date.now(),
        });
      } else {
        const error = await response.json();
        alert(`Erro ao anexar laudo: ${error.message}`);
      }
    } catch (err) {
      console.error('Erro ao fazer upload do laudo:', err);
      alert('Erro ao anexar laudo. Verifique o console.');
    } finally {
      setReportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [selectedStudyForReport, registrarLog, unidadeAtual]);

  return {
    // Refs
    fileInputRef,
    abortControllerRef,
    // States
    showDeleteConfirm,
    setShowDeleteConfirm,
    showReportsModal,
    setShowReportsModal,
    reportLoading,
    studyReports,
    setStudyReports,
    studyToDelete,
    setStudyToDelete,
    isDeletingStudy,
    selectedStudyForReport,
    selectedStudyForReports,
    reportStatusEvent,
    serverSearchResults,
    setServerSearchResults,
    isSearchingServer,
    setIsSearchingServer,
    // Handlers
    registrarLog,
    handleDeleteStudy,
    handleAttachReportClick,
    handleViewReports,
    handleDeleteReport,
    handleFileSelect,
  };
}
