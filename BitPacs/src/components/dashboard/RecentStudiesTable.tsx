import { Card, Badge } from '../../components/common';

interface Study {
  patient: string;
  modality: string;
  date: string;
  status: string;
}

interface RecentStudiesTableProps {
  studies: Study[];
  className?: string;
}

export function RecentStudiesTable({ studies, className = '' }: RecentStudiesTableProps) {
  return (
    <Card title="Estudos Recentes" className={className}>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-theme-border">
              <th className="text-left text-sm font-medium text-theme-muted pb-3">Paciente</th>
              <th className="text-left text-sm font-medium text-theme-muted pb-3">Modalidade</th>
              <th className="text-left text-sm font-medium text-theme-muted pb-3">Data</th>
              <th className="text-left text-sm font-medium text-theme-muted pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-light">
            {studies.map((study, i) => (
              <tr key={i} className="hover:bg-nautico/10 transition-colors cursor-pointer">
                <td className="py-3">
                  <span className="text-theme-primary font-medium">{study.patient}</span>
                </td>
                <td className="py-3">
                  <Badge>{study.modality}</Badge>
                </td>
                <td className="py-3 text-theme-secondary">{study.date}</td>
                <td className="py-3">
                  <Badge variant={study.status === 'Completo' ? 'success' : 'warning'}>
                    {study.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
