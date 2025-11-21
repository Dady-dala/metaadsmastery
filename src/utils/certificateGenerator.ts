import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface CertificateData {
  studentId: string;
  courseName: string;
  completionDate: string;
}

interface CertificateSettings {
  primary_color: string;
  accent_color: string;
  background_color: string;
  organization_name: string;
  organization_subtitle: string;
  trainer_name: string;
  certificate_title: string;
  logo_url: string | null;
  trainer_signature_url: string | null;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const generateCertificate = async (data: CertificateData): Promise<string> => {
  // Charger le profil de l'étudiant pour obtenir son nom complet
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('user_id', data.studentId)
    .single();

  let studentName = 'Étudiant';
  if (!profileError && profileData) {
    const firstName = profileData.first_name || '';
    const lastName = profileData.last_name || '';
    studentName = `${firstName} ${lastName}`.trim() || 'Étudiant';
  }

  // Charger les paramètres de certificat depuis la base de données
  const { data: settingsData, error } = await supabase
    .from('certificate_settings')
    .select('*')
    .single();

  let settings: CertificateSettings;
  
  if (error || !settingsData) {
    console.error('Error loading certificate settings, using defaults:', error);
    // Valeurs par défaut si erreur
    settings = {
      primary_color: '#6B21A8',
      accent_color: '#22C55E',
      background_color: '#1A0B2E',
      organization_name: 'Meta Ads Mastery',
      organization_subtitle: 'Formation professionnelle en publicité Meta',
      trainer_name: 'Formateur Expert',
      certificate_title: 'CERTIFICAT DE RÉUSSITE',
      logo_url: null,
      trainer_signature_url: null,
    };
  } else {
    settings = settingsData;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Convertir les couleurs hex en RGB
  const primaryRgb = hexToRgb(settings.primary_color);
  const accentRgb = hexToRgb(settings.accent_color);
  const bgRgb = hexToRgb(settings.background_color);

  // Fond
  doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
  doc.rect(0, 0, 297, 210, 'F');

  // Bordure décorative
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setLineWidth(3);
  doc.rect(10, 10, 277, 190);

  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.setLineWidth(1);
  doc.rect(15, 15, 267, 180);

  // Titre "CERTIFICAT"
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.certificate_title, 148.5, 40, { align: 'center' });

  // Ligne décorative
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setLineWidth(0.5);
  doc.line(60, 50, 237, 50);

  // Texte "Ceci certifie que"
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Ceci certifie que', 148.5, 70, { align: 'center' });

  // Nom de l'étudiant
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(studentName, 148.5, 90, { align: 'center' });

  // Texte "a complété avec succès"
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('a complété avec succès la formation', 148.5, 105, { align: 'center' });

  // Nom du cours
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.courseName, 148.5, 120, { align: 'center' });

  // Date de complétion
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Délivré le ${data.completionDate}`, 148.5, 140, { align: 'center' });

  // Logo/Signature section
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.organization_name, 148.5, 165, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(settings.organization_subtitle, 148.5, 172, { align: 'center' });

  // Signature - image ou texte
  if (settings.trainer_signature_url) {
    try {
      // Charger l'image de signature
      const response = await fetch(settings.trainer_signature_url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      await new Promise((resolve, reject) => {
        reader.onload = () => {
          const imgData = reader.result as string;
          // Ajouter l'image de signature (centré, largeur max 60mm)
          doc.addImage(imgData, 'PNG', 118.5, 175, 60, 15, undefined, 'FAST');
          resolve(true);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading signature image:', error);
      // Fallback sur le texte si l'image ne charge pas
      doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.line(110, 180, 187, 180);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(settings.trainer_name, 148.5, 186, { align: 'center' });
    }
  } else {
    // Ligne de signature et texte
    doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.line(110, 180, 187, 180);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(settings.trainer_name, 148.5, 186, { align: 'center' });
  }

  // Générer le PDF en data URL
  const pdfDataUri = doc.output('dataurlstring');
  
  return pdfDataUri;
};
