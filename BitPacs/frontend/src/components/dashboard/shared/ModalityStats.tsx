import { useMemo } from 'react';
import { Card } from '../../common';

// Mapeamento de Cores
const CORES_POR_MODALIDADE: Record<string, string> = {
  DX: 'bg-nautico', // Raio-X
  CT: 'bg-nautico/20 text-nautico border-nautico/30', // Tomografia 
  MR: 'bg-purple-light/20 text-purple-light border-purple-light/30', // Ressonância 
  CR: 'bg-ultra/20 text-ultra border-ultra/30', // Raio-X Digitalizado
  US: 'bg-green-aqua/20 text-green-aqua border-green-aqua/30', // Ultrassom
  DR: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30', // Raio-x Digital
  OT: 'bg-gray-400/20 text-gray-500 border-gray-400/30', // Outros
};

interface ModalityStatsProps {
  estudos: any[]; 
}

export function ModalityStats({ estudos = [] }: ModalityStatsProps) {

  const dadosProcessados = useMemo(() => {
    // Agora o nosso objeto apenas conta quantas vezes cada modalidade aparece!
    const contagem: Record<string, number> = {};

    estudos.forEach(estudo => {
      // Pega a modalidade direto da "etiqueta" do Estudo (Ex: "CT\OT" vira "CT")
      const modalidadeBruta = estudo.MainDicomTags?.ModalitiesInStudy || 'OT';
      const mainModality = modalidadeBruta.split('\\')[0] || 'OT';

      // Incrementa o contador daquela modalidade
      if (!contagem[mainModality]) {
        contagem[mainModality] = 0;
      }
      contagem[mainModality]++;
    });

    // Formata para o HTML desenhar o gráfico
    return Object.entries(contagem)
      .map(([name, count]) => ({
        name,
        count, 
        color: CORES_POR_MODALIDADE[name] || CORES_POR_MODALIDADE['OT']
      }))
      .sort((a, b) => b.count - a.count); // Ordena: quem tem mais aparece em cima

  }, [estudos]);

  return (
    <Card title="Total de Estudos por Modalidade">
      <div className="space-y-3">
        {dadosProcessados.length === 0 ? (
           <p className="text-sm text-gray-500">Nenhum dado encontrado...</p>
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