import { useState, useMemo, useEffect, useRef } from 'react'; // <--- Adicione useEffect
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card, Button, Input } from '../../components/common';
import { PeriodFilter, useFilteredStudies } from '../../components/dashboard';
import type { PeriodType } from '../../components/dashboard';
import { useOrthancData } from '../../hooks';

const modalityColors: Record<string, string> = {
  CT: 'bg-nautico/20 text-nautico border-nautico/30',
  MR: 'bg-purple-light/20 text-purple-light border-purple-light/30',
  CR: 'bg-ultra/20 text-ultra border-ultra/30',
  US: 'bg-green-aqua/20 text-green-aqua border-green-aqua/30',
  DR: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
  DX: 'bg-nautico',
  OT: 'bg-gray-400/20 text-gray-500 border-gray-400/30',
};

// Constante de itens por página
const ITEMS_PER_PAGE = 8;

export function Studies() {
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
    // A MÁGICA: Se fizemos uma busca no servidor, desenha ela. Se não, desenha o periodo normal
    const fonteDeDados = serverSearchResults !== null ? serverSearchResults : estudosPorPeriodo;
    
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
    setSelectedModality(mod);
    
    if (mod === 'all') {
      // Se voltou para "Todos" e tem algo escrito na barra, pesquisa o texto de novo!
      if (searchTerm.length >= 2) {
        setIsSearchingServer(true);
        const res = await buscarEstudosNoServidor(searchTerm);
        setServerSearchResults(res);
        setIsSearchingServer(false);
      } else {
        setServerSearchResults(null);
      }
      setCurrentPage(1);
      return;
    }
    
    // Se clicou em uma modalidade específica, vai buscar no Orthanc
    setIsSearchingServer(true);
    const resultados = await buscarModalidadeNoServidor(mod);
    setServerSearchResults(resultados);
    setIsSearchingServer(false);
    setCurrentPage(1);
  };

  const filteredStudies = studiesFormatted.filter(study => {
    // A busca de texto SEMPRE funciona localmente refinando os resultados da tela
    const matchesSearch = searchTerm.length < 2 ? true : (
      study.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Como o servidor já filtrou a modalidade e nos entregou pronto, 
    // nós só usamos o filtro local de modalidade se não houver busca no servidor.
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
  const registrarLog = async (actionType: 'VIEW' | 'DOWNLOAD', study: any) => {
    try {
      // 🗺️ Tradutor de IDs para Nomes Amigáveis
      const nomesUnidades: Record<string, string> = {
        '1': 'Rio Branco', '2': 'Foz do Iguaçu', '3': 'Fazenda', 
        '4': 'Faxinal', '5': 'Santa Mariana', '6': 'Guarapuava', 
        '7': 'Carlópolis', '8': 'Arapoti', 'riobranco': 'Rio Branco',
        'foziguacu': 'Foz do Iguaçu', 'fazenda': 'Fazenda', 'faxinal': 'Faxinal'
      };

      const nomeDaUnidade = nomesUnidades[unidadeAtual] || 'Rio Branco';

      const token = (sessionStorage.getItem('bitpacs_token') || localStorage.getItem('bitpacs_token'));
      
      await fetch('/api/studylogs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType,
          unidadeNome: nomeDaUnidade, // 👈 Agora enviamos o nome certinho!
          studyId: study.id,
          studyInstanceUID: study.studyInstanceUID,
          patientName: study.patient,
          studyDescription: study.description,
          modality: study.modality,
        }),
      });
    } catch (err) {
      console.error('Erro ao registrar log:', err);
    }
  };

  // 3. FUNÇÃO DE DOWNLOAD ATUALIZADA (E Blindada para Multi-Unidades)
  const handleDownload = (study: typeof studiesFormatted[0]) => {
    const filename = `estudo-${study.id}.zip`;
    
    // Registra o download no backend
    registrarLog('DOWNLOAD', study);

    // Descobre em qual unidade estamos agora
    const unidadeMaster = localStorage.getItem('bitpacs-unidade-master');
    const user = JSON.parse(sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user') || '{}');
    // Usa a seleção do master, ou a unidade fixa do usuário comum, ou cai no padrão
    const unidadeAtual = unidadeMaster || user.unidade || 'riobranco';
    
    // Constrói a rota blindada do Nginx (ex: /orthanc-fazenda/studies/...)
    const prefixoProxy = `/orthanc-${unidadeAtual}`;

    // Executa o download (Técnica do Link Fantasma)
    const link = document.createElement('a');
    link.href = `${prefixoProxy}/studies/${study.id}/archive`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. FUNÇÃO DE VISUALIZAÇÃO - Registra log antes de navegar
  const handleView = (study: typeof studiesFormatted[0]) => {
    // Registra a visualização no backend
    registrarLog('VIEW', study);
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
                        <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${modalityColors[study.modality] || modalityColors['OT']}`}>
                          {study.modality}
                        </span>
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
                          <Link to={`/viewer/${study.studyInstanceUID}`} onClick={() => handleView(study)}>
                            <Button variant="ghost" size="sm" title="Visualizar estudo">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" title="Baixar estudo (ZIP)" onClick={() => handleDownload(study)}>
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
    </MainLayout>
  );
}