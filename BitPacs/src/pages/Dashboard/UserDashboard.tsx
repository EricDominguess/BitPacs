import { MainLayout } from '../../components/layout';
import { StatCard, RecentStudiesTable, ModalityStats } from '../../components/dashboard';
import { useEffect, useState } from 'react';
import { data } from 'react-router-dom';

export function UserDashboard() {

  // teste do console.log
  console.log("UserDashboard renderizado");

  // hooks e logica
  const data = new Date();
  const dataHoje = `${data.getFullYear()}${(data.getMonth()+1).toString().padStart(2,'0')}${data.getDate().toString().padStart(2,'0')}`;
  const [pacientes, setPacientes] = useState([]);
  const [estudos, setEstudos] = useState([]);

  const stats = [
  { label: 'Estudos Hoje', value: estudos.filter(estudo => estudo.MainDicomTags.StudyDate === dataHoje).length.toString()},
  { label: 'Pacientes Ativos', value: pacientes.length.toString()},
  ];
  
  const recentStudies = [
    { patient: 'Maria Silva', modality: 'CT', date: '12/01/2026', status: 'Completo' },
    { patient: 'João Santos', modality: 'MR', date: '12/01/2026', status: 'Processando' },
    { patient: 'Ana Oliveira', modality: 'CR', date: '11/01/2026', status: 'Completo' },
    { patient: 'Carlos Lima', modality: 'US', date: '11/01/2026', status: 'Completo' },
    { patient: 'Paula Costa', modality: 'CT', date: '10/01/2026', status: 'Completo' },
  ];
  
  // Comunicando com o Orthanc via Proxy
  useEffect(() => {
    // Fetch vai bater na porta do seu Proxy
    fetch('/orthanc/patients')
      // conversão da resposta bruta para JSON
      .then(resposta => resposta.json())
      // dados prontos para uso
      .then(dados => console.log("Recebi do Orthanc:", setPacientes(dados))) // mostra no console
      .catch(erro => console.error("Deu erro:", erro));

    fetch('/orthanc/studies?expand')
      .then(response => response.json())
      .then(data => console.log("Estudos recebidos", setEstudos(data)))
      .catch(erro => console.error("Deu erro:", erro));

  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Dashboard</h1>
            <p className="text-theme-muted mt-1">Visão geral do sistema PACS</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-theme-muted">
            <span>Última atualização:</span>
            <span className="text-ultra">há 2 minutos</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Studies */}
          <RecentStudiesTable studies={recentStudies} className="lg:col-span-2" />

          {/* Modalidades */}
          <ModalityStats />
        </div>
      </div>
    </MainLayout>
  );
}
