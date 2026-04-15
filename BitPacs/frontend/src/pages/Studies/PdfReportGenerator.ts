import { jsPDF } from 'jspdf';
import type { StudyForDownload } from '../../components/studies';

export interface PdfSelectedInstance {
  id: string;
}

interface GenerateStudyPdfParams {
  study: StudyForDownload;
  selectedInstances: PdfSelectedInstance[];
  proxyPrefix: string;
}

const truncate = (value: string, max = 50) => (
  value.length > max ? `${value.slice(0, max - 3)}...` : value
);

const formatCpf = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Erro ao processar imagem para PDF.'));
    reader.readAsDataURL(blob);
  });

const dataUrlToImage = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Erro ao carregar imagem para PDF.'));
    image.src = dataUrl;
  });

export async function generateStudyPdfReport({
  study,
  selectedInstances,
  proxyPrefix,
}: GenerateStudyPdfParams): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let hasAnyPage = false;

  const safePatientName = (study.patient || 'Paciente').replace(/\^/g, ' ').trim();
  const safePatientId = (study.patientId || 'Não informado').trim();
  const safeBirthDate = (study.birthDate || 'Não informado').trim();
  const safeStudyDate = (study.date || 'Não informado').trim();
  const safeModality = (study.modality || 'Não informado').trim();
  const safeBodyPart = (study.bodyPartExamined || 'Não informado').trim();
  const safeDescription = (study.description || 'Sem descrição').replace(/\^/g, ' ').trim();
  const generatedAt = new Date().toLocaleString('pt-BR');

  const compactPatientId = safePatientId.replace(/\s+/g, '');
  const startsWithPid = /^pid/i.test(compactPatientId);
  const isCpf = /^\d{11}$/.test(compactPatientId);
  const patientIdLabel = !startsWithPid && isCpf ? 'CPF' : 'Id do Paciente';
  const patientIdValue = !startsWithPid && isCpf ? formatCpf(compactPatientId) : safePatientId;

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const firstPageImageTop = 100;
  const otherPagesImageTop = 12;
  const imageBottom = pageHeight - 10;
  const imageAreaWidth = pageWidth - 24;

  const drawPageChrome = (imageNumber: number, isFirstPage: boolean) => {
    // Fundo cinza claro da página
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    if (!isFirstPage) {
      return;
    }

    // Faixa azul do cabeçalho (somente 1ª página)
    pdf.setFillColor(38, 66, 142);
    pdf.rect(0, 0, pageWidth, 72, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('BitPacs - Relatório de Imagens', 15, 15);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.text(`Gerado em: ${generatedAt}`, 15, 24.5);

    pdf.setFontSize(9.6);
    pdf.text(`Paciente: ${truncate(safePatientName, 56)}`, 15, 35.5);
    pdf.text(`${patientIdLabel}: ${truncate(patientIdValue, 44)}`, 15, 43.5);
    pdf.text(`Data de Nascimento: ${truncate(safeBirthDate, 24)}`, 15, 51.5);
    pdf.text(`Data do Exame: ${truncate(safeStudyDate, 24)}`, 15, 59.5);

    pdf.text(`Modalidade: ${truncate(safeModality, 20)}`, 105, 51.5);
    pdf.text(`Órgão: ${truncate(safeBodyPart, 22)}`, 105, 59.5);

    // Área de conteúdo
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10.8);
    pdf.text(`Descrição: ${truncate(safeDescription, 80)}`, 15, 84);

    pdf.setFontSize(9.6);
    pdf.setTextColor(118, 118, 118);
    pdf.text(`Imagem ${imageNumber} - ${truncate(safeModality, 16)}`, 15, 94);
    pdf.setTextColor(0, 0, 0);
  };

  for (let i = 0; i < selectedInstances.length; i += 1) {
    const item = selectedInstances[i];
    const imgRes = await fetch(`${proxyPrefix}/instances/${item.id}/preview`);
    if (!imgRes.ok) continue;

    const blob = await imgRes.blob();
    const dataUrl = await blobToDataUrl(blob);
    const img = await dataUrlToImage(dataUrl);

    const isFirstPage = i === 0;
    const imageTop = isFirstPage ? firstPageImageTop : otherPagesImageTop;
    const imageAreaHeight = imageBottom - imageTop;
    const ratio = Math.min(imageAreaWidth / img.width, imageAreaHeight / img.height);
    const renderWidth = img.width * ratio;
    const renderHeight = img.height * ratio;
    const x = (pageWidth - renderWidth) / 2;
    const y = imageTop + (imageAreaHeight - renderHeight) / 2;

    if (hasAnyPage) pdf.addPage();
    drawPageChrome(i + 1, isFirstPage);
    pdf.addImage(dataUrl, 'JPEG', x, y, renderWidth, renderHeight);
    hasAnyPage = true;
  }

  if (!hasAnyPage) {
    throw new Error('Nenhuma imagem válida para gerar PDF.');
  }

  pdf.save(`${study.patient.replace(/\s+/g, '_') || 'estudo'}_imagens.pdf`);
}
