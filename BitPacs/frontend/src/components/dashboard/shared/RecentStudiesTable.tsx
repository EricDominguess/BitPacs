import { Card, Badge } from '../../common';

interface Study {
  patient: string;
  modality: string;
  date: string;
  status: string;
}

interface RecentStudiesTableProps {
  dados?: Study[];
  series?: any[];
  className?: string;
}

export function RecentStudiesTable({ dados = [], series = [], className = '' }: RecentStudiesTableProps) {
  
  console.log("A tabela de estudos recentes foi renderizada com dados:", dados);

  // Processamento dos dados para pegar os 5 estudos mais recentes
  const estudosProcessados = [...dados]
    .sort((a, b) => {
      // Compara as datas (YYYYMMDD) para ordenar decescente
      const dataA = a.MainDicomTags?.StudyDate || '';
      const dataB = b.MainDicomTags?.StudyDate || '';

      const timeA = (a.MainDicomTags?.StudyTime || '').split('.')[0]; // Remove fração de segundos
      const timeB = (b.MainDicomTags?.StudyTime || '').split('.')[0];

      const fullDateTimeA = dataA + timeA;
      const fullDateTimeB = dataB + timeB;
      
      return fullDateTimeB.localeCompare(fullDateTimeA);
    })
    .slice(0, 5); // Pega os 5 mais recentes
  
  // Função para modalidade
  const obterModalidade = (estudo: any) => {
    if (estudo.Series && estudo.Series.length > 0) {
      // pega o ID da primeira série desse estudo
      const idDaPrimeiraSerie = estudo.Series[0];
      
      // procura a série correspondente na lista de séries
      const serieEncontrada = series.find( s => s.ID === idDaPrimeiraSerie );

      // se achou, retorna a modalidade
      if (serieEncontrada) {
        return serieEncontrada.MainDicomTags?.Modality || '?';
      }
    }
    return '?';
  }

  // Formatação de datas
  const formatarData = (dataString: string) => {
    if (!dataString || dataString.length !== 8) return dataString;
    return `${dataString.slice(6,8)}/${dataString.slice(4,6)}/${dataString.slice(0,4)}`;
  }

  // Formatação do nome
  const formatarNome = (nome: string) => (nome || 'Desconhecido').replace(/\^/g, ' ').trim();
  
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
              // Agora usamos 'estudosProcessados' em vez de 'studies'
              estudosProcessados.map((estudo, i) => (
                <tr key={i} className="hover:bg-nautico/10 transition-colors">
                  <td className="py-3">
                    <span className="text-theme-primary font-medium">
                      {formatarNome(estudo.PatientMainDicomTags?.PatientName)}
                    </span>
                  </td>
                  <td className="py-3 text-theme-secondary">
                    {estudo.MainDicomTags?.StudyDescription || '-'}
                  </td>
                  <td className="py-3">
                    <Badge>{obterModalidade(estudo)}</Badge>
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