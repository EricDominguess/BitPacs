import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card, Button, ActionDropdown, ToastNotice, ConfirmActionModal } from '../../components/common';
import { useFilteredStudies } from '../../components/dashboard';
import { PeriodFilter, type PeriodType } from '../../components/dashboard';
import { useOrthancData } from '../../hooks';
import { ModalityBadge, ViewerModal, DownloadModal, type SeriesForDownload, type StudyForDownload, type DownloadFormat } from '../../components/studies';
import { ReportsModal, DeleteConfirmModal } from './components';
import { useStudiesLogic } from './useStudiesLogic';

const ITEMS_PER_PAGE = 8;
const MODALITY_OPTIONS = [
  { value: 'all', label: 'Todos os exames' },
  { value: 'CT', label: 'Tomografia Computadorizada (CT)' },
  { value: 'MR', label: 'Ressonância Magnética (MR)' },
  { value: 'CR', label: 'Radiografia Computadorizada (CR)' },
  { value: 'US', label: 'Ultrassonografia (US)' },
  { value: 'DR', label: 'Radiografia Digital (DR)' },
  { value: 'DX', label: 'Radiografia Digital Diagnóstica (DX)' },
  { value: 'OT', label: 'Outros (OT)' },
] as const;

interface SelectedStudyForViewer {
  id: string;
  studyInstanceUID: string;
  patient: string;
  modality: string;
  description: string;
}

