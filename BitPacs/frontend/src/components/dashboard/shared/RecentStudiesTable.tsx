import { useState, useEffect, useRef } from 'react';
import { Card, Badge } from '../../common';
import { useOrthancData } from '../../../hooks'; // <-- Importamos nosso hook mágico!

interface Study {
  ID: string; // <-- Garantimos o ID do Orthanc aqui
  patient?: string;
  modality?: string;
  date?: string;
  status?: string;
  MainDicomTags?: {
    StudyDate?: string;
    StudyTime?: string;
    StudyDescription?: string;
  };
  PatientMainDicomTags?: {
    PatientName?: string;
  };
}

interface RecentStudiesTableProps {
  dados?: Study[];
  className?: string;
}

export function RecentStudiesTable({ dados = [], className = '' }: RecentStudiesTableProps) {
  // 1. Trazemos a função de Lazy Loading
  const { carregarSeriesDoEstudo } = useOrthancData();

  // 2. Cofre de memória para as modalidades
  const [modalidadesCache, setModalidadesCache] = useState<Record<string, string>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  // Processamento dos dados para pegar os 5 estudos mais recentes
  const estudosProcessados = [...dados]
    .sort((a, b) => {
      const dataA = a.MainDicomTags?.StudyDate || '';
      const dataB = b.MainDicomTags?.StudyDate || '';
      const timeA = (a.MainDicomTags?.StudyTime || '').split('.')[0];
      const timeB = (b.MainDicomTags?.StudyTime || '').split('.')[0];
      return (dataB + timeB).localeCompare(dataA + timeA);
    })
    .slice(0, 5);

  // 3. O MOTOR: Busca a modalidade silenciosamente só desses 5 caras!
  useEffect(() => {
    estudosProcessados.forEach(estudo => {
      if (estudo.ID && !modalidadesCache[estudo.ID] && !fetchingRef.current.has(estudo.ID)) {
        fetchingRef.current.add(estudo.ID);

        carregarSeriesDoEstudo(estudo.ID).then((seriesData: any[]) => {
          let realModality = 'OT';
          // Se achar a série, puxa a modalidade verdadeira dela
          if (seriesData && seriesData.length > 0 && seriesData[0].MainDicomTags?.Modality) {
            realModality = seriesData[0].MainDicomTags.Modality;
          }
          // Salva no cofre e atualiza a linha da tabela na mesma hora!
          setModalidadesCache(prev => ({ ...prev, [estudo.ID]: realModality }));
        });
      }
    });
  }, [estudosProcessados, carregarSeriesDoEstudo]);

  const formatarData = (dataString: string | undefined) => {
    if (!dataString || dataString.length !== 8) return dataString || '';
    return `${dataString.slice(6,8)}/${dataString.slice(4,6)}/${dataString.slice(0,4)}`;
  }

  const formatarNome = (nome: string | undefined) => (nome || 'Desconhecido').replace(/\^/g, ' ').trim();
  
  return (
    <Card title="Estudos Recentes" className={className}>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-theme-border">
              <th className="text-left text-sm font-medium text-theme-muted pb-3">Paciente</th>
              <th className="text-left text-sm font-medium text-theme-muted pb-3">Descrição</th>
              <th className="text-left text-sm font-medium text-theme-muted pb-3">Modalidade</th>
              <th className="text-left text-sm font-medium text-theme-muted pb-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-light">
            {estudosProcessados.length === 0 ? (
               <tr><td colSpan={4} className="py-4 text-center text-gray-400">Nenhum exame recente.</td></tr>
            ) : (
              estudosProcessados.map((estudo, i) => (
                <tr key={estudo.ID || i} className="hover:bg-nautico/10 transition-colors">
                  <td className="py-3">
                    <span className="text-theme-primary font-medium">
                      {formatarNome(estudo.PatientMainDicomTags?.PatientName)}
                    </span>
                  </td>
                  <td className="py-3 text-theme-secondary">
                    {estudo.MainDicomTags?.StudyDescription || '-'}
                  </td>
                  <td className="py-3">
                    {/* Exibe a modalidade se já baixou, senão mostra '...' */}
                    <Badge>{modalidadesCache[estudo.ID] || '...'}</Badge>
                  </td>
                  <td className="py-3 text-theme-secondary">
                    {formatarData(estudo.MainDicomTags?.StudyDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}