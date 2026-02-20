import { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '../../common';
import { useOrthancData } from '../../../hooks'; // Puxamos o nosso hook mágico!

// Mapeamento de Cores
const CORES_POR_MODALIDADE: Record<string, string> = {
  DX: 'bg-nautico',
  CT: 'bg-nautico/20 text-nautico border-nautico/30',
  MR: 'bg-purple-light/20 text-purple-light border-purple-light/30',
  CR: 'bg-ultra/20 text-ultra border-ultra/30',
  US: 'bg-green-aqua/20 text-green-aqua border-green-aqua/30',
  DR: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
  OT: 'bg-gray-400/20 text-gray-500 border-gray-400/30',
};

interface ModalityStatsProps {
  estudos: any[];
}

export function ModalityStats({ estudos = [] }: ModalityStatsProps) {
  const { carregarSeriesDoEstudo } = useOrthancData();
  const [modalidadesCache, setModalidadesCache] = useState<Record<string, string>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  // 1. Calcula a data exata de 7 dias atrás (formato Orthanc: YYYYMMDD)
  const dataLimite = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
  }, []);

  // 2. Filtra os estudos para manter APENAS os da última semana
  const estudosDaSemana = useMemo(() => {
    return estudos.filter(e => (e.MainDicomTags?.StudyDate || '') >= dataLimite);
  }, [estudos, dataLimite]);

  // 3. MOTOR LAZY LOAD: Pede as modalidades silenciosamente
  useEffect(() => {
    estudosDaSemana.forEach(estudo => {
      const id = estudo.ID;
      const temNoOrthanc = estudo.MainDicomTags?.ModalitiesInStudy;

      // Se o Orthanc não mandou a modalidade e nós não buscamos ainda, vai atrás!
      if (!temNoOrthanc && !modalidadesCache[id] && !fetchingRef.current.has(id)) {
        fetchingRef.current.add(id);

        carregarSeriesDoEstudo(id).then(series => {
          let mod = 'OT';
          if (series && series.length > 0 && series[0].MainDicomTags?.Modality) {
            mod = series[0].MainDicomTags.Modality;
          }
          // Salva no cofre e o gráfico atualiza na hora!
          setModalidadesCache(prev => ({ ...prev, [id]: mod }));
        });
      }
    });
  }, [estudosDaSemana, carregarSeriesDoEstudo, modalidadesCache]);

  // 4. Conta os exames e formata para desenhar o gráfico
  const dadosProcessados = useMemo(() => {
    const contagem: Record<string, number> = {};

    estudosDaSemana.forEach(estudo => {
      let mod = 'OT';
      // Tenta pegar direto do estudo, senão usa o que chegou do nosso Lazy Load
      if (estudo.MainDicomTags?.ModalitiesInStudy) {
        mod = estudo.MainDicomTags.ModalitiesInStudy.split('\\')[0];
      } else if (modalidadesCache[estudo.ID]) {
        mod = modalidadesCache[estudo.ID];
      }

      contagem[mod] = (contagem[mod] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([name, count]) => ({
        name,
        count,
        color: CORES_POR_MODALIDADE[name] || CORES_POR_MODALIDADE['OT']
      }))
      .sort((a, b) => b.count - a.count); // Ordena do maior pro menor
  }, [estudosDaSemana, modalidadesCache]);

  return (
    <Card title={`Modalidades (Últimos 7 dias)`}>
      <div className="space-y-3">
        {dadosProcessados.length === 0 ? (
           <p className="text-sm text-gray-500">Buscando exames recentes...</p>
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