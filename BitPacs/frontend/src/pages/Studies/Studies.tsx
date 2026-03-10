import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { MainLayout } from '../../components/layout';
import { Card, Button, Input } from '../../components/common';
import { PeriodFilter, useFilteredStudies } from '../../components/dashboard';
import type { PeriodType } from '../../components/dashboard';
import { useOrthancData } from '../../hooks';
import { 
  ModalityBadge, 
  ViewerModal, 
  DownloadModal,
  type SeriesForDownload,
  type StudyForDownload,
  type DownloadFormat
} from '../../components/studies';

// Constante de itens por página
const ITEMS_PER_PAGE = 8;

// Interface para o estudo selecionado no modal
interface SelectedStudyForViewer {
  id: string;
  studyInstanceUID: string;
  patient: string;
  modality: string;
  description: string;
}

export function Studies() {
  const navigate = useNavigate();
  // Usa o índice de séries por estudo para busca O(1)
  const { estudos, isLoading, unidadeAtual, carregarSeriesDoEstudo, buscarEstudosNoServidor, buscarModalidadeNoServidor } = useOrthancData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  
  // Estados do filtro de período
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // 1. Estado para controlar a página atual
  const [currentPage, setCurrentPage] = useState(1);

  const [detailsCache, setDetailsCache] = useState<Record<string, any>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  const [serverSearchResults, setServerSearchResults] = useState<any[] | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Estado para o modal de seleção de visualizador
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [selectedStudyForViewer, setSelectedStudyForViewer] = useState<SelectedStudyForViewer | null>(null);

  // Estados para o modal de download
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [studyForDownload, setStudyForDownload] = useState<StudyForDownload | null>(null);
  const [seriesForDownload, setSeriesForDownload] = useState<SeriesForDownload[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('jpeg');

  // Função que o botão vai chamar
  const handleServerSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setServerSearchResults(null); // volta a mostrar os exames recentes
      return;
    }
    setIsSearchingServer(true);
    const resultados = await buscarEstudosNoServidor(searchTerm);
    setServerSearchResults(resultados);
    setIsSearchingServer(false);
    setCurrentPage(1); // Reseta para a primeira página dos resultados
  };

  // Se o usuário apagar o campo de texto, nós limpamos a busca do servidor automaticamente
  useEffect(() => {
    if (searchTerm === '') {
      setServerSearchResults(null);
    }
  }, [searchTerm]);

  // Filtra estudos pelo período selecionado
  const { estudosFiltrados: estudosPorPeriodo } = useFilteredStudies(
    estudos,
    selectedPeriod,
    customStartDate,
    customEndDate
  );

  // Formatação dos dados OTIMIZADA
  // 3. Transformando E ORDENANDO os dados
  const studiesFormatted = useMemo(() => {
    // Se ha busca no servidor, aplica filtro de periodo sobre ela tambem
    // Isso permite combinar filtro de modalidade + periodo
    const fonteDeDados = serverSearchResults !== null ? estudosPorPeriodo.filter(e =>
      serverSearchResults.some((s: any) => s.ID === e.ID)
    ) : estudosPorPeriodo;
    
    if (!fonteDeDados) return [];

    // Primeiro fazemos o map para formatar
    const formatted = fonteDeDados.map(estudo => {
      // Data crua para ordenação (ex: 20260124)
      const rawDate = estudo.MainDicomTags?.StudyDate || '';
      const rawTime = estudo.MainDicomTags?.StudyTime || ''; // Hora também ajuda no desempate!

      // Formata Data para exibição (DD/MM/YYYY)
      const displayDate = rawDate.length === 8 
        ? `${rawDate.substring(6, 8)}/${rawDate.substring(4, 6)}/${rawDate.substring(0, 4)}`
        : rawDate;

      const modalidadeBruta = estudo.MainDicomTags?.ModalitiesInStudy || 'OT';
      const mainModality = modalidadeBruta.split('\\')[0] || 'OT';

      // Formata nome do paciente (remove ^ e substitui por espaço)
      const rawPatientName = estudo.PatientMainDicomTags?.PatientName || 'Sem Nome';
      const formattedPatientName = rawPatientName.replace(/\^/g, ' ').trim();

      // Formata Data de Nascimento
      const rawBirthDate = estudo.PatientMainDicomTags?.PatientBirthDate || '';
      const formattedBirthDate = rawBirthDate.length === 8
        ? `${rawBirthDate.substring(6, 8)}/${rawBirthDate.substring(4, 6)}/${rawBirthDate.substring(0, 4)}`
        : 'N/A';

      const cached = detailsCache[estudo.ID];

      return {
        id: estudo.ID,
        studyInstanceUID: estudo.MainDicomTags?.StudyInstanceUID || estudo.ID,
        patient: formattedPatientName,
        birthDate: formattedBirthDate,
        modality: cached ? cached.modality : mainModality,
        description: estudo.MainDicomTags?.StudyDescription || 'Sem Descrição',
        date: displayDate,
        rawDate: rawDate + rawTime, // Guardamos isso escondido para ordenar
        seriesCount: cached ? cached.seriesCount : (estudo.Series ? estudo.Series.length : 0),
        imagesCount: cached ? cached.imagesCount : 0
      };
    });

    // Agora ordenamos do mais novo para o mais velho
    return formatted.sort((a, b) => {
      if (b.rawDate > a.rawDate) return 1;
      if (b.rawDate < a.rawDate) return -1;
      return 0;
    });

  }, [estudosPorPeriodo, serverSearchResults, detailsCache]);

  // O cérebro dos botões de modalidade
  const handleModalityClick = async (mod: string) => {
    // Cancela qualquer busca anterior em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSelectedModality(mod);
    setCurrentPage(1);
    setServerSearchResults(null);

    if (mod === 'all') {
      if (searchTerm.length >= 2) {
        setIsSearchingServer(true);
        const res = await buscarEstudosNoServidor(searchTerm, controller.signal);
        if (controller.signal.aborted) return;
        setServerSearchResults(res);
        setIsSearchingServer(false);
      }
      return;
    }

    setIsSearchingServer(true);
    const resultados = await buscarModalidadeNoServidor(mod, controller.signal);
    if (controller.signal.aborted) return;
    setServerSearchResults(resultados);
    setIsSearchingServer(false);
  };

  const filteredStudies = studiesFormatted.filter(study => {
    // A busca de texto SEMPRE funciona localmente refinando os resultados da tela
    const matchesSearch = searchTerm.length < 2 ? true : (
      study.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // O servidor ja filtrou por modalidade, filtro local so se nao houver busca ativa
    const matchesModality = selectedModality === 'all' || serverSearchResults !== null
      ? true
      : (study.modality || '').trim().toUpperCase() === selectedModality.toUpperCase();
    
    return matchesSearch && matchesModality;
  });

  // 2. Resetar para página 1 se o usuário filtrar ou buscar algo novo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedModality, selectedPeriod, customStartDate, customEndDate]);

  // 3. Cálculos da Paginação
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredStudies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudies.length / ITEMS_PER_PAGE);

  useEffect(() => {
    currentItems.forEach(study => {
      // Se não tem no cache e ninguém mandou buscar ainda...
      if (!detailsCache[study.id] && !fetchingRef.current.has(study.id)) {
        fetchingRef.current.add(study.id); // tranca para não buscar duas vezes

        carregarSeriesDoEstudo(study.id).then((seriesData: any[]) => {
          let totalInstances = 0;
          let realModality = study.modality;

          if (seriesData && seriesData.length > 0) {
            totalInstances = seriesData.reduce((acc: number, s: any) => acc + (s.Instances?.length || 0), 0);
            if (seriesData[0].MainDicomTags?.Modality) {
              realModality = seriesData[0].MainDicomTags.Modality;
            }
          }

          // Guarda no cofre! O React vai atualizar os números da tabela na mesma hora.
          setDetailsCache(prev => ({
            ... prev,
            [study.id]: {
              modality: realModality,
              seriesCount: seriesData ? seriesData.length : 0,
              imagesCount: totalInstances
            }
          }));
        });
      }
    });
  }, [currentItems, carregarSeriesDoEstudo]); 

  // Handlers dos botões
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // 1. Obtém o usuário logado
  // const currentUser = JSON.parse((sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user')) || '{}');

  // 2. FUNÇÃO DE LOG (Auditoria) - Envia para o backend
  const registrarLog = async (actionType: 'VIEW' | 'DOWNLOAD', study: any, details?: string) => {
    try {
      // 1. Mapeamento para nomes amigáveis (ajuste conforme suas unidades)
      const nomesUnidades: Record<string, string> = {
        '1': 'Rio Branco', '2': 'Foz do Iguaçu', '3': 'Fazenda', 
        '4': 'Faxinal', '5': 'Santa Mariana', '6': 'Guarapuava', 
        '7': 'Carlópolis', '8': 'Arapoti', 'riobranco': 'Rio Branco',
        'foziguacu': 'Foz do Iguaçu', 'fazenda': 'Fazenda', 'faxinal': 'Faxinal'
      };

      // 2. Pega a unidadeAtual que já vem do seu hook useOrthancData()
      const nomeUnidadeLog = nomesUnidades[unidadeAtual] || 'Unidade Geral';

      const token = (sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token'));
      
      await fetch('/api/studylogs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType,
          unidadeNome: nomeUnidadeLog,
          studyId: study.id,
          studyInstanceUID: study.studyInstanceUID,
          patientName: study.patient,
          studyDescription: study.description,
          modality: study.modality,
          details: details, // 👈 Detalhes extras (ex: formato do download)
        }),
      });
    } catch (err) {
      console.error('Erro ao registrar log:', err);
    }
  };

  // FUNÇÃO PARA ABRIR O MODAL DE DOWNLOAD
  const handleOpenDownloadModal = async (study: typeof studiesFormatted[0]) => {
    setStudyForDownload({
      id: study.id,
      patient: study.patient,
      description: study.description,
      modality: study.modality,
      studyInstanceUID: study.studyInstanceUID,
      date: study.date,
      birthDate: study.birthDate
    });
    setDownloadFormat('jpeg'); // Reset para JPEG ao abrir modal
    setShowDownloadModal(true);
    setIsLoadingSeries(true);
    
    try {
      const prefixoProxy = `/orthanc-${unidadeAtual}`;
      
      // Buscar séries do estudo
      const seriesData = await carregarSeriesDoEstudo(study.id);
      
      // Para cada série, buscar as instâncias
      const seriesWithInstances: SeriesForDownload[] = await Promise.all(
        seriesData.map(async (serie: any) => {
          // Buscar instâncias da série
          const instancesResponse = await fetch(`${prefixoProxy}/series/${serie.ID}/instances`);
          const instancesData = await instancesResponse.json();
          
          return {
            id: serie.ID,
            description: serie.MainDicomTags?.SeriesDescription || 'Sem descrição',
            modality: serie.MainDicomTags?.Modality || 'OT',
            instancesCount: instancesData.length,
            instances: instancesData.map((inst: any) => ({
              id: inst.ID,
              instanceNumber: inst.MainDicomTags?.InstanceNumber || '?',
              isSelected: true
            })),
            isExpanded: false,
            isSelected: true
          };
        })
      );
      
      setSeriesForDownload(seriesWithInstances);
    } catch (error) {
      console.error('Erro ao carregar séries:', error);
      setSeriesForDownload([]);
    } finally {
      setIsLoadingSeries(false);
    }
  };

  // TOGGLE EXPANSÃO DA SÉRIE
  const toggleSeriesExpanded = (seriesId: string) => {
    setSeriesForDownload(prev => prev.map(s => 
      s.id === seriesId ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  // TOGGLE SELEÇÃO DA SÉRIE (seleciona/deseleciona todas as instâncias)
  const toggleSeriesSelection = (seriesId: string) => {
    setSeriesForDownload(prev => prev.map(s => {
      if (s.id === seriesId) {
        const newSelected = !s.isSelected;
        return {
          ...s,
          isSelected: newSelected,
          instances: s.instances.map(inst => ({ ...inst, isSelected: newSelected }))
        };
      }
      return s;
    }));
  };

  // TOGGLE SELEÇÃO DE UMA INSTÂNCIA
  const toggleInstanceSelection = (seriesId: string, instanceId: string) => {
    setSeriesForDownload(prev => prev.map(s => {
      if (s.id === seriesId) {
        const updatedInstances = s.instances.map(inst => 
          inst.id === instanceId ? { ...inst, isSelected: !inst.isSelected } : inst
        );
        const allSelected = updatedInstances.every(inst => inst.isSelected);
        return { ...s, instances: updatedInstances, isSelected: allSelected };
      }
      return s;
    }));
  };

  // SELECIONAR/DESELECIONAR TUDO
  const toggleSelectAll = () => {
    const allSelected = seriesForDownload.every(s => s.isSelected);
    setSeriesForDownload(prev => prev.map(s => ({
      ...s,
      isSelected: !allSelected,
      instances: s.instances.map(inst => ({ ...inst, isSelected: !allSelected }))
    })));
  };

  // CONTAR SELECIONADOS
  const countSelected = () => {
    let seriesCount = 0;
    let instancesCount = 0;
    seriesForDownload.forEach(s => {
      const selectedInstances = s.instances.filter(i => i.isSelected).length;
      if (selectedInstances > 0) {
        seriesCount++;
        instancesCount += selectedInstances;
      }
    });
    return { seriesCount, instancesCount };
  };

  // EXECUTAR DOWNLOAD
  const executeDownload = async () => {
    if (!studyForDownload) return;
    
    setIsDownloading(true);
    const prefixoProxy = `/orthanc-${unidadeAtual}`;
    const patientName = studyForDownload.patient.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Registra o log com o formato escolhido
    const formatoLabel = downloadFormat === 'pdf' ? 'PDF' : 'JPEG (ZIP)';
    registrarLog('DOWNLOAD', studyForDownload, `Formato: ${formatoLabel}`);
    
    // Coletar todas as imagens selecionadas
    const imagesToDownload: { blob: Blob; modality: string; index: number }[] = [];
    let imgIndex = 1;
    
    const allSelected = seriesForDownload.every(s => s.isSelected && s.instances.every(i => i.isSelected));
    
    if (allSelected) {
      for (const series of seriesForDownload) {
        for (const instance of series.instances) {
          try {
            const response = await fetch(`${prefixoProxy}/instances/${instance.id}/rendered`);
            const blob = await response.blob();
            imagesToDownload.push({ blob, modality: series.modality, index: imgIndex });
            imgIndex++;
          } catch (err) {
            console.error('Erro ao baixar imagem:', err);
          }
        }
      }
    } else {
      for (const series of seriesForDownload) {
        const selectedInstances = series.instances.filter(i => i.isSelected);
        if (selectedInstances.length === 0) continue;
        
        for (const instance of selectedInstances) {
          try {
            const response = await fetch(`${prefixoProxy}/instances/${instance.id}/rendered`);
            const blob = await response.blob();
            imagesToDownload.push({ blob, modality: series.modality, index: imgIndex });
            imgIndex++;
          } catch (err) {
            console.error('Erro ao baixar imagem:', err);
          }
        }
      }
    }
    
    if (downloadFormat === 'jpeg') {
      // Download como ZIP com JPEGs
      const zip = new JSZip();
      const folder = zip.folder(patientName);
      
      if (!folder) {
        console.error('Erro ao criar pasta no ZIP');
        setIsDownloading(false);
        return;
      }
      
      for (const img of imagesToDownload) {
        const filename = `${img.modality}_${String(img.index).padStart(3, '0')}.jpg`;
        folder.file(filename, img.blob);
      }
      
      try {
        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${patientName}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Erro ao gerar ZIP:', err);
      }
    } else {
      // Download como PDF
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        // Cabeçalho na primeira página
        pdf.setFillColor(30, 58, 138); // Azul escuro
        pdf.rect(0, 0, pageWidth, 55, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('BitPacs - Relatório de Imagens', margin, 15);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 23);
        
        // Informações do paciente - layout em grid
        pdf.setFontSize(11);
        pdf.text(`Paciente: ${studyForDownload.patient}`, margin, 33);
        pdf.text(`Data de Nascimento: ${studyForDownload.birthDate}`, margin, 40);
        pdf.text(`Data do Exame: ${studyForDownload.date}`, margin, 47);
        pdf.text(`Modalidade: ${studyForDownload.modality}`, pageWidth / 2, 47);
        
        // Descrição do estudo
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text(`Descrição: ${studyForDownload.description}`, margin, 65);
        
        let yPosition = 75;
        let isFirstImage = true;
        
        for (const img of imagesToDownload) {
          // Converter blob para base64
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(img.blob);
          });
          
          // Calcular dimensões da imagem mantendo proporção
          const imgElement = await new Promise<HTMLImageElement>((resolve) => {
            const imgEl = new Image();
            imgEl.onload = () => resolve(imgEl);
            imgEl.src = base64;
          });
          
          const imgRatio = imgElement.width / imgElement.height;
          let imgWidth = contentWidth;
          let imgHeight = imgWidth / imgRatio;
          
          // Limitar altura máxima da imagem
          const maxImgHeight = pageHeight - 80;
          if (imgHeight > maxImgHeight) {
            imgHeight = maxImgHeight;
            imgWidth = imgHeight * imgRatio;
          }
          
          // Verificar se precisa de nova página
          if (!isFirstImage && (yPosition + imgHeight + 10) > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Centralizar imagem
          const xPosition = (pageWidth - imgWidth) / 2;
          
          // Adicionar número da imagem
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Imagem ${img.index} - ${img.modality}`, margin, yPosition);
          yPosition += 5;
          
          // Adicionar imagem
          pdf.addImage(base64, 'JPEG', xPosition, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
          
          isFirstImage = false;
        }
        
        // Salvar PDF
        pdf.save(`${patientName}.pdf`);
      } catch (err) {
        console.error('Erro ao gerar PDF:', err);
      }
    }
    
    setIsDownloading(false);
    setShowDownloadModal(false);
  };

  // 4. FUNÇÃO PARA ABRIR O MODAL DE SELEÇÃO DE VISUALIZADOR
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

  // 6. FUNÇÃO PARA ABRIR O VISUALIZADOR INTERNO
  const handleOpenInternalViewer = () => {
    if (selectedStudyForViewer) {
      registrarLog('VIEW', selectedStudyForViewer);
      setShowViewerModal(false);
      navigate(`/viewer/${selectedStudyForViewer.studyInstanceUID}`);
    }
  };

  // 7. FUNÇÃO PARA ABRIR O OHIF VIEWER
  const handleOpenOHIFViewer = () => {
    if (selectedStudyForViewer) {
      registrarLog('VIEW', selectedStudyForViewer);
      setShowViewerModal(false);
      // Navega para a página do OHIF Viewer interno (iframe) passando a unidade
      navigate(`/ohif-viewer/${selectedStudyForViewer.studyInstanceUID}?unidade=${unidadeAtual}`);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Estudos DICOM</h1>
            <p className="text-theme-muted mt-1">
              {isLoading 
                ? 'Carregando dados...' 
                : `${filteredStudies.length} estudos encontrados`
            }
          </p>
          </div>
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

        <Card className="!p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por paciente ou ID... (Aperte Enter para buscar no servidor)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleServerSearch()}
                disabled={isSearchingServer}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'CT', 'MR', 'CR', 'US', 'DR', 'DX', 'OT'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => handleModalityClick(mod)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedModality === mod
                      ? 'bg-nautico text-white'
                      : 'bg-theme-card text-theme-muted hover:text-theme-primary border border-theme-border'
                  }`}
                >
                  {mod === 'all' ? 'Todos' : mod}
                </button>
              ))}
            </div>
          </div>
        </Card>

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
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Séries</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Imagens</th>
                  <th className="text-right text-sm font-semibold text-theme-secondary px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-light">
                {isLoading ? (
                   <tr>
                     <td colSpan={8} className="px-6 py-8 text-center text-theme-muted">
                       Carregando estudos do servidor...
                     </td>
                   </tr>
                ) : filteredStudies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-theme-muted">
                        Nenhum estudo encontrado.
                      </td>
                    </tr>
                ) : (
                  // 4. Usamos 'currentItems' em vez de 'filteredStudies' aqui
                  currentItems.map((study) => (
                    <tr 
                      key={study.id} 
                      className="hover:bg-nautico/10 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-theme-primary">{study.patient}</span>
                      </td>
                      {/* ... restante das células da tabela (id, modality, etc) ... */}
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
                      <td className="px-6 py-4">
                        <span className="text-theme-secondary">{study.seriesCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-theme-secondary">{study.imagesCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" title="Visualizar estudo" onClick={() => handleOpenViewerModal(study)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" title="Baixar estudo" onClick={() => handleOpenDownloadModal(study)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 5. Footer com Paginação Funcional */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-secondary">
            <span className="text-sm text-theme-muted">
              {filteredStudies.length > 0 ? (
                <>Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredStudies.length)} de {filteredStudies.length} resultados</>
              ) : (
                'Nenhum resultado'
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePrevPage}
                disabled={currentPage === 1 || filteredStudies.length === 0}
              >
                Anterior
              </Button>
              
              {/* Opcional: Mostrar página atual */}
              <span className="text-xs text-theme-muted font-medium px-2">
                Pág {currentPage} de {totalPages || 1}
              </span>

              <Button 
                variant="ghost" 
                size="sm"                 
                onClick={handleNextPage}
                disabled={currentPage === totalPages || filteredStudies.length === 0}
              >
                Próximo
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Seleção de Visualizador */}
      <ViewerModal
        isOpen={showViewerModal}
        study={selectedStudyForViewer}
        onClose={() => setShowViewerModal(false)}
        onOpenInternal={handleOpenInternalViewer}
        onOpenOHIF={handleOpenOHIFViewer}
      />

      {/* Modal de Download */}
      <DownloadModal
        isOpen={showDownloadModal}
        study={studyForDownload}
        series={seriesForDownload}
        isLoadingSeries={isLoadingSeries}
        isDownloading={isDownloading}
        downloadFormat={downloadFormat}
        onClose={() => setShowDownloadModal(false)}
        onFormatChange={setDownloadFormat}
        onToggleSelectAll={toggleSelectAll}
        onToggleSeriesExpanded={toggleSeriesExpanded}
        onToggleSeriesSelection={toggleSeriesSelection}
        onToggleInstanceSelection={toggleInstanceSelection}
        onDownload={executeDownload}
        countSelected={countSelected}
      />
    </MainLayout>
  );
}