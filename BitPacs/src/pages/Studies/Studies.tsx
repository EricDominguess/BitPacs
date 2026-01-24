import { useState, useMemo, useEffect } from 'react'; // <--- Adicione useEffect
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card, Button, Input } from '../../components/common';
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
  const { estudos, series: todasSeries, isLoading } = useOrthancData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  
  // 1. Estado para controlar a página atual
  const [currentPage, setCurrentPage] = useState(1);

  // Formatação dos dados (igual ao anterior)
  // 3. Transformando E ORDENANDO os dados
  const studiesFormatted = useMemo(() => {
    if (!estudos) return [];

    // Primeiro fazemos o map para formatar
    const formatted = estudos.map(estudo => {
      // Data crua para ordenação (ex: 20260124)
      const rawDate = estudo.MainDicomTags?.StudyDate || '';
      const rawTime = estudo.MainDicomTags?.StudyTime || ''; // Hora também ajuda no desempate!

      // Formata Data para exibição (DD/MM/YYYY)
      const displayDate = rawDate.length === 8 
        ? `${rawDate.substring(6, 8)}/${rawDate.substring(4, 6)}/${rawDate.substring(0, 4)}`
        : rawDate;

      const modalidadeBruta = estudo.MainDicomTags?.ModalitiesInStudy || 'OT';
      const mainModality = modalidadeBruta.split('\\')[0] || 'OT';

      const seriesDoEstudo = todasSeries.filter((s: any) => s.ParentStudy === estudo.ID);
      const totalInstances = seriesDoEstudo.reduce((acc: number, s: any) => acc + (s.Instances?.length || 0), 0);

      // Formata nome do paciente (remove ^ e substitui por espaço)
      const rawPatientName = estudo.PatientMainDicomTags?.PatientName || 'Sem Nome';
      const formattedPatientName = rawPatientName.replace(/\^/g, ' ').trim();

      // Formata Data de Nascimento
      const rawBirthDate = estudo.PatientMainDicomTags?.PatientBirthDate || '';
      const formattedBirthDate = rawBirthDate.length === 8
        ? `${rawBirthDate.substring(6, 8)}/${rawBirthDate.substring(4, 6)}/${rawBirthDate.substring(0, 4)}`
        : 'N/A';

      // Pega a modalidade correta da primeira série se disponível
      let realModality = mainModality;
      if (seriesDoEstudo.length > 0 && seriesDoEstudo[0].MainDicomTags?.Modality) {
        realModality = seriesDoEstudo[0].MainDicomTags.Modality;
      }

      return {
        id: estudo.ID,
        patient: formattedPatientName,
        birthDate: formattedBirthDate,
        modality: realModality,
        description: estudo.MainDicomTags?.StudyDescription || 'Sem Descrição',
        date: displayDate,
        rawDate: rawDate + rawTime, // Guardamos isso escondido para ordenar
        seriesCount: estudo.Series ? estudo.Series.length : 0,
        imagesCount: totalInstances
      };
    });

    // Agora ordenamos do mais novo para o mais velho
    return formatted.sort((a, b) => {
      if (b.rawDate > a.rawDate) return 1;
      if (b.rawDate < a.rawDate) return -1;
      return 0;
    });

  }, [estudos, todasSeries]);

  const filteredStudies = studiesFormatted.filter(study => {
    const matchesSearch = study.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          study.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModality = selectedModality === 'all' || study.modality === selectedModality;
    return matchesSearch && matchesModality;
  });

  // 2. Resetar para página 1 se o usuário filtrar ou buscar algo novo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedModality]);

  // 3. Cálculos da Paginação
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredStudies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudies.length / ITEMS_PER_PAGE);

  // Handlers dos botões
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Estudos DICOM</h1>
          <p className="text-theme-muted mt-1">
            {isLoading 
              ? 'Carregando dados...' 
              : `${filteredStudies.length} estudos encontrados`
            }
          </p>
        </div>

        <Card className="!p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por paciente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onClick={() => setSelectedModality(mod)}
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
                          <Link to={`/viewer/${study.id}`}>
                            <Button variant="ghost" size="sm" title="Visualizar estudo">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" title="Baixar estudo">
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