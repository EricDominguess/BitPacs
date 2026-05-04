import { Button, Card, Input } from '../../../components/common';
import type { UnidadeKey } from '../../../contexts/UnidadeContext';
import type { DoctorOption, ReportType } from '../types';
import { MODALIDADES, STATUS_OPTIONS } from '../options';

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
  modality: string;
  setModality: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
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
  modality,
  setModality,
  status,
  setStatus,
  onClearFilters,
  onGenerateReport,
  isFormValid,
  isLoading,
  hasValidDates,
}: ReportsFiltersProps) {
  if (!isMaster && !isAdmin) return null;

  return (
    <Card title="Filtros">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-theme-secondary">Tipo de relatório</label>
          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value as ReportType)}
            className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
          >
            <option value="activity">Atividade dos médicos</option>
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

        <div className="md:col-span-2 xl:col-span-2 text-xs text-theme-muted">
          Para períodos personalizados, preencha as datas acima.
        </div>

        <div className="flex flex-col gap-2">
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
          <div className="flex flex-col gap-1.5">
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
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-theme-secondary">Médico</label>
            <select
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              className="w-full px-3 py-2.5 bg-theme-primary border border-theme-border rounded-lg text-theme-primary focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent"
            >
              <option value="">Todos</option>
              {isLoadingDoctors && (
                <option value="" disabled>Carregando médicos...</option>
              )}
              {doctors.map((doctor) => (
                <option key={doctor.id} value={String(doctor.id)}>
                  {doctor.nome}
                </option>
              ))}
              {!isLoadingDoctors && doctors.length === 0 && (
                <option value="" disabled>Nenhum médico encontrado</option>
              )}
            </select>
            {!isLoadingDoctors && doctors.length === 0 && (
              <span className="text-xs text-theme-muted">Cadastre usuários com função Médico para aparecer aqui.</span>
            )}
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
