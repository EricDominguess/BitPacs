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
  return (
    <Card title="Resultados">
      {isLoading && (
        <div className="flex items-center gap-3 text-theme-muted">
          <div className="w-5 h-5 border-2 border-nautico border-t-transparent rounded-full animate-spin" />
          Gerando relatório...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                <p className="text-xs text-theme-muted">Total de estudos</p>
                <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalStudies ?? 0}</p>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                <p className="text-xs text-theme-muted">Pacientes únicos</p>
                <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalPatients ?? 0}</p>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                <p className="text-xs text-theme-muted">Views</p>
                <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalViews ?? 0}</p>
              </div>
              <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                <p className="text-xs text-theme-muted">Downloads</p>
                <p className="text-xl font-semibold text-theme-primary">{results?.totals.totalDownloads ?? 0}</p>
              </div>
            </div>
          )}

          {!results?.records?.length && (
            <div className="rounded-lg border border-theme-border p-4 text-theme-muted">
              Nenhum dado encontrado para os filtros selecionados.
            </div>
          )}

          {(results?.summaries?.byDoctor?.length || results?.summaries?.byUnit?.length) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {!!results?.summaries?.byDoctor?.length && (
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

              {!!results?.summaries?.byUnit?.length && (
                <div className="rounded-lg border border-theme-border">
                  <div className="px-4 py-3 bg-theme-secondary text-sm text-theme-muted">Resumo por unidade</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-theme-primary">
                      <thead className="bg-theme-card text-theme-muted">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Unidade</th>
                          <th className="px-4 py-2 text-left font-medium">Ações</th>
                          <th className="px-4 py-2 text-left font-medium">Views</th>
                          <th className="px-4 py-2 text-left font-medium">Downloads</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.summaries?.byUnit?.map((item) => (
                          <tr key={item.unidade} className="border-t border-theme-border">
                            <td className="px-4 py-2">{getUnidadeLabel(item.unidade)}</td>
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
