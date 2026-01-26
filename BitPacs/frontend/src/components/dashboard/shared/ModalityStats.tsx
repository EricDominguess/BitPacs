import { useMemo } from 'react';
import { Card } from '../../common';

// Mapeamento de Cores
const CORES_POR_MODALIDADE: Record<string, string> = {
  DX: 'bg-nautico', // Raio-X
  CT: 'bg-nautico/20 text-nautico border-nautico/30', // Tomografia
  MR: 'bg-purple-light/20 text-purple-light border-purple-light/30', // Ressonância
  CR: 'bg-ultra/20 text-ultra border-ultra/30', // Raio-X Digitalizado
  US: 'bg-green-aqua/20 text-green-aqua border-green-aqua/30', // Ultrassom
  DR: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
  OT: 'bg-gray-400/20 text-gray-500 border-gray-400/30', // Outros
};

interface ModalityStatsProps {
  // Recebe a lista de SÉRIES vinda do Dashboard
  estudos: any[]; 
}

export function ModalityStats({ estudos = [] }: ModalityStatsProps) {

  const dadosProcessados = useMemo(() => {
    // Objeto onde a chave é a Modalidade e o valor é um Conjunto (Set) de IDs únicos
    const mapaDeEstudosUnicos: Record<string, Set<string>> = {};

    estudos.forEach(serie => {
      // 1. Pega a modalidade e o ID do Estudo dessa série
      const mod = serie.MainDicomTags?.Modality || 'Desconhecido';
      const studyUID = serie.ParentStudy || 'sem-id';

      // 2. Garante que o conjunto existe para essa modalidade
      if (!mapaDeEstudosUnicos[mod]) {
        mapaDeEstudosUnicos[mod] = new Set();
      }

      // 3. Adiciona o ID. Se já tiver esse ID lá, o Set ignora sozinho.
      // É aqui que a mágica de transformar 1052 séries em 352 exames acontece.
      mapaDeEstudosUnicos[mod].add(studyUID);
    });

    // 4. Formata para o HTML desenhar
    return Object.entries(mapaDeEstudosUnicos)
      .map(([name, setDeIDs]) => ({
        name,
        count: setDeIDs.size, // .size conta os IDs únicos (Exames)
        color: CORES_POR_MODALIDADE[name] || 'bg-gray-400'
      }))
      .sort((a, b) => b.count - a.count); // Ordena: quem tem mais aparece em cima

  }, [estudos]);

  return (
    <Card title="Total de Estudos por Modalidade">
      <div className="space-y-3">
        {dadosProcessados.length === 0 ? (
           <p className="text-sm text-gray-500">Carregando dados...</p>
        ) : (
          dadosProcessados.map((mod) => (
            <div key={mod.name} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded ${mod.color}`} />
              <span className="flex-1 text-sm text-theme-secondary">{mod.name}</span>
              <span className="text-sm font-medium text-theme-primary">{mod.count}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}