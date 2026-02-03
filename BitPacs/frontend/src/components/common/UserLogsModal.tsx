import { useState, useEffect } from 'react';
import { Button } from './Button';
import type { StudyLog, StudyLogsResponse } from '../../types';

interface UserLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

const ITEMS_PER_PAGE = 8;

export function UserLogsModal({ isOpen, onClose, userId, userName }: UserLogsModalProps) {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Buscar logs do usuário
  const fetchLogs = async (page: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('bitpacs_token');
      const response = await fetch(
        `http://localhost:5151/api/studylogs/user/${userId}?page=${page}&pageSize=${ITEMS_PER_PAGE}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data: StudyLogsResponse = await response.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
        setTotalLogs(data.pagination.totalLogs);
      } else {
        console.error('Erro ao carregar logs');
        setLogs([]);
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      setCurrentPage(1);
      fetchLogs(1);
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (isOpen && userId && currentPage > 0) {
      fetchLogs(currentPage);
    }
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Formatar data/hora
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-theme-card border border-theme-border rounded-xl w-full max-w-3xl mx-4 shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-theme-primary">
              Histórico de Atividades
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              Visualizações e downloads de <span className="text-nautico">{userName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin h-full">
            <table className="w-full">
              <thead className="bg-theme-secondary sticky top-0">
                <tr>
                  <th className="text-left text-xs font-semibold text-theme-secondary px-4 py-3">Ação</th>
                  <th className="text-left text-xs font-semibold text-theme-secondary px-4 py-3">Paciente</th>
                  <th className="text-left text-xs font-semibold text-theme-secondary px-4 py-3">Descrição</th>
                  <th className="text-left text-xs font-semibold text-theme-secondary px-4 py-3">Mod.</th>
                  <th className="text-left text-xs font-semibold text-theme-secondary px-4 py-3">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-light">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-nautico border-t-transparent rounded-full animate-spin" />
                        Carregando histórico...
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-theme-muted">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-theme-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Nenhuma atividade registrada.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-nautico/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${
                          log.actionType === 'DOWNLOAD' 
                            ? 'bg-green-aqua/20 text-green-aqua border border-green-aqua/30' 
                            : 'bg-nautico/20 text-nautico border border-nautico/30'
                        }`}>
                          {log.actionType === 'DOWNLOAD' ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                          {log.actionType === 'DOWNLOAD' ? 'Download' : 'Visualização'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-theme-primary font-medium truncate max-w-[150px] block">
                          {log.patientName || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-theme-muted truncate max-w-[180px] block">
                          {log.studyDescription || 'Sem descrição'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-theme-secondary bg-theme-secondary/50 px-2 py-1 rounded">
                          {log.modality || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-theme-muted whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer com Paginação */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-secondary flex-shrink-0">
          <span className="text-sm text-theme-muted">
            {totalLogs > 0 ? (
              <>Total: {totalLogs} registro(s)</>
            ) : (
              'Nenhum registro'
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePrevPage}
              disabled={currentPage === 1 || totalLogs === 0}
            >
              Anterior
            </Button>
            
            <span className="text-xs text-theme-muted font-medium px-2">
              Pág {currentPage} de {totalPages || 1}
            </span>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalLogs === 0}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
