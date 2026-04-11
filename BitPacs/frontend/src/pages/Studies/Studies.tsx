import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card, Button, ActionDropdown } from '../../components/common';
import { useFilteredStudies } from '../../components/dashboard';
import { PeriodFilter, type PeriodType } from '../../components/dashboard';
import { useOrthancData } from '../../hooks';
import { ModalityBadge, ViewerModal, DownloadModal, type SeriesForDownload, type StudyForDownload, type DownloadFormat } from '../../components/studies';
import { ReportsModal, DeleteConfirmModal } from './components';
import { useStudiesLogic } from './useStudiesLogic';

const ITEMS_PER_PAGE = 8;
const MODALITY_OPTIONS = ['all', 'CT', 'MR', 'CR', 'US', 'DR', 'DX', 'OT'] as const;

interface SelectedStudyForViewer {
  id: string;
  studyInstanceUID: string;
  patient: string;
  modality: string;
  description: string;
}

export function Studies() {
  const navigate = useNavigate();
  const { estudos, isLoading, unidadeAtual, carregarSeriesDoEstudo, buscarEstudosNoServidor, buscarModalidadeNoServidor } = useOrthancData();
  
  // Hooks customizados
  const logic = useStudiesLogic(unidadeAtual);
  
  // Estados da página
  const [currentUser, setCurrentUser] = useState<{ id: number; nome: string; role: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsCache, setDetailsCache] = useState<Record<string, any>>({});
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [selectedStudyForViewer, setSelectedStudyForViewer] = useState<SelectedStudyForViewer | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [studyForDownload, setStudyForDownload] = useState<StudyForDownload | null>(null);
  const [seriesForDownload, setSeriesForDownload] = useState<SeriesForDownload[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [isDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('jpeg');
  const [availableModalities, setAvailableModalities] = useState<string[]>([]);
  const fetchingRef = useRef<Set<string>>(new Set());
  
  // Filtra estudos
  const { estudosFiltrados: periodFilteredStudies } = useFilteredStudies(
    estudos,
    selectedPeriod,
    customStartDate,
    customEndDate
  );

  const normalizePatientName = (name?: string) => {
    if (!name) return 'Desconhecido';
    return name
      .replace(/\^+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const formatDicomDate = (dicomDate?: string) => {
    if (!dicomDate || dicomDate.length !== 8) return '';
    const year = Number(dicomDate.slice(0, 4));
    const month = Number(dicomDate.slice(4, 6)) - 1;
    const day = Number(dicomDate.slice(6, 8));
    const date = new Date(year, month, day);
    if (Number.isNaN(date.getTime())) return '';
    const dd = String(day).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    const yy = String(year).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const studiesFormatted = useMemo(() => periodFilteredStudies.map(s => ({
    id: s.ID || '',
    studyInstanceUID: s.MainDicomTags?.StudyInstanceUID || '',
    patient: normalizePatientName(s.PatientMainDicomTags?.PatientName),
    birthDate: formatDicomDate(s.PatientMainDicomTags?.PatientBirthDate),
    modality: (() => {
      const rawModalities = s.MainDicomTags?.ModalitiesInStudy;
      if (Array.isArray(rawModalities) && rawModalities.length > 0) {
        return String(rawModalities[0]).toUpperCase();
      }
      if (typeof rawModalities === 'string' && rawModalities.trim()) {
        return rawModalities.split('\\')[0].split(',')[0].trim().toUpperCase();
      }
      return (detailsCache[s.ID]?.modality || 'Carregando...').toUpperCase();
    })(),
    description: s.MainDicomTags?.StudyDescription || '',
    date: formatDicomDate(s.MainDicomTags?.StudyDate),
    seriesCount: detailsCache[s.ID]?.seriesCount || 0,
    imagesCount: detailsCache[s.ID]?.imagesCount || 0
  })), [periodFilteredStudies, detailsCache]);

  const studiesBeforeModality = useMemo(() => {
    let base = studiesFormatted;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      base = base.filter((study) =>
        study.patient.toLowerCase().includes(term) ||
        study.id.toLowerCase().includes(term) ||
        study.studyInstanceUID.toLowerCase().includes(term) ||
        study.description.toLowerCase().includes(term)
      );
    }

    if (logic.serverSearchResults && logic.serverSearchResults.length > 0) {
      const ids = new Set(logic.serverSearchResults.map((s: any) => s?.ID || s?.id));
      base = base.filter((study) => ids.has(study.id));
    }

    return base;
  }, [studiesFormatted, searchTerm, logic.serverSearchResults]);

  const modalityCounts = useMemo(() => {
    return studiesBeforeModality.reduce<Record<string, number>>((acc, study) => {
      const mod = (study.modality || 'OT').toUpperCase();
      acc[mod] = (acc[mod] || 0) + 1;
      return acc;
    }, {});
  }, [studiesBeforeModality]);

  const studiesAfterFilters = useMemo(() => {
    if (selectedModality === 'all') return studiesBeforeModality;
    return studiesBeforeModality.filter((study) => study.modality?.toUpperCase() === selectedModality.toUpperCase());
  }, [studiesBeforeModality, selectedModality]);

  // Paginação
  const totalPages = Math.ceil(studiesAfterFilters.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = studiesAfterFilters.slice(indexOfFirstItem, indexOfLastItem);

  // Efeitos
  useEffect(() => {
    const userStr = sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedModality, selectedPeriod, customStartDate, customEndDate, logic.serverSearchResults]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      logic.setServerSearchResults(null);
    }
  }, [searchTerm, logic.setServerSearchResults]);

  useEffect(() => {
    currentItems.forEach((study) => {
      if (!detailsCache[study.id] && !fetchingRef.current.has(study.id)) {
        fetchingRef.current.add(study.id);
        carregarSeriesDoEstudo(study.id).then((seriesData: any) => {
          let totalInstances = 0;
          let realModality = 'Desconhecido';
          if (seriesData?.length > 0) {
            totalInstances = seriesData.reduce((acc: number, s: any) => acc + (s.Instances?.length || 0), 0);
            if (seriesData[0].MainDicomTags?.Modality) {
              realModality = seriesData[0].MainDicomTags.Modality;
            }
          }
          setDetailsCache(prev => ({
            ...prev,
            [study.id]: {
              modality: realModality,
              seriesCount: seriesData ? seriesData.length : 0,
              imagesCount: totalInstances
            }
          }));
        }).finally(() => {
          fetchingRef.current.delete(study.id);
        });
      }
    });
  }, [currentItems, carregarSeriesDoEstudo, detailsCache]);

  // Handlers
  const handleServerSearch = async () => {
    if (!searchTerm.trim()) return;
    logic.setIsSearchingServer(true);
    try {
      const results = await buscarEstudosNoServidor(searchTerm);
      logic.setServerSearchResults(results || []);
    } finally {
      logic.setIsSearchingServer(false);
    }
  };

  const handleModalityClick = async (mod: string) => {
    setSelectedModality(mod);
    if (mod !== 'all' && !availableModalities.includes(mod)) {
      try {
        const modalities = await buscarModalidadeNoServidor(mod);
        if (modalities && !availableModalities.includes(mod)) {
          setAvailableModalities(prev => [...new Set([...prev, mod])]);
        }
      } catch (err) {
        console.error('Erro ao buscar modalidade:', err);
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handleOpenViewerModal = (study: typeof studiesFormatted[0]) => {
    setSelectedStudyForViewer({
      id: study.id,
      studyInstanceUID: study.studyInstanceUID,
      patient: study.patient,
      modality: study.modality,
      description: study.description
    });
    setShowViewerModal(true);
  };

  const handleOpenInternalViewer = () => {
    if (selectedStudyForViewer) {
      logic.registrarLog('VIEW', selectedStudyForViewer);
      setShowViewerModal(false);
      navigate(`/viewer/${selectedStudyForViewer.studyInstanceUID}?unidade=${unidadeAtual}`);
    }
  };

  const handleOpenOHIFViewer = () => {
    if (selectedStudyForViewer) {
      logic.registrarLog('VIEW', selectedStudyForViewer);
      setShowViewerModal(false);
      navigate(`/ohif-viewer/${selectedStudyForViewer.studyInstanceUID}?unidade=${unidadeAtual}`);
    }
  };

  const handleOpenDownloadModal = async (study: typeof studiesFormatted[0]) => {
    setStudyForDownload({
      id: study.id,
      patient: study.patient,
      description: study.description,
      modality: study.modality,
      studyInstanceUID: study.studyInstanceUID,
      date: study.date,
      birthDate: study.birthDate,
      bodyPartExamined: undefined,
      patientId: undefined
    });
    setDownloadFormat('jpeg');
    setShowDownloadModal(true);
    setIsLoadingSeries(true);
    
    try {
      const seriesData = await carregarSeriesDoEstudo(study.id);
      const series = seriesData?.map((s: any) => ({
        uid: s.ID,
        modality: s.MainDicomTags?.Modality || 'Unknown',
        description: s.MainDicomTags?.SeriesDescription || 'Series',
        instanceCount: s.Instances?.length || 0,
        instances: s.Instances?.map((inst: any, idx: number) => ({
          uid: inst,
          index: idx + 1
        })) || []
      })) || [];
      setSeriesForDownload(series as any);
    } catch (err) {
      console.error('Erro ao carregar séries:', err);
    } finally {
      setIsLoadingSeries(false);
    }
  };

  const toggleSelectAll = () => {
    // Lógica aqui
  };

  const toggleSeriesExpanded = () => {
    // Lógica aqui
  };

  const toggleSeriesSelection = () => {
    // Lógica aqui
  };

  const toggleInstanceSelection = () => {
    // Lógica aqui
  };

  const countSelected = () => ({ seriesCount: 0, instancesCount: 0 });

  const executeDownload = async () => {
    // Lógica de download
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Estudos DICOM</h1>
          <p className="text-theme-muted mt-1">
            {isLoading ? 'Carregando dados...' : `${studiesAfterFilters.length} estudos encontrados`}
          </p>
        </div>

        {/* Filtros */}
        <Card className="!p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                placeholder="Buscar por paciente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-theme-secondary border border-theme-border text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico"
              />
            </div>
            <button
              onClick={handleServerSearch}
              className="px-4 py-2 bg-nautico text-white rounded-lg hover:bg-nautico/90 transition-colors"
            >
              Pesquisar
            </button>
          </div>

          <div className="mt-4">
            <div className="flex justify-end">
              <PeriodFilter
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onCustomDateChange={(start, end) => {
                  setCustomStartDate(start);
                  setCustomEndDate(end);
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-theme-primary mb-3">
              Filtrar por Modalidade
            </label>
            <div className="flex flex-wrap gap-2">
              {MODALITY_OPTIONS.map((mod) => (
                <button
                  key={mod}
                  onClick={() => handleModalityClick(mod)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedModality === mod
                      ? 'bg-nautico text-white'
                      : 'bg-theme-card text-theme-muted hover:text-theme-primary border border-theme-border'
                  }`}
                >
                  {mod === 'all'
                    ? `Todos (${studiesBeforeModality.length})`
                    : `${mod} (${modalityCounts[mod] || 0})`}
                </button>
              ))}
            </div>
            {selectedModality !== 'all' && (
              <p className="mt-2 text-sm text-theme-muted">
                {`Total de exames ${selectedModality}: ${studiesAfterFilters.length}`}
              </p>
            )}
          </div>
        </Card>

        {/* Tabela de Estudos */}
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[800px]">
              <thead className="bg-theme-secondary">
                <tr>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Paciente</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Data Nasc.</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Modalidade</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Descrição</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Data</th>
                  <th className="text-center text-sm font-semibold text-theme-secondary px-6 py-4">Séries</th>
                  <th className="text-center text-sm font-semibold text-theme-secondary px-6 py-4">Imagens</th>
                  <th className="text-center text-sm font-semibold text-theme-secondary px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-light">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-theme-muted">
                      Carregando estudos do servidor...
                    </td>
                  </tr>
                ) : studiesAfterFilters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-theme-muted">
                      Nenhum estudo encontrado.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((study) => (
                    <tr key={study.id} className="hover:bg-nautico/10 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-theme-primary">{study.patient}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-theme-muted text-sm">{study.birthDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <ModalityBadge modality={study.modality} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-theme-secondary">{study.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-theme-muted">{study.date}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-theme-secondary">{study.seriesCount}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-theme-secondary">{study.imagesCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <ActionDropdown
                            actions={[
                              {
                                label: 'Visualizar',
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                                onClick: () => handleOpenViewerModal(study)
                              },
                              {
                                label: 'Baixar',
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                                onClick: () => handleOpenDownloadModal(study)
                              },
                              {
                                label: 'Anexar Laudo',
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
                                onClick: () => logic.handleAttachReportClick(study)
                              },
                              {
                                label: 'Visualizar Laudos',
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                                onClick: () => logic.handleViewReports(study),
                                divider: true
                              },
                              ...(currentUser?.role === 'Master' ? [{
                                label: 'Deletar',
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
                                onClick: () => {
                                  logic.setStudyToDelete({ id: study.id, patient: study.patient });
                                  logic.setShowDeleteConfirm(true);
                                },
                                variant: 'danger' as const
                              }] : [])
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-secondary">
            <span className="text-sm text-theme-muted">
              {studiesAfterFilters.length > 0 ? (
                <>Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, studiesAfterFilters.length)} de {studiesAfterFilters.length} resultados</>
              ) : (
                'Nenhum resultado'
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                Anterior
              </Button>
              <span className="text-xs text-theme-muted font-medium px-2">
                Pág {currentPage} de {totalPages || 1}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                Próximo
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <ViewerModal
        isOpen={showViewerModal}
        study={selectedStudyForViewer}
        onClose={() => setShowViewerModal(false)}
        onOpenInternal={handleOpenInternalViewer}
        onOpenOHIF={handleOpenOHIFViewer}
      />

      <DownloadModal
        isOpen={showDownloadModal}
        study={studyForDownload}
        series={seriesForDownload}
        isLoadingSeries={isLoadingSeries}
        isDownloading={isDownloading}
        downloadFormat={downloadFormat}
        onClose={() => setShowDownloadModal(false)}
        onFormatChange={setDownloadFormat}
        onToggleSelectAll={() => toggleSelectAll()}
        onToggleSeriesExpanded={toggleSeriesExpanded}
        onToggleSeriesSelection={toggleSeriesSelection}
        onToggleInstanceSelection={toggleInstanceSelection}
        onDownload={executeDownload}
        countSelected={countSelected}
      />

      <DeleteConfirmModal
        isOpen={logic.showDeleteConfirm}
        onClose={() => logic.setShowDeleteConfirm(false)}
        onConfirm={logic.handleDeleteStudy}
        isDeleting={logic.isDeletingStudy}
        title="Deletar Estudo"
        message={`Tem certeza que deseja deletar o estudo de ${logic.studyToDelete?.patient}? Esta ação não pode ser desfeita.`}
      />

      <ReportsModal
        isOpen={logic.showReportsModal}
        onClose={() => logic.setShowReportsModal(false)}
        reports={logic.studyReports}
        isLoading={logic.reportLoading}
        onDeleteReport={logic.handleDeleteReport}
      />

      <input
        ref={logic.fileInputRef}
        type="file"
        accept=".pdf"
        onChange={logic.handleFileSelect}
        className="hidden"
      />
    </MainLayout>
  );
}