export function Studies() {
  const navigate = useNavigate();
  const { estudos, isLoading, unidadeAtual, seriesByStudy, carregarSeriesDoEstudo, buscarEstudosNoServidor, buscarModalidadeNoServidorPaginado } = useOrthancData();
  
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
  const [reportStatusByStudy, setReportStatusByStudy] = useState<Record<string, boolean>>({});
  const [reportStatusLoadingByStudy, setReportStatusLoadingByStudy] = useState<Record<string, boolean>>({});
  const [modalityServerStudyIds, setModalityServerStudyIds] = useState<Set<string> | null>(null);
  const [isLoadingModalityFilter, setIsLoadingModalityFilter] = useState(false);
  const fetchingRef = useRef<Set<string>>(new Set());
  const modalityAbortRef = useRef<AbortController | null>(null);
  const reportStatusFetchInFlightRef = useRef<Set<string>>(new Set());
  const reportStatusRequestSeqRef = useRef<Record<string, number>>({});
  const modalityDropdownRef = useRef<HTMLDivElement>(null);
  const [isModalityDropdownOpen, setIsModalityDropdownOpen] = useState(false);
  const [showFinalStudyDeleteConfirm, setShowFinalStudyDeleteConfirm] = useState(false);
  
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

  const formatDicomDate = (rawDate?: string) => {
    if (!rawDate) return '';

    const value = String(rawDate).trim();
    if (!value) return '';

    let day = 0;
    let month = 0;
    let year = 0;

    if (/^\d{8}$/.test(value)) {
      // YYYYMMDD
      year = Number(value.slice(0, 4));
      month = Number(value.slice(4, 6));
      day = Number(value.slice(6, 8));
    } else if (/^\d{6}$/.test(value)) {
      // YYMMDD
      const yy = Number(value.slice(0, 2));
      year = yy >= 50 ? 1900 + yy : 2000 + yy;
      month = Number(value.slice(2, 4));
      day = Number(value.slice(4, 6));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // YYYY-MM-DD
      year = Number(value.slice(0, 4));
      month = Number(value.slice(5, 7));
      day = Number(value.slice(8, 10));
    } else {
      const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
      if (slashMatch) {
        day = Number(slashMatch[1]);
        month = Number(slashMatch[2]);
        const y = slashMatch[3];
        year = y.length === 2 ? (Number(y) >= 50 ? 1900 + Number(y) : 2000 + Number(y)) : Number(y);
      } else {
        return value;
      }
    }

    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return '';

    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    return `${dd}/${mm}/${year}`;
  };

  const getStudyTimestamp = (rawDate?: string, rawTime?: string) => {
    if (!rawDate) return 0;

    const value = String(rawDate).trim();
    if (!value) return 0;

    let day = 0;
    let month = 0;
    let year = 0;

    if (/^\d{8}$/.test(value)) {
      year = Number(value.slice(0, 4));
      month = Number(value.slice(4, 6));
      day = Number(value.slice(6, 8));
    } else if (/^\d{6}$/.test(value)) {
      const yy = Number(value.slice(0, 2));
      year = yy >= 50 ? 1900 + yy : 2000 + yy;
      month = Number(value.slice(2, 4));
      day = Number(value.slice(4, 6));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      year = Number(value.slice(0, 4));
      month = Number(value.slice(5, 7));
      day = Number(value.slice(8, 10));
    } else {
      const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
      if (!slashMatch) return 0;
      day = Number(slashMatch[1]);
      month = Number(slashMatch[2]);
      const y = slashMatch[3];
      year = y.length === 2 ? (Number(y) >= 50 ? 1900 + Number(y) : 2000 + Number(y)) : Number(y);
    }

    const timeDigits = String(rawTime || '').replace(/\D/g, '').padEnd(6, '0');
    const hour = Number(timeDigits.slice(0, 2)) || 0;
    const minute = Number(timeDigits.slice(2, 4)) || 0;
    const second = Number(timeDigits.slice(4, 6)) || 0;

    const date = new Date(year, month - 1, day, hour, minute, second);
    const ts = date.getTime();
    return Number.isNaN(ts) ? 0 : ts;
  };

  const normalizeModality = (value?: string) => {
    if (!value) return 'OT';
    const normalized = value.trim().toUpperCase();
    const aliases: Record<string, string> = {
      'DIGITAL RADIOGRAPHY': 'DX',
      'XRAY': 'DX',
      'X-RAY': 'DX',
      'RADIOGRAPHY': 'DX',
      'COMPUTED RADIOGRAPHY': 'CR',
      'ULTRASOUND': 'US',
      'MAGNETIC RESONANCE': 'MR',
      'COMPUTED TOMOGRAPHY': 'CT',
    };
    return aliases[normalized] || normalized;
  };

  const getPrimaryModality = (study: any) => {
    const rawModalities =
      study?.MainDicomTags?.ModalitiesInStudy ||
      study?.ModalitiesInStudy ||
      study?.MainDicomTags?.Modality ||
      study?.Modality ||
      study?.RequestedTags?.Modality;

    if (Array.isArray(rawModalities) && rawModalities.length > 0) {
      return normalizeModality(String(rawModalities[0]));
    }
    if (typeof rawModalities === 'string' && rawModalities.trim()) {
      return normalizeModality(rawModalities.split(/\\|,|\+/)[0]);
    }

    const cacheKey = study?.ID || study?.id;

    const studySeries = cacheKey ? seriesByStudy?.get(cacheKey) : undefined;
    const seriesModality = studySeries?.[0]?.MainDicomTags?.Modality;
    if (seriesModality) {
      return normalizeModality(String(seriesModality));
    }

    if (cacheKey && detailsCache[cacheKey]?.modality) {
      return normalizeModality(String(detailsCache[cacheKey].modality));
    }
    return 'OT';
  };

  const getNormalizedModalities = (study: any) => {
    const collected: string[] = [];

    const pushTokens = (source: unknown) => {
      if (!source) return;
      if (Array.isArray(source)) {
        source.forEach((item) => pushTokens(item));
        return;
      }

      const value = String(source).trim();
      if (!value) return;

      value
        .split(/\\|,|\+/)
        .map((token) => normalizeModality(token))
        .filter(Boolean)
        .forEach((token) => collected.push(token));
    };

    pushTokens(study?.MainDicomTags?.ModalitiesInStudy);
    pushTokens(study?.ModalitiesInStudy);
    pushTokens(study?.MainDicomTags?.Modality);
    pushTokens(study?.Modality);
    pushTokens(study?.RequestedTags?.Modality);

    const cacheKey = study?.ID || study?.id;
    if (cacheKey && detailsCache[cacheKey]?.modality) {
      pushTokens(detailsCache[cacheKey].modality);
    }

    const unique = Array.from(new Set(collected.map((m) => m.toUpperCase())));
    return unique.length > 0 ? unique : ['OT'];
  };

  const selectedModalityOption = MODALITY_OPTIONS.find((m) => m.value === selectedModality) || MODALITY_OPTIONS[0];

  const studiesFormatted = useMemo(() =>
    periodFilteredStudies
      .map(s => ({
        id: s.ID || '',
        studyInstanceUID: s.MainDicomTags?.StudyInstanceUID || '',
        patient: normalizePatientName(s.PatientMainDicomTags?.PatientName),
        birthDate: formatDicomDate(s.PatientMainDicomTags?.PatientBirthDate),
        rawStudyDate: s.MainDicomTags?.StudyDate || '',
        rawStudyTime: s.MainDicomTags?.StudyTime || '',
        rawModalities: s.MainDicomTags?.ModalitiesInStudy || s.ModalitiesInStudy || s.MainDicomTags?.Modality || '',
        modality: getPrimaryModality(s),
        normalizedModalities: getNormalizedModalities(s),
        description: (s.MainDicomTags?.StudyDescription || '').trim() || 'sem descrição',
        date: formatDicomDate(s.MainDicomTags?.StudyDate),
        studyTimestamp: getStudyTimestamp(s.MainDicomTags?.StudyDate, s.MainDicomTags?.StudyTime),
        seriesCount: detailsCache[s.ID]?.seriesCount || 0,
        imagesCount: detailsCache[s.ID]?.imagesCount || 0
      }))
      .sort((a, b) => {
        if (b.studyTimestamp !== a.studyTimestamp) {
          return b.studyTimestamp - a.studyTimestamp;
        }
        return b.id.localeCompare(a.id);
      }),
    [periodFilteredStudies, detailsCache]
  );

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

  const studiesByModality = useMemo(() => {
    const index = new Map<string, typeof studiesBeforeModality>();
    index.set('all', studiesBeforeModality);

    for (const study of studiesBeforeModality) {
      const modalities = study.normalizedModalities || [study.modality || 'OT'];

      for (const modality of modalities) {
        const key = String(modality || 'OT').toUpperCase();
        const current = index.get(key);
        if (current) {
          current.push(study);
        } else {
          index.set(key, [study]);
        }
      }
    }

    return index;
  }, [studiesBeforeModality]);

  const studiesAfterFilters = useMemo(() => {
    if (selectedModality === 'all') return studiesBeforeModality;

    if (modalityServerStudyIds) {
      return studiesBeforeModality.filter((study) => modalityServerStudyIds.has(study.id));
    }

    const selected = selectedModality.toUpperCase();
    const byIndexed = studiesByModality.get(selected) || [];

    // Fallback robusto usando os dados crus de modalidade no estudo
    const byRaw = studiesBeforeModality.filter((study) => {
      if (Array.isArray(study.normalizedModalities) && study.normalizedModalities.includes(selected)) {
        return true;
      }

      if (study.modality?.toUpperCase() === selected) return true;

      const raw = study.rawModalities;
      if (Array.isArray(raw)) {
        return raw.some((m: string) => String(m).toUpperCase() === selected);
      }

      if (typeof raw === 'string') {
        const tokens = raw
          .toUpperCase()
          .split(/\\|,|\+/)
          .map((t: string) => t.trim())
          .filter(Boolean);
        return tokens.includes(selected);
      }

      return false;
    });

    return byRaw.length > byIndexed.length ? byRaw : byIndexed;
  }, [studiesBeforeModality, studiesByModality, selectedModality, modalityServerStudyIds]);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (modalityDropdownRef.current && !modalityDropdownRef.current.contains(event.target as Node)) {
        setIsModalityDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedModality === 'all') {
      modalityAbortRef.current?.abort();
      setModalityServerStudyIds(null);
      setIsLoadingModalityFilter(false);
      return;
    }

    const controller = new AbortController();
    modalityAbortRef.current?.abort();
    modalityAbortRef.current = controller;

    setIsLoadingModalityFilter(true);

    (async () => {
      const modality = selectedModality.toUpperCase();
      const limit = 200;
      const maxPages = 25;
      const allIds = new Set<string>();

      for (let page = 0; page < maxPages; page++) {
        if (controller.signal.aborted) return;

        const since = page * limit;
        const pageResults = await buscarModalidadeNoServidorPaginado(modality, since, limit, controller.signal);

        if (controller.signal.aborted) return;

        if (!Array.isArray(pageResults) || pageResults.length === 0) {
          break;
        }

        const before = allIds.size;
        pageResults.forEach((s: any) => {
          const id = s?.ID || s?.id;
          if (id) allIds.add(id);
        });

        const noNewIds = allIds.size === before;
        if (pageResults.length < limit || noNewIds) {
          break;
        }
      }

      setModalityServerStudyIds(allIds);
    })()
      .catch(() => {
        if (controller.signal.aborted) return;
        setModalityServerStudyIds(new Set());
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingModalityFilter(false);
        }
      });

    return () => controller.abort();
  }, [selectedModality, unidadeAtual]);

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

  const currentItemIds = useMemo(
    () => currentItems.map((study) => study.id).filter(Boolean),
    [currentItems]
  );

  const currentItemIdsKey = useMemo(() => currentItemIds.join('|'), [currentItemIds]);

  const fetchReportStatus = useCallback((id: string, force = false) => {
    if (!unidadeAtual || !id) return;

    const isFetching = reportStatusFetchInFlightRef.current.has(id);
    if (isFetching && !force) return;

    const token = sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token');
    const nextSeq = (reportStatusRequestSeqRef.current[id] || 0) + 1;
    reportStatusRequestSeqRef.current[id] = nextSeq;

    reportStatusFetchInFlightRef.current.add(id);
    setReportStatusLoadingByStudy((prev) => ({ ...prev, [id]: true }));

    fetch(`/api/dashboard/reports/${unidadeAtual}/${id}`, {
      headers: token
        ? {
            'Authorization': `Bearer ${token}`,
          }
        : undefined,
    })
      .then(async (response) => {
        if (reportStatusRequestSeqRef.current[id] !== nextSeq) return;

        if (!response.ok) {
          setReportStatusByStudy((prev) => ({ ...prev, [id]: false }));
          return;
        }

        const reports = await response.json();
        setReportStatusByStudy((prev) => ({
          ...prev,
          [id]: Array.isArray(reports) && reports.length > 0,
        }));
      })
      .catch(() => {
        if (reportStatusRequestSeqRef.current[id] !== nextSeq) return;
        setReportStatusByStudy((prev) => ({ ...prev, [id]: false }));
      })
      .finally(() => {
        if (reportStatusRequestSeqRef.current[id] !== nextSeq) return;
        reportStatusFetchInFlightRef.current.delete(id);
        setReportStatusLoadingByStudy((prev) => ({ ...prev, [id]: false }));
      });
  }, [unidadeAtual]);

  useEffect(() => {
    if (!unidadeAtual || currentItemIds.length === 0) return;

    currentItemIds.forEach((id) => {
      const alreadyLoaded = typeof reportStatusByStudy[id] === 'boolean';
      if (alreadyLoaded) return;
      fetchReportStatus(id);
    });
  }, [unidadeAtual, currentItemIdsKey, currentItemIds, reportStatusByStudy, fetchReportStatus]);

  useEffect(() => {
    if (!logic.reportStatusEvent?.studyId) return;

    const { studyId, hasReport } = logic.reportStatusEvent;

    setReportStatusByStudy((prev) => ({
      ...prev,
      [studyId]: hasReport,
    }));

    setReportStatusLoadingByStudy((prev) => ({
      ...prev,
      [studyId]: false,
    }));

    fetchReportStatus(studyId, true);
  }, [logic.reportStatusEvent, fetchReportStatus]);

  useEffect(() => {
    if (!logic.uploadNotice) return;

    const timer = window.setTimeout(() => {
      logic.setUploadNotice(null);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [logic.uploadNotice, logic.setUploadNotice]);

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

  const handleModalityClick = (mod: string) => {
    setSelectedModality(mod);
    setIsModalityDropdownOpen(false);
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
      {logic.uploadNotice && (
        <ToastNotice
          title={logic.uploadNotice.type === 'error' ? 'Falha na operação' : 'Operação concluída'}
          message={logic.uploadNotice.message}
          type={logic.uploadNotice.type}
          onClose={() => logic.setUploadNotice(null)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Estudos DICOM</h1>
          <p className="text-theme-muted mt-1">
            {isLoading || isLoadingModalityFilter ? 'Carregando dados...' : `${studiesAfterFilters.length} estudos encontrados`}
          </p>
        </div>

        {/* Filtros */}
        <Card className="!p-4 relative z-30">
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

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative z-[80]" ref={modalityDropdownRef}>
              <button
                onClick={() => setIsModalityDropdownOpen((prev) => !prev)}
                disabled={isLoadingModalityFilter}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 bg-theme-secondary border-theme-border hover:border-nautico/50 text-theme-primary text-sm font-medium ${
                  isModalityDropdownOpen ? 'ring-2 ring-nautico border-transparent' : 'hover:bg-theme-tertiary/70 hover:shadow-sm'
                }`}
              >
                {isLoadingModalityFilter ? (
                  <div className="w-4 h-4 border-2 border-nautico border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V20l-4-2v-4.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                )}
                <span>{selectedModalityOption.label}</span>
                <svg className={`w-4 h-4 text-theme-muted transition-transform duration-200 ${isModalityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isModalityDropdownOpen && (
                <div className="absolute top-full mt-2 w-80 z-[70] bg-theme-secondary border border-theme-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="p-2">
                    {MODALITY_OPTIONS.map((mod) => {
                      const isSelected = selectedModality === mod.value;
                      return (
                        <button
                          key={mod.value}
                          onClick={() => handleModalityClick(mod.value)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                            isSelected
                              ? 'bg-nautico/10 text-nautico'
                              : 'text-theme-primary hover:bg-nautico/15 hover:text-nautico'
                          }`}
                        >
                          <span>{mod.label}</span>
                          {isSelected && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="sm:ml-auto">
              <PeriodFilter
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                className="z-[80]"
                onCustomDateChange={(start, end) => {
                  setCustomStartDate(start);
                  setCustomEndDate(end);
                }}
              />
            </div>
          </div>
        </Card>

        {/* Tabela de Estudos */}
        <Card className="overflow-hidden !p-0 relative z-10">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[920px]">
              <thead className="bg-theme-secondary">
                <tr>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Paciente</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Data Nasc.</th>
                  <th className="text-center text-sm font-semibold text-theme-secondary px-6 py-4">Modalidade</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Descrição</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Data</th>
                  <th className="text-center text-sm font-semibold text-theme-secondary px-6 py-4">Séries</th>
                  <th className="text-center text-sm font-semibold text-theme-secondary px-6 py-4">Imagens</th>
                  <th className="text-center text-sm font-semibold text-theme-secondary px-6 py-4">Laudo</th>
                  <th className="text-center text-sm font-semibold text-theme-secondary px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-light">
                {isLoading || isLoadingModalityFilter ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-theme-muted">
                      Carregando estudos do servidor...
                    </td>
                  </tr>
                ) : studiesAfterFilters.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-theme-muted">
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
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <ModalityBadge modality={study.modality} />
                        </div>
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
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          {reportStatusLoadingByStudy[study.id] ? (
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-theme-muted/50 animate-pulse" title="Verificando laudo" />
                          ) : reportStatusByStudy[study.id] ? (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/15 text-green-500"
                              title="Laudado"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-theme-tertiary text-theme-muted"
                              title="Sem laudo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </span>
                          )}
                        </div>
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
                                  setShowFinalStudyDeleteConfirm(false);
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
        onConfirm={() => {
          logic.setShowDeleteConfirm(false);
          setShowFinalStudyDeleteConfirm(true);
        }}
        isDeleting={logic.isDeletingStudy}
        title="Deletar Estudo"
        message={`Tem certeza que deseja deletar o estudo de ${logic.studyToDelete?.patient}? Esta ação não pode ser desfeita.`}
      />

      <ConfirmActionModal
        isOpen={showFinalStudyDeleteConfirm}
        onClose={() => {
          if (logic.isDeletingStudy) return;
          setShowFinalStudyDeleteConfirm(false);
        }}
        onConfirm={logic.handleDeleteStudy}
        isLoading={logic.isDeletingStudy}
        title="Confirmar exclusão final"
        message={`Confirma a exclusão permanente do estudo de ${logic.studyToDelete?.patient || 'paciente selecionado'}?`}
        confirmLabel="Sim, excluir estudo"
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
