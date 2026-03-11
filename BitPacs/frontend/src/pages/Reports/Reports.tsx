import { MainLayout } from '../../components/layout';
import { Card } from '../../components/common';

export function Reports() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Relatórios</h1>
          <p className="text-theme-muted mt-1">
            Geração e visualização de relatórios do sistema
          </p>
        </div>

        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Ícone de construção */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-nautico/20 to-purple-light/20 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-theme-primary mb-3">
              Página em Construção
            </h2>

            {/* Descrição */}
            <p className="text-theme-muted max-w-md mb-8">
              Estamos trabalhando para trazer funcionalidades incríveis de relatórios para você. 
              Em breve você poderá gerar relatórios detalhados do sistema.
            </p>

            {/* Lista de funcionalidades planejadas */}
            <div className="bg-theme-secondary/50 rounded-xl p-6 w-full max-w-lg">
              <h3 className="text-sm font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Funcionalidades Planejadas
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-center gap-3 text-theme-muted">
                  <div className="w-2 h-2 rounded-full bg-nautico/50" />
                  <span>Relatório de exames por período</span>
                </li>
                <li className="flex items-center gap-3 text-theme-muted">
                  <div className="w-2 h-2 rounded-full bg-nautico/50" />
                  <span>Relatório de exames por modalidade</span>
                </li>
                <li className="flex items-center gap-3 text-theme-muted">
                  <div className="w-2 h-2 rounded-full bg-nautico/50" />
                  <span>Relatório de atividades de usuários</span>
                </li>
                <li className="flex items-center gap-3 text-theme-muted">
                  <div className="w-2 h-2 rounded-full bg-nautico/50" />
                  <span>Relatório de uso de armazenamento</span>
                </li>
                <li className="flex items-center gap-3 text-theme-muted">
                  <div className="w-2 h-2 rounded-full bg-nautico/50" />
                  <span>Exportação do relatório em PDF e Excel</span>
                </li>
              </ul>
            </div>

            {/* Badge de status */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Em desenvolvimento
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
