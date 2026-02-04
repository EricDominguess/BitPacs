import { Card } from '../../components/common';
import { useUnidade } from '../../contexts';

interface StorageCardProps {
  stats: any; 
}

export function StorageCard({ stats }: StorageCardProps) {
  const { storageTotalBytes } = useUnidade();
  
  // Usa o valor do contexto (baseado na unidade selecionada)
  const totalCapacity = storageTotalBytes || 1080 * 1024 * 1024 * 1024; // Fallback para 1080GB
  
  // 1. Formatação de Bytes (KB, MB, GB, TB) - converte para TB a partir de 1000 GB
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    // Calcula o índice baseado em log
    let i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // Se estiver em GB (i=3) e for >= 1000 GB, converte para TB
    if (i === 3) {
      const gbValue = bytes / Math.pow(k, 3);
      if (gbValue >= 1000) {
        i = 4; // Força para TB
      }
    }
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const usedBytes = stats?.TotalDiskSize || 0;
  const countStudies = stats?.CountStudies || 0;
  const uncompressedSize = stats?.TotalUncompressedSize || 0;

  // 2. Cálculo da Porcentagem para a Barra
  const percentage = Math.min(Math.round((usedBytes / totalCapacity) * 100), 100);

  // 3. Cálculos dos Cards Pequenos
  const avgSize = countStudies > 0 ? usedBytes / countStudies : 0;

  return (
    <Card title="Armazenamento">
      <div className="space-y-4">
        
        {/* Texto do Header: Usado vs Total */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-theme-muted">Usado em Disco</span>
          <span className="text-theme-primary font-medium">
            {formatBytes(usedBytes)} / {formatBytes(totalCapacity)}
          </span>
        </div>
        
        {/* --- AQUI ESTÁ A BARRA DE PROGRESSO --- */}
        <div className="h-3 bg-theme-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-nautico to-ultra rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* ----------------------------------------------- */}

        <div className="grid grid-cols-2 gap-4 pt-2">
          
          {/* Card Esquerdo: Média por Estudo */}
          <div className="text-center p-3 bg-theme-card border border-theme-border rounded-lg">
            <p className="text-xl font-bold text-theme-primary">
              {formatBytes(avgSize)}
            </p>
            <p className="text-xs text-theme-muted">Média / Estudo</p>
          </div>

          {/* Card Direito: Volume Real (DICOM) */}
          <div className="text-center p-3 bg-theme-card border border-theme-border rounded-lg">
            <p className="text-xl font-bold text-theme-primary">
              {formatBytes(uncompressedSize)}
            </p>
            <p className="text-xs text-theme-muted">Volume Real (DICOM)</p>
          </div>
          
        </div>
      </div>
    </Card>
  );
}