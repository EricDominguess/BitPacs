import { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '../../common';

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

const CORES_GRAFICO_MODALIDADE: Record<string, string> = {
  DX: '#0284c7',
  CT: '#0ea5e9',
  MR: '#a855f7',
  CR: '#0ea5e9',
  US: '#22c55e',
  DR: '#f97316',
  OT: '#94a3b8',
};

interface ModalityStatsProps {
  estudos: any[];
  carregarSeriesDoEstudo?: (studyId: string) => Promise<any[]>;
}

export function ModalityStats({ estudos = [], carregarSeriesDoEstudo }: ModalityStatsProps) {
  const [modalidadesCache, setModalidadesCache] = useState<Record<string, string>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  // 1. Calcula a data de hoje (formato Orthanc: YYYYMMDD)
  const dataHoje = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
  }, []);

  // 2. Filtra os estudos para manter APENAS os de hoje
  const estudosDoDia = useMemo(() => {
    return estudos.filter(e => (e.MainDicomTags?.StudyDate || '') === dataHoje);
  }, [estudos, dataHoje]);

  // 3. MOTOR LAZY LOAD: Pede as modalidades silenciosamente
  useEffect(() => {
    estudosDoDia.forEach(estudo => {
      const id = estudo.ID;
      const temNoOrthanc = estudo.MainDicomTags?.ModalitiesInStudy;

      // Se o Orthanc não mandou a modalidade e nós não buscamos ainda, vai atrás!
      if (!carregarSeriesDoEstudo) return;

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
  }, [estudosDoDia, carregarSeriesDoEstudo, modalidadesCache]);

  // 4. Conta os exames e formata para desenhar o gráfico
  const dadosProcessados = useMemo(() => {
    const contagem: Record<string, number> = {};

    estudosDoDia.forEach(estudo => {
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
  }, [estudosDoDia, modalidadesCache]);

  const maxCount = useMemo(() => {
    return dadosProcessados.reduce((acc, item) => Math.max(acc, item.count), 0);
  }, [dadosProcessados]);

  return (
    <Card title={`Modalidades (Hoje)`}>
      <div className="space-y-4">
        {dadosProcessados.length === 0 ? (
          <p className="text-sm text-gray-500">Buscando exames de hoje...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
            {dadosProcessados.map((mod) => {
              const altura = maxCount > 0 ? Math.round((mod.count / maxCount) * 100) : 0;
              return (
                <div key={mod.name} className="flex flex-col items-center gap-2">
                  <div className="w-full h-32 flex items-end justify-center">
                    <div
                      className="w-10 rounded-md"
                      style={{ height: `${altura}%`, backgroundColor: CORES_GRAFICO_MODALIDADE[mod.name] || CORES_GRAFICO_MODALIDADE.OT }}
                      aria-label={`${mod.name}: ${mod.count} estudos`}
                      role="img"
                    />
                  </div>
                  <span className="text-xs text-theme-muted truncate max-w-[80px]">{mod.name}</span>
                  <span className="text-sm font-medium text-theme-primary">{mod.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}