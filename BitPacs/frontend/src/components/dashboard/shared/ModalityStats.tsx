import { Card, Button } from '../../../components/common'; // Ajuste o caminho se necessário

export function ModalityStats() {
  return (
    <Card title="Relatórios Avançados">
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
        
        {/* Ícone de Relatório/Gráfico */}
        <div className="w-16 h-16 bg-nautico/10 rounded-full flex items-center justify-center text-nautico">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <div className="px-2">
          <p className="text-sm font-semibold text-theme-primary">
            Análise de Modalidades
          </p>
          <p className="text-xs text-theme-muted mt-2 leading-relaxed">
            O detalhamento completo de exames por modalidade e período agora faz parte do nosso novo módulo de relatórios, garantindo máxima performance no seu Dashboard.
          </p>
        </div>

        {/* Botão de ação (pode ficar desabilitado por enquanto ou levar para uma rota vazia) */}
        <div className="w-full pt-2">
          <Button 
            variant="outline" 
            className="w-full border-theme-border text-theme-secondary hover:bg-nautico hover:text-white hover:border-nautico transition-colors"
            disabled
          >
            Módulo em Breve
          </Button>
        </div>

      </div>
    </Card>
  );
}