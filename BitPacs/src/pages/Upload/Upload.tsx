import { useState, useCallback } from 'react';
import { MainLayout } from '../../components/layout';
import { Card, Button } from '../../components/common';

export function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    setUploading(true);
    // Simular upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    setUploading(false);
    setFiles([]);
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Upload de Estudos</h1>
          <p className="text-white/60 mt-1">Importe arquivos DICOM para o sistema</p>
        </div>

        {/* Drop Zone */}
        <Card className="!p-0 overflow-hidden">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative p-12 border-2 border-dashed rounded-xl transition-all duration-300 text-center
              ${isDragging 
                ? 'border-ultra bg-ultra/10' 
                : 'border-purple/40 hover:border-nautico/50 bg-purple-dark/20'
              }
            `}
          >
            <input
              type="file"
              multiple
              accept=".dcm,.dicom,application/dicom"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className={`
                w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all
                ${isDragging ? 'bg-ultra/20 scale-110' : 'bg-nautico/20'}
              `}>
                <svg className={`w-10 h-10 transition-colors ${isDragging ? 'text-ultra' : 'text-nautico'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <p className="text-lg font-medium text-white">
                  {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos DICOM aqui'}
                </p>
                <p className="text-sm text-white/50 mt-1">
                  ou clique para selecionar arquivos
                </p>
              </div>

              <p className="text-xs text-white/40">
                Formatos suportados: .dcm, .dicom • Tamanho máximo: 500MB por arquivo
              </p>
            </div>
          </div>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card title={`Arquivos Selecionados (${files.length})`}>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-purple-dark/50 rounded-lg group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-nautico/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-nautico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.name}</p>
                      <p className="text-xs text-white/50">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 text-white/40 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple/20">
              <Button variant="ghost" onClick={() => setFiles([])}>
                Limpar Lista
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Iniciar Upload
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Info */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Validação Automática',
              description: 'Verificamos a conformidade DICOM automaticamente',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: 'Upload Rápido',
              description: 'Processamento paralelo para maior velocidade',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
              title: 'Criptografia',
              description: 'Seus dados são criptografados em trânsito',
            },
          ].map((item, i) => (
            <Card key={i} className="!p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-nautico/20 rounded-lg flex items-center justify-center text-ultra flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-white/50 mt-0.5">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
