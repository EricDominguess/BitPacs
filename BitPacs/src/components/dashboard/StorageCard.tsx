import { Card } from '../../components/common';

interface StorageCardProps {
  used: string;
  total: string;
  percentage: number;
  totalStudies: number;
  totalImages: number;
}

export function StorageCard({ 
  used = '2.4 TB', 
  total = '4 TB', 
  percentage = 60,
  totalStudies = 1247,
  totalImages = 45892 
}: Partial<StorageCardProps>) {
  return (
    <Card title="Armazenamento">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-theme-muted">Usado</span>
          <span className="text-theme-primary font-medium">{used} / {total}</span>
        </div>
        <div className="h-3 bg-theme-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-nautico to-ultra rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 bg-theme-card border border-theme-border rounded-lg">
            <p className="text-xl font-bold text-theme-primary">{totalStudies.toLocaleString()}</p>
            <p className="text-xs text-theme-muted">Total Estudos</p>
          </div>
          <div className="text-center p-3 bg-theme-card border border-theme-border rounded-lg">
            <p className="text-xl font-bold text-theme-primary">{totalImages.toLocaleString()}</p>
            <p className="text-xs text-theme-muted">Total Imagens</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
