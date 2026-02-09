import { useState, useRef, useEffect } from 'react';
import { cn } from '../../../utils/cn';

// Ícones SVG inline
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export type PeriodType = '7d' | '30d' | '90d' | 'custom' | 'all';

interface PeriodOption {
  value: PeriodType;
  label: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'all', label: 'Todo o período' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Período personalizado' },
];

interface PeriodFilterProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
  className?: string;
}

export function PeriodFilter({
  selectedPeriod,
  onPeriodChange,
  customStartDate = '',
  customEndDate = '',
  onCustomDateChange,
  className
}: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomDates, setShowCustomDates] = useState(selectedPeriod === 'custom');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePeriodSelect = (period: PeriodType) => {
    onPeriodChange(period);
    setShowCustomDates(period === 'custom');
    if (period !== 'custom') {
      setIsOpen(false);
    }
  };

  const selectedOption = PERIOD_OPTIONS.find(opt => opt.value === selectedPeriod);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Botão principal do dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
          'bg-theme-secondary border-theme-border hover:border-nautico/50',
          'text-theme-primary text-sm font-medium',
          isOpen && 'ring-2 ring-nautico border-transparent'
        )}
      >
        <CalendarIcon className="w-4 h-4 text-nautico" />
        <span>{selectedOption?.label}</span>
        <ChevronDownIcon className={cn(
          'w-4 h-4 text-theme-muted transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 mt-2 w-72 z-50',
          'bg-theme-secondary border border-theme-border rounded-lg shadow-lg',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}>
          {/* Opções de período */}
          <div className="p-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodSelect(option.value)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm',
                  'transition-colors duration-150',
                  selectedPeriod === option.value
                    ? 'bg-nautico/10 text-nautico'
                    : 'text-theme-primary hover:bg-theme-tertiary'
                )}
              >
                <span>{option.label}</span>
                {selectedPeriod === option.value && (
                  <CheckIcon className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>

          {/* Campos de data customizada */}
          {showCustomDates && (
            <div className="border-t border-theme-border p-3 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-theme-muted">Data inicial</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onCustomDateChange?.(e.target.value, customEndDate)}
                  className={cn(
                    'w-full px-3 py-2 rounded-md text-sm',
                    'bg-theme-primary border border-theme-border',
                    'text-theme-primary',
                    'focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent'
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-theme-muted">Data final</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onCustomDateChange?.(customStartDate, e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-md text-sm',
                    'bg-theme-primary border border-theme-border',
                    'text-theme-primary',
                    'focus:outline-none focus:ring-2 focus:ring-nautico focus:border-transparent'
                  )}
                />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={cn(
                  'w-full px-3 py-2 rounded-md text-sm font-medium',
                  'bg-nautico text-white hover:bg-nautico/90',
                  'transition-colors duration-150'
                )}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook para filtrar estudos por período
 */
export function useFilteredStudies(
  estudos: any[],
  period: PeriodType,
  customStartDate?: string,
  customEndDate?: string
) {
  // Converte data DICOM (YYYYMMDD) para Date
  const parseDicomDate = (dicomDate: string): Date | null => {
    if (!dicomDate || dicomDate.length !== 8) return null;
    const year = parseInt(dicomDate.substring(0, 4));
    const month = parseInt(dicomDate.substring(4, 6)) - 1;
    const day = parseInt(dicomDate.substring(6, 8));
    return new Date(year, month, day);
  };

  // Converte data ISO (YYYY-MM-DD) para Date
  const parseIsoDate = (isoDate: string): Date | null => {
    if (!isoDate) return null;
    return new Date(isoDate + 'T00:00:00');
  };

  // Calcula a data de início baseada no período
  const getStartDate = (): Date | null => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (period) {
      case '7d':
        return new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'custom':
        return parseIsoDate(customStartDate || '');
      case 'all':
      default:
        return null;
    }
  };

  const getEndDate = (): Date | null => {
    if (period === 'custom' && customEndDate) {
      const endDate = parseIsoDate(customEndDate);
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }
      return endDate;
    }
    return null;
  };

  const startDate = getStartDate();
  const endDate = getEndDate();

  // Filtra os estudos
  const estudosFiltrados = estudos.filter((estudo) => {
    const studyDateStr = estudo.MainDicomTags?.StudyDate;
    const studyDate = parseDicomDate(studyDateStr);

    if (!studyDate) return period === 'all';

    // Verifica data de início
    if (startDate && studyDate < startDate) return false;

    // Verifica data de fim (apenas para período customizado)
    if (endDate && studyDate > endDate) return false;

    return true;
  });

  return {
    estudosFiltrados,
    totalFiltrado: estudosFiltrados.length,
    startDate,
    endDate
  };
}
