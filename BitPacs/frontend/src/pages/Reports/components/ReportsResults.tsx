import { Button, Card } from '../../../components/common';
import type { ReportResponse, ReportType } from '../types';

interface ReportsResultsProps {
  isLoading: boolean;
  error: string | null;
  hasGenerated: boolean;
  reportType: ReportType;
  results: ReportResponse | null;
  hasResults: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
  getUnidadeLabel: (value: string) => string;
}

const MODALITY_COLOR_MAP: Record<string, string> = {
  CT: '#0ea5e9',
  MR: '#a855f7',
  CR: '#0ea5e9',
  US: '#22c55e',
  DR: '#f97316',
  DX: '#0284c7',
  OT: '#94a3b8',
  'NÃO INFORMADO': '#94a3b8',
};

const FALLBACK_MODALITY_COLORS = ['#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16'];

const getModalityColor = (modality: string, index: number) => {
  const mapped = MODALITY_COLOR_MAP[modality.trim().toUpperCase()];
  if (mapped) return mapped;
  return FALLBACK_MODALITY_COLORS[index % FALLBACK_MODALITY_COLORS.length];
};

const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
};

const createArcPath = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

export function ReportsResults({
  isLoading,
  error,
  hasGenerated,
  reportType,
  results,
  hasResults,
  onExportCsv,
  onExportPdf,
  getUnidadeLabel,
}: ReportsResultsProps) {
  const modalitySummary = results?.summaries?.byModality ?? [];
  const totalByModality = modalitySummary.reduce((acc, item) => acc + item.totalStudies, 0);

  let currentAngle = 0;
  const modalityChartSegments = modalitySummary.map((item, index) => {
    const value = item.totalStudies;
    const sweep = totalByModality > 0 ? (value / totalByModality) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    currentAngle = endAngle;

    return {
      ...item,
      color: getModalityColor(item.modality, index),
      percentage: totalByModality > 0 ? (value / totalByModality) * 100 : 0,
      sweep,
      startAngle,
      endAngle,
    };
  });

  return (
    <Card title="Resultados">
      {isLoading && (
        <div className="flex items-center gap-3 text-theme-muted">
          <div className="w-5 h-5 border-2 border-nautico border-t-transparent rounded-full animate-spin" />
          Gerando relatório...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] p-4 text-base font-medium leading-relaxed !text-[#7f1d1d] opacity-100 dark:border-red-500/40 dark:bg-red-500/10 dark:!text-red-200">
          {error}
        </div>
      )}

      {!isLoading && !hasGenerated && (
        <p className="text-theme-muted">Selecione os filtros e clique em Gerar relatório.</p>
      )}

      {!isLoading && hasGenerated && !error && (
        <div className="space-y-5">
          {reportType === 'activity' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                <p className="text-xs text-theme-muted">Total de ações</p>
                <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalLogs ?? 0}</p>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                <p className="text-xs text-theme-muted">Pacientes únicos</p>
                <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalPatients ?? 0}</p>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                <p className="text-xs text-theme-muted">Ações registradas</p>
                <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalLogs ?? 0}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                <p className="text-xs text-theme-muted">Total de estudos</p>
                <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalStudies ?? 0}</p>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                <p className="text-xs text-theme-muted">Pacientes únicos</p>
                <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalPatients ?? 0}</p>
              </div>
            </div>
          )}

          {!results?.records?.length && (
            <div className="rounded-lg border border-theme-border p-4 text-theme-muted">
              Nenhum dado encontrado para os filtros selecionados.
            </div>
          )}

          {(results?.summaries?.byDoctor?.length || (reportType === 'exams' && (results?.summaries?.byUnit?.length || results?.summaries?.byModality?.length))) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reportType === 'activity' && !!results?.summaries?.byDoctor?.length && (
                <div className="rounded-lg border border-theme-border">
                  <div className="px-4 py-3 bg-theme-secondary text-sm text-theme-muted">Resumo por médico</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-theme-primary">
                      <thead className="bg-theme-card text-theme-muted">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Médico</th>
                          <th className="px-4 py-2 text-left font-medium">Ações</th>
                          <th className="px-4 py-2 text-left font-medium">Views</th>
                          <th className="px-4 py-2 text-left font-medium">Downloads</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.summaries?.byDoctor?.map((item) => (
                          <tr key={item.doctorId} className="border-t border-theme-border">
                            <td className="px-4 py-2">{item.doctorName}</td>
                            <td className="px-4 py-2">{item.totalActions}</td>
                            <td className="px-4 py-2">{item.totalViews}</td>
                            <td className="px-4 py-2">{item.totalDownloads}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportType === 'exams' && !!results?.summaries?.byUnit?.length && (
                <div className="rounded-lg border border-theme-border">
                  <div className="px-4 py-3 bg-theme-secondary text-sm text-theme-muted">Resumo por unidade</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-theme-primary">
                      <thead className="bg-theme-card text-theme-muted">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Unidade</th>
                          <th className="px-4 py-2 text-left font-medium">Estudos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.summaries?.byUnit?.map((item) => (
                          <tr key={item.unidade} className="border-t border-theme-border">
                            <td className="px-4 py-2">{getUnidadeLabel(item.unidade)}</td>
                            <td className="px-4 py-2">{item.totalActions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportType === 'exams' && !!results?.summaries?.byModality?.length && (
                <div className="rounded-lg border border-theme-border">
                  <div className="px-4 py-3 bg-theme-secondary text-sm text-theme-muted">Resumo por modalidade</div>
                  <div className="p-4 space-y-4">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg viewBox="0 0 180 180" className="w-52 h-52" role="img" aria-label="Distribuição de estudos por modalidade">
                        <circle cx="90" cy="90" r="58" fill="none" stroke="#e2e8f0" strokeWidth="22" />
                        {modalityChartSegments.map((segment) => {
                          if (segment.sweep >= 359.9) {
                            return (
                              <circle
                                key={segment.modality}
                                cx="90"
                                cy="90"
                                r="58"
                                fill="none"
                                stroke={segment.color}
                                strokeWidth="22"
                              />
                            );
                          }

                          return (
                            <path
                              key={segment.modality}
                              d={createArcPath(90, 90, 58, segment.startAngle, segment.endAngle)}
                              fill="none"
                              stroke={segment.color}
                              strokeWidth="22"
                            />
                          );
                        })}
                        <circle
                          cx="90"
                          cy="90"
                          r="38"
                          className="fill-slate-200 stroke-slate-300/80 stroke dark:fill-slate-950 dark:stroke-slate-800"
                          strokeWidth="1"
                        />
                        <text
                          x="90"
                          y="82"
                          textAnchor="middle"
                          className="fill-slate-600 text-[10px] dark:fill-white"
                        >
                          Total
                        </text>
                        <text
                          x="90"
                          y="100"
                          textAnchor="middle"
                          className="fill-slate-900 text-[14px] font-semibold dark:fill-white"
                        >
                          {totalByModality}
                        </text>
                      </svg>
                      <p className="text-xs text-theme-muted">Distribuição percentual por modalidade</p>
                    </div>

                    <div className="space-y-2">
                      {modalityChartSegments.map((item) => (
                        <div key={item.modality} className="flex items-center justify-between gap-3 text-sm border border-theme-border rounded-md px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-theme-primary truncate">{item.modality}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-theme-muted">{item.percentage.toFixed(1)}%</span>
                            <span className="font-semibold text-theme-primary">{item.totalStudies}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={onExportCsv} disabled={!hasResults}>
              Exportar CSV
            </Button>
            <Button variant="secondary" onClick={onExportPdf} disabled={!hasResults}>
              Exportar PDF
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
