import { MainLayout } from '../../components/layout';
import { Card, Button, Input } from '../../components/common';
import { useTheme } from '../../contexts';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Configurações</h1>
          <p className="text-theme-muted mt-1">Gerencie as preferências do sistema</p>
        </div>

        {/* PACS Configuration */}
        <Card title="Configuração PACS">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="AE Title" defaultValue="BITPACS" />
              <Input label="Porta DICOM" type="number" defaultValue="11112" />
              <Input label="Host" defaultValue="localhost" />
              <Input label="Timeout (segundos)" type="number" defaultValue="30" />
            </div>

            <div className="p-4 bg-ultra/10 border border-ultra/30 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-ultra flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-ultra">Status da Conexão</p>
                  <p className="text-xs text-theme-muted mt-1">Servidor PACS conectado e funcionando corretamente</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline">Testar Conexão</Button>
              <Button>Salvar Configuração</Button>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card title="Aparência">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-theme-card rounded-lg border border-theme-border">
              <div>
                <p className="font-medium text-theme-primary">Tema Escuro</p>
                <p className="text-sm text-theme-muted">Usar tema escuro na interface</p>
              </div>
              <button 
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-nautico' : 'bg-purple/30'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-theme-card rounded-lg border border-theme-border">
              <div>
                <p className="font-medium text-theme-primary">Animações</p>
                <p className="text-sm text-theme-muted">Habilitar animações de transição</p>
              </div>
              <button className="w-12 h-6 bg-nautico rounded-full p-1 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full transform translate-x-6 transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-theme-card rounded-lg border border-theme-border">
              <div>
                <p className="font-medium text-theme-primary">Notificações</p>
                <p className="text-sm text-theme-muted">Receber notificações de novos estudos</p>
              </div>
              <button className="w-12 h-6 bg-purple/30 rounded-full p-1 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full transition-transform" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
