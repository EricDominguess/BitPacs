export interface Study {
  id: string;
  patientName: string;
  patientId: string;
  studyDate: string;
  modality: string;
  description: string;
  seriesCount: number;
  instanceCount: number;
}

export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  gender: 'M' | 'F' | 'O';
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

// Log de visualização/download de estudos
export interface StudyLog {
  id: number;
  actionType: 'VIEW' | 'DOWNLOAD';
  studyId: string;
  studyInstanceUID?: string;
  patientName?: string;
  studyDescription?: string;
  unidadeNome?: string;
  modality?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface StudyLogsResponse {
  logs: StudyLog[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalLogs: number;
    totalPages: number;
  };
}
