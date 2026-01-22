import { Card } from '../../components/common';

interface Modality {
  name: string;
  count: number;
  color: string;
}

interface ModalityStatsProps {
  modalities?: Modality[];
}

const defaultModalities: Modality[] = [
  { name: 'CT', count: 423, color: 'bg-nautico' },
  { name: 'MR', count: 312, color: 'bg-purple-light' },
  { name: 'CR', count: 289, color: 'bg-ultra' },
  { name: 'US', count: 156, color: 'bg-green-aqua' },
  { name: 'Outros', count: 67, color: 'bg-purple' },
];

export function ModalityStats({ modalities = defaultModalities }: ModalityStatsProps) {
  return (
    <Card title="Por Modalidade">
      <div className="space-y-3">
        {modalities.map((mod) => (
          <div key={mod.name} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded ${mod.color}`} />
            <span className="flex-1 text-sm text-theme-secondary">{mod.name}</span>
            <span className="text-sm font-medium text-theme-primary">{mod.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
