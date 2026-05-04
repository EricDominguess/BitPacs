export type ReportType = 'activity' | 'exams';

export interface ReportTotals {
  totalLogs: number;
  totalStudies: number;
  totalPatients: number;
  totalViews: number;
  totalDownloads: number;
}

export interface ReportRecord {
  id: number;
  timestamp: string;
  patientName: string | null;
  studyDescription: string | null;
  modality: string | null;
  unidadeNome: string | null;
  actionType: string;
  userName: string | null;
}

export interface ReportResponse {
  totals: ReportTotals;
  records: ReportRecord[];
  summaries?: {
    byDoctor?: Array<{ doctorId: number; doctorName: string; totalActions: number; totalViews: number; totalDownloads: number }>;
    byUnit?: Array<{ unidade: string; totalActions: number; totalViews: number; totalDownloads: number }>;
  };
}

export interface DoctorOption {
  id: number;
  nome: string;
  unidadeId?: string;
}
