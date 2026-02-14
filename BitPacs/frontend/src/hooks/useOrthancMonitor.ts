import { useState, useEffect, useRef } from 'react';
//intervalo entre atualizações (em ms)
const INTERVALO_ATUALIZACAO = 5000;

export function useOrthancMonitor(onNewData: () => void) {
    // Usamos useRef para armazenar o ID sem forçar renderizações visuais
    const lastSequenceRef = useRef<number>(0);
    const [isMonitoring, setIsMonitoring] = useState(false);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        const checkChanges = async () => {
            try {

                if (lastSequenceRef.current === 0) {
                    const response = await fetch('/orthanc/changes?descending=true&limit=1');
                    const data = await response.json();

                    // Se o servidor tiver dados, pegamos o último número. Se for vazio, fica 0.
                    lastSequenceRef.current = data.Last || 0;

                    console.log(`🔔 Orthanc Monitor iniciado. Última sequência: ${lastSequenceRef.current}`);

                    setIsMonitoring(true);
                    return; // não faz mais nada na primeira vez
                }

                // Se o número 'Last' do servidor for maior que o que temos, tem novidade
                const response = await fetch(`/orthanc/changes?since=${lastSequenceRef.current}&limit=100`);
                const data = await response.json();

                if (data.Last > lastSequenceRef.current) {
                    console.log (`🔔 Orthanc avisou: Novas mudanças detectadas! (De ${lastSequenceRef.current} para ${data.Last})`);

                    // Atualizamos nosso número de controle
                    lastSequenceRef.current = data.Last;

                    // ver lista de nomes que chegou
                    const listaDeTipos = data.Changes.map((change : any) => change.ChangeType);
                    console.log(" Tipos de mudanças recebidas:", listaDeTipos);
                    
                    // filtrando apenas newStudy ou NewSeries
                    const temNovidadeReal = listaDeTipos.includes('NewStudy') || listaDeTipos.includes('NewSeries');

                    if (temNovidadeReal) {
                        console.log(" Novo exame detectado. Executando callback...");
                        onNewData();
                    } else {
                        console.log(" Mudanças detectadas, mas sem novos exames.");
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar mudanças no Orthanc:", error);
            }
        }

        // roda a primeira vez imediatamente
        checkChanges();

        // Configura o intervalo para rodar a checagem periodicamente
        intervalId = setInterval(checkChanges, INTERVALO_ATUALIZACAO);

        // Limpeza: Se o usuário sair da página, o loop para.
        return () => clearInterval(intervalId);
    }, [onNewData]);

    return { isMonitoring };
}