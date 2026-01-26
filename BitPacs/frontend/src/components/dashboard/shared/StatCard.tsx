import { Card} from '../../common';

interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({label, value}: StatCardProps) {
  return (
    <Card className="hover:border-nautico/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-theme-muted">{label}</p>
          <p className="text-3xl font-bold text-theme-primary mt-1">{value}</p>
        </div>
      </div>
    </Card>
  );
}
