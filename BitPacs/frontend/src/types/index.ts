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
