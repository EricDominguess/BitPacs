import { MainLayout } from '../../components/layout';
import { Card, Button, Input } from '../../components/common';

export function Settings() {
  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-white/60 mt-1">Gerencie as preferências do sistema</p>
        </div>

        {/* Profile Section */}
        <Card title="Perfil">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-nautico to-purple-light flex items-center justify-center">
                <span className="text-2xl font-bold text-white">U</span>
              </div>
              <div>
                <Button variant="outline" size="sm">Alterar Foto</Button>
                <p className="text-xs text-white/50 mt-2">JPG, PNG ou GIF. Máx 2MB</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Nome" defaultValue="Usuário Admin" />
              <Input label="Email" type="email" defaultValue="admin@bitpacs.com" />
              <Input label="Cargo" defaultValue="Administrador" />
              <Input label="Instituição" defaultValue="Hospital BitFix" />
            </div>

            <div className="flex justify-end">
              <Button>Salvar Alterações</Button>
            </div>
          </div>
        </Card>

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
                  <p className="text-xs text-white/60 mt-1">Servidor PACS conectado e funcionando corretamente</p>
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
            <div className="flex items-center justify-between p-4 bg-purple-dark/50 rounded-lg">
              <div>
                <p className="font-medium text-white">Tema Escuro</p>
                <p className="text-sm text-white/50">Usar tema escuro na interface</p>
              </div>
              <button className="w-12 h-6 bg-nautico rounded-full p-1 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full transform translate-x-6 transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-dark/50 rounded-lg">
              <div>
                <p className="font-medium text-white">Animações</p>
                <p className="text-sm text-white/50">Habilitar animações de transição</p>
              </div>
              <button className="w-12 h-6 bg-nautico rounded-full p-1 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full transform translate-x-6 transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-dark/50 rounded-lg">
              <div>
                <p className="font-medium text-white">Notificações</p>
                <p className="text-sm text-white/50">Receber notificações de novos estudos</p>
              </div>
              <button className="w-12 h-6 bg-purple rounded-full p-1 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full transition-transform" />
              </button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="!border-accent-red/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-accent-red">Zona de Perigo</h3>
              <p className="text-sm text-white/50 mt-1">Ações irreversíveis para sua conta</p>
            </div>
            <Button 
              variant="outline" 
              className="!border-accent-red !text-accent-red hover:!bg-accent-red hover:!text-white"
            >
              Excluir Conta
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
