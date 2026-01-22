import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card, Button, Input, Badge } from '../../components/common';

const mockStudies = [
  { id: '1', patient: 'Maria Silva', patientId: 'PAC001', modality: 'CT', date: '12/01/2026', description: 'TC Tórax', series: 3, images: 245 },
  { id: '2', patient: 'João Santos', patientId: 'PAC002', modality: 'MR', date: '12/01/2026', description: 'RM Crânio', series: 5, images: 180 },
  { id: '3', patient: 'Ana Oliveira', patientId: 'PAC003', modality: 'CR', date: '11/01/2026', description: 'RX Tórax PA', series: 1, images: 2 },
  { id: '4', patient: 'Carlos Lima', patientId: 'PAC004', modality: 'US', date: '11/01/2026', description: 'USG Abdome Total', series: 2, images: 45 },
  { id: '5', patient: 'Paula Costa', patientId: 'PAC005', modality: 'CT', date: '10/01/2026', description: 'TC Abdome', series: 4, images: 320 },
  { id: '6', patient: 'Roberto Alves', patientId: 'PAC006', modality: 'MR', date: '10/01/2026', description: 'RM Coluna Lombar', series: 6, images: 156 },
];

const modalityColors: Record<string, string> = {
  CT: 'bg-nautico/20 text-nautico border-nautico/30',
  MR: 'bg-purple-light/20 text-purple-light border-purple-light/30',
  CR: 'bg-ultra/20 text-ultra border-ultra/30',
  US: 'bg-green-aqua/20 text-green-aqua border-green-aqua/30',
};

export function Studies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');

  const filteredStudies = mockStudies.filter(study => {
    const matchesSearch = study.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          study.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModality = selectedModality === 'all' || study.modality === selectedModality;
    return matchesSearch && matchesModality;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Estudos DICOM</h1>
          <p className="text-theme-muted mt-1">{filteredStudies.length} estudos encontrados</p>
        </div>

        {/* Filters */}
        <Card className="!p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por paciente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <div className="flex gap-2">
              {['all', 'CT', 'MR', 'CR', 'US'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => setSelectedModality(mod)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedModality === mod
                      ? 'bg-nautico text-white'
                      : 'bg-theme-card text-theme-muted hover:text-theme-primary border border-theme-border'
                  }`}
                >
                  {mod === 'all' ? 'Todos' : mod}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Studies Table */}
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[800px]">
              <thead className="bg-theme-secondary">
                <tr>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Paciente</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">ID</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Modalidade</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Descrição</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Data</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Séries</th>
                  <th className="text-left text-sm font-semibold text-theme-secondary px-6 py-4">Imagens</th>
                  <th className="text-right text-sm font-semibold text-theme-secondary px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-light">
                {filteredStudies.map((study) => (
                  <tr 
                    key={study.id} 
                    className="hover:bg-nautico/10 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-theme-primary">{study.patient}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-theme-muted font-mono text-sm">{study.patientId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${modalityColors[study.modality] || ''}`}>
                        {study.modality}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-theme-secondary">{study.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-theme-muted">{study.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-theme-secondary">{study.series}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-theme-secondary">{study.images}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/viewer/${study.id}`}>
                          <Button variant="ghost" size="sm" title="Visualizar estudo">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-secondary">
            <span className="text-sm text-theme-muted">
              Mostrando 1-{filteredStudies.length} de {filteredStudies.length} resultados
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Próximo
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
