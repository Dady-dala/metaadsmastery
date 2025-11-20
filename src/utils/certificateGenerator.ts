import jsPDF from 'jspdf';

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
}

export const generateCertificate = async (data: CertificateData): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Couleurs
  const violetPrimary = '#6B21A8';
  const greenAccent = '#22C55E';
  const darkBg = '#1A0B2E';

  // Fond
  doc.setFillColor(26, 11, 46);
  doc.rect(0, 0, 297, 210, 'F');

  // Bordure décorative
  doc.setDrawColor(107, 33, 168);
  doc.setLineWidth(3);
  doc.rect(10, 10, 277, 190);

  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(1);
  doc.rect(15, 15, 267, 180);

  // Titre "CERTIFICAT"
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICAT DE RÉUSSITE', 148.5, 40, { align: 'center' });

  // Ligne décorative
  doc.setDrawColor(107, 33, 168);
  doc.setLineWidth(0.5);
  doc.line(60, 50, 237, 50);

  // Texte "Ceci certifie que"
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Ceci certifie que', 148.5, 70, { align: 'center' });

  // Nom de l'étudiant
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.studentName || 'Étudiant', 148.5, 90, { align: 'center' });

  // Texte "a complété avec succès"
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('a complété avec succès la formation', 148.5, 105, { align: 'center' });

  // Nom du cours
  doc.setTextColor(107, 33, 168);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.courseName, 148.5, 120, { align: 'center' });

  // Date de complétion
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Délivré le ${data.completionDate}`, 148.5, 140, { align: 'center' });

  // Logo/Signature section
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Meta Ads Mastery', 148.5, 165, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Formation professionnelle en publicité Meta', 148.5, 172, { align: 'center' });

  // Ligne de signature
  doc.setDrawColor(107, 33, 168);
  doc.line(110, 180, 187, 180);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Signature du formateur', 148.5, 186, { align: 'center' });

  // Générer le PDF en data URL
  const pdfDataUri = doc.output('dataurlstring');
  
  return pdfDataUri;
};
