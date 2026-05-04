import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '../../components/layout';
import { Button, Card, Input } from '../../components/common';
import { useUnidade } from '../../contexts';
import type { UnidadeKey } from '../../contexts/UnidadeContext';

interface StoredUser {
  role?: 'Master' | 'Admin' | 'Medico' | 'Enfermeiro';
  unidadeId?: string;
}

const MODALIDADES = [
  { value: '', label: 'Todas' },
  { value: 'CT', label: 'Tomografia (CT)' },
  { value: 'MR', label: 'Ressonância (MR)' },
  { value: 'US', label: 'Ultrassom (US)' },
  { value: 'CR', label: 'Raio-X (CR)' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in-progress', label: 'Em andamento' },
  { value: 'done', label: 'Finalizado' },
];

export function Reports() {
  const { unidadesDisponiveis, unidade, unidadeLabel } = useUnidade();

  const user = useMemo<StoredUser>(() => {
    const userStr = sessionStorage.getItem('bitpacs_user') || localStorage.getItem('bitpacs_user');
    return userStr ? JSON.parse(userStr) : {};
  }, []);

  const isMaster = user.role === 'Master';
  const isAdmin = user.role === 'Admin';

  const unidadesOptions = useMemo(
    () => Object.values(unidadesDisponiveis).filter((item) => item.value !== 'localhost'),
    [unidadesDisponiveis]
  );

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<UnidadeKey[]>([]);
  const [modality, setModality] = useState('');
  const [medico, setMedico] = useState('');
  const [status, setStatus] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isMaster) return;
    if (selectedUnits.length > 0) return;
    const fallback = unidadesOptions[0]?.value;
    if (fallback) {
      setSelectedUnits([fallback as UnidadeKey]);
    }
  }, [isMaster, selectedUnits.length, unidadesOptions]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedUnits(isMaster ? [] : [unidade]);
    setModality('');
    setMedico('');
    setStatus('');
    setHasGenerated(false);
  };

  const handleGenerateReport = () => {
    if (!isMaster && !isAdmin) return;
    if (isMaster && selectedUnits.length === 0) return;

    setIsLoading(true);
    setHasGenerated(false);

    window.setTimeout(() => {
      setIsLoading(false);
      setHasGenerated(true);
    }, 600);
  };

  const canGenerate = (isMaster || isAdmin) && (!isMaster || selectedUnits.length > 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-theme-primary">Relatórios</h1>
          <p className="text-theme-muted">Selecione os filtros e clique em Gerar relatório.</p>
        </div>

        {!isMaster && !isAdmin && (
          <Card className="text-center">
            <p className="text-theme-muted">Você não tem permissão para gerar relatórios.</p>
          </Card>
        )}

        {(isMaster || isAdmin) && (
          <Card title="Filtros">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <Input
                type="date"
                label="Data inicial"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <Input
                type="date"
                label="Data final"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />

              {isMaster ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-theme-secondary">Unidades</label>
                  <select
                    multiple
                    value={selectedUnits}
                    onChange={(event) => {
                      const values = Array.from(event.target.selectedOptions).map((option) => option.value as UnidadeKey);
                      setSelectedUnits(values);
                    }}
                    className="min-h-[118px] w-full px-3 py-2 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
                  >
                    {unidadesOptions.map((item) => (
                      <option key={item.value} value={item.value} className="text-theme-primary">
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-theme-muted">Use Ctrl/⌘ para selecionar mais de uma unidade.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-theme-secondary">Unidade</label>
                  <div className="px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary">
                    {unidadeLabel}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-theme-secondary">Modalidade</label>
                <select
                  value={modality}
                  onChange={(event) => setModality(event.target.value)}
                  className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
                >
                  {MODALIDADES.map((item) => (
                    <option key={item.value} value={item.value} className="text-theme-primary">
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Médico"
                placeholder="Digite o nome do médico"
                value={medico}
                onChange={(event) => setMedico(event.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-theme-secondary">Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value} className="text-theme-primary">
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar filtros
              </Button>
              <Button onClick={handleGenerateReport} disabled={!canGenerate || isLoading}>
                {isLoading ? 'Gerando...' : 'Gerar relatório'}
              </Button>
            </div>
          </Card>
        )}

        {(isMaster || isAdmin) && (
          <Card title="Resultados">
            {isLoading && (
              <div className="flex items-center gap-3 text-theme-muted">
                <div className="w-5 h-5 border-2 border-nautico border-t-transparent rounded-full animate-spin" />
                Gerando relatório...
              </div>
            )}

            {!isLoading && !hasGenerated && (
              <p className="text-theme-muted">Selecione os filtros e clique em Gerar relatório.</p>
            )}

            {!isLoading && hasGenerated && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                    <p className="text-xs text-theme-muted">Total de exames</p>
                    <p className="text-xl font-semibold text-theme-primary">—</p>
                  </div>
                  <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                    <p className="text-xs text-theme-muted">Pacientes únicos</p>
                    <p className="text-xl font-semibold text-theme-primary">—</p>
                  </div>
                  <div className="rounded-lg border border-theme-border bg-theme-primary p-4">
                    <p className="text-xs text-theme-muted">Tempo médio</p>
                    <p className="text-xl font-semibold text-theme-primary">—</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-theme-border">
                  <div className="px-4 py-3 bg-theme-secondary text-sm text-theme-muted">Tabela detalhada</div>
                  <div className="p-4 text-theme-muted">
                    Nenhum dado carregado. Integre com a API para exibir resultados reais.
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" disabled>
                    Exportar CSV
                  </Button>
                  <Button variant="secondary" disabled>
                    Exportar PDF
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
