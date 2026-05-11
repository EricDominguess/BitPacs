import { Button, Card, Input } from '../../../components/common';
import type { UnidadeKey } from '../../../contexts/UnidadeContext';
import type { DoctorOption, ReportType } from '../types';

interface ReportsFiltersProps {
  isMaster: boolean;
  isAdmin: boolean;
  reportType: ReportType;
  setReportType: (value: ReportType) => void;
  startDate: string;
  endDate: string;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  quickRange: '30' | '14' | '7' | '';
  setQuickRange: (value: '30' | '14' | '7' | '') => void;
  applyQuickRange: (days: 30 | 14 | 7) => void;
  unidadesOptions: Array<{ value: string; label: string }>;
  selectedUnits: UnidadeKey[];
  setSelectedUnits: (value: UnidadeKey[]) => void;
  activityUnit: UnidadeKey | '';
  setActivityUnit: (value: UnidadeKey | '') => void;
  unidadeLabel: string;
  doctors: DoctorOption[];
  selectedDoctorId: string;
  setSelectedDoctorId: (value: string) => void;
  isLoadingDoctors: boolean;
  onClearFilters: () => void;
  onGenerateReport: () => void;
  isFormValid: boolean;
  isLoading: boolean;
  hasValidDates: boolean;
}

export function ReportsFilters({
  isMaster,
  isAdmin,
  reportType,
  setReportType,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  quickRange,
  setQuickRange,
  applyQuickRange,
  unidadesOptions,
  selectedUnits,
  setSelectedUnits,
  activityUnit,
  setActivityUnit,
  unidadeLabel,
  doctors,
  selectedDoctorId,
  setSelectedDoctorId,
  isLoadingDoctors,
  onClearFilters,
  onGenerateReport,
  isFormValid,
  isLoading,
  hasValidDates,
}: ReportsFiltersProps) {
  if (!isMaster && !isAdmin) return null;

  const unitsScopeClass =
    reportType === 'exams' && isMaster ? 'md:col-span-2 xl:col-span-2' : '';

  return (
    <Card title="Filtros">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-theme-muted mb-3">Período e tipo</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-theme-secondary">Tipo de relatório</label>
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportType)}
                className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
              >
                <option value="activity">Atividade dos usuários</option>
                <option value="exams">Exames realizados</option>
              </select>
            </div>

            <Input
              type="date"
              label="Data inicial"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setQuickRange('');
              }}
            />
            <Input
              type="date"
              label="Data final"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setQuickRange('');
              }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <p className="text-xs text-theme-muted lg:max-w-md">
              Para períodos personalizados, preencha as datas acima.
            </p>
            <div className="flex flex-col gap-2 shrink-0">
              <span className="text-sm font-medium text-theme-secondary">Período rápido</span>
              <div className="flex flex-wrap gap-3">
                {[30, 14, 7].map((days) => (
                  <label key={days} className="flex items-center gap-2 text-sm text-theme-primary">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-theme-border text-nautico focus:ring-nautico"
                      checked={quickRange === String(days)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setQuickRange(String(days) as '30' | '14' | '7');
                          applyQuickRange(days as 30 | 14 | 7);
                        } else {
                          setQuickRange('');
                        }
                      }}
                    />
                    <span>Últimos {days} dias</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-theme-muted mb-3">Unidade e usuário</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reportType === 'activity' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-theme-secondary">Unidade</label>
                {isMaster ? (
                  <select
                    value={activityUnit}
                    onChange={(event) => {
                      setActivityUnit(event.target.value as UnidadeKey);
                      setSelectedDoctorId('');
                    }}
                    className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
                  >
                    <option value="" className="text-theme-muted">Selecione</option>
                    {unidadesOptions.map((item) => (
                      <option key={item.value} value={item.value} className="text-theme-primary">
                        {item.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary">
                    {unidadeLabel}
                  </div>
                )}
              </div>
            ) : isMaster ? (
              <div className={`flex flex-col gap-1.5 ${unitsScopeClass}`}>
                <label className="text-sm font-medium text-theme-secondary">Unidades</label>
                <div className="border border-theme-border rounded-lg bg-theme-primary p-3 max-h-44 overflow-y-auto space-y-2">
                  {unidadesOptions.map((item) => {
                    const isChecked = selectedUnits.includes(item.value as UnidadeKey);
                    return (
                      <label key={item.value} className="flex items-center gap-2 text-sm text-theme-primary">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-theme-border text-nautico focus:ring-nautico"
                          checked={isChecked}
                          onChange={(event) => {
                            const value = item.value as UnidadeKey;
                            if (event.target.checked) {
                              setSelectedUnits([...selectedUnits, value]);
                            } else {
                              setSelectedUnits(selectedUnits.filter((unit) => unit !== value));
                            }
                          }}
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-theme-secondary">Unidade</label>
                <div className="px-4 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary">
                  {unidadeLabel}
                </div>
              </div>
            )}

            {reportType === 'activity' && (
              <div className="flex flex-col gap-1.5 md:col-span-1 xl:col-span-2">
                <label className="text-sm font-medium text-theme-secondary">Usuário</label>
                <select
                  value={selectedDoctorId}
                  onChange={(event) => setSelectedDoctorId(event.target.value)}
                  className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent md:max-w-md xl:max-w-lg"
                >
                  <option value="">Todos</option>
                  {isLoadingDoctors && (
                    <option value="" disabled>Carregando usuários...</option>
                  )}
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={String(doctor.id)}>
                      {doctor.nome}
                    </option>
                  ))}
                  {!isLoadingDoctors && doctors.length === 0 && (
                    <option value="" disabled>Nenhum usuário encontrado</option>
                  )}
                </select>
                {!isLoadingDoctors && doctors.length === 0 && (
                  <span className="text-xs text-theme-muted">Cadastre usuários elegíveis para aparecer aqui.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" onClick={onClearFilters}>
          Limpar filtros
        </Button>
        <Button onClick={onGenerateReport} disabled={!isFormValid || isLoading}>
          {isLoading ? 'Gerando...' : 'Gerar relatório'}
        </Button>
      </div>

      {!hasValidDates && (
        <p className="mt-2 text-xs text-red-200">
          Preencha uma data inicial e final válidas (data inicial menor ou igual à final).
        </p>
      )}
    </Card>
  );
}
