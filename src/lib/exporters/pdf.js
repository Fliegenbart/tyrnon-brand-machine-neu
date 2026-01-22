// ============================================
// PDF EXPORT - Native PDF Generation
// ============================================
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { hexToRgb } from '../tokens.js';

/**
 * Generiert einen Flyer als PDF
 */
export async function generateFlyerPdf(tokens, content, options = {}) {
  const format = options.format || 'a4';
  const formats = {
    a4: { width: 595, height: 842 },   // 210x297mm @ 72dpi
    a5: { width: 420, height: 595 },   // 148x210mm @ 72dpi
    dl: { width: 283, height: 595 }    // 99x210mm @ 72dpi
  };
  
  const { width, height } = formats[format] || formats.a4;
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);
  
  // Fonts laden (Standard-Fonts als Fallback)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Farben konvertieren
  const primaryRgb = hexToRgb(tokens.colors.primary.value);
  const textRgb = hexToRgb(tokens.colors.text.value);
  const accentRgb = hexToRgb(tokens.colors.accent.value);
  
  const primaryColor = rgb(primaryRgb[0]/255, primaryRgb[1]/255, primaryRgb[2]/255);
  const textColor = rgb(textRgb[0]/255, textRgb[1]/255, textRgb[2]/255);
  const accentColor = rgb(accentRgb[0]/255, accentRgb[1]/255, accentRgb[2]/255);
  
  // Header-Block
  page.drawRectangle({
    x: 0,
    y: height - 150,
    width: width,
    height: 150,
    color: primaryColor
  });
  
  // Logo (wenn vorhanden und als Base64)
  if (tokens.assets.logo) {
    try {
      const logoBytes = await fetch(tokens.assets.logo).then(r => r.arrayBuffer());
      const logoImage = tokens.assets.logo.includes('png') 
        ? await pdfDoc.embedPng(logoBytes)
        : await pdfDoc.embedJpg(logoBytes);
      
      const logoDims = logoImage.scale(0.3);
      page.drawImage(logoImage, {
        x: width/2 - logoDims.width/2,
        y: height - 120,
        width: logoDims.width,
        height: logoDims.height
      });
    } catch (e) {
      // Logo konnte nicht eingebettet werden
      console.warn('Logo konnte nicht eingebettet werden:', e);
    }
  }
  
  // Headline
  const headline = content.fields?.headline?.value || tokens.voice.tagline || 'Headline';
  page.drawText(headline, {
    x: 40,
    y: height - 220,
    size: 32,
    font: fontBold,
    color: textColor,
    maxWidth: width - 80
  });
  
  // Beschreibung
  const description = content.fields?.description?.value || '';
  if (description) {
    page.drawText(description, {
      x: 40,
      y: height - 280,
      size: 14,
      font: fontRegular,
      color: textColor,
      maxWidth: width - 80,
      lineHeight: 20
    });
  }
  
  // Details
  const details = content.fields?.details?.value || '';
  if (details) {
    page.drawText(details, {
      x: 40,
      y: height - 400,
      size: 12,
      font: fontRegular,
      color: textColor,
      maxWidth: width - 80,
      lineHeight: 18
    });
  }
  
  // CTA-Button
  const cta = content.fields?.cta?.value || 'Mehr erfahren';
  const ctaWidth = fontBold.widthOfTextAtSize(cta, 16) + 40;
  
  page.drawRectangle({
    x: 40,
    y: 60,
    width: ctaWidth,
    height: 40,
    color: accentColor,
    borderRadius: 4
  });
  
  page.drawText(cta, {
    x: 60,
    y: 75,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1)
  });
  
  // Footer-Linie
  page.drawLine({
    start: { x: 40, y: 40 },
    end: { x: width - 40, y: 40 },
    thickness: 1,
    color: primaryColor
  });
  
  // Brand-Name im Footer
  page.drawText(tokens.meta.name, {
    x: 40,
    y: 20,
    size: 10,
    font: fontRegular,
    color: textColor
  });
  
  return pdfDoc;
}

/**
 * Generiert eine Visitenkarte als PDF
 */
export async function generateBusinessCardPdf(tokens, content, options = {}) {
  // Visitenkarte: 85x55mm @ 300dpi = 1004x650px, hier @72dpi = 241x156
  const width = 241;
  const height = 156;
  
  const pdfDoc = await PDFDocument.create();
  
  // Vorderseite
  const frontPage = pdfDoc.addPage([width, height]);
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const primaryRgb = hexToRgb(tokens.colors.primary.value);
  const textRgb = hexToRgb(tokens.colors.text.value);
  
  const primaryColor = rgb(primaryRgb[0]/255, primaryRgb[1]/255, primaryRgb[2]/255);
  const textColor = rgb(textRgb[0]/255, textRgb[1]/255, textRgb[2]/255);
  
  // Rand
  frontPage.drawRectangle({
    x: 0,
    y: 0,
    width: 4,
    height: height,
    color: primaryColor
  });
  
  // Name
  const name = content.fields?.name?.value || 'Name';
  frontPage.drawText(name, {
    x: 20,
    y: height - 50,
    size: 14,
    font: fontBold,
    color: textColor
  });
  
  // Titel
  const title = content.fields?.title?.value || '';
  if (title) {
    frontPage.drawText(title, {
      x: 20,
      y: height - 70,
      size: 10,
      font: fontRegular,
      color: primaryColor
    });
  }
  
  // Rückseite
  const backPage = pdfDoc.addPage([width, height]);
  
  // Voller Hintergrund
  backPage.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: primaryColor
  });
  
  // Kontaktdaten
  const phone = content.fields?.phone?.value || '';
  const email = content.fields?.email?.value || '';
  const website = content.fields?.website?.value || '';
  
  let yPos = height - 50;
  
  if (phone) {
    backPage.drawText(phone, { x: 20, y: yPos, size: 9, font: fontRegular, color: rgb(1,1,1) });
    yPos -= 15;
  }
  if (email) {
    backPage.drawText(email, { x: 20, y: yPos, size: 9, font: fontRegular, color: rgb(1,1,1) });
    yPos -= 15;
  }
  if (website) {
    backPage.drawText(website, { x: 20, y: yPos, size: 9, font: fontRegular, color: rgb(1,1,1) });
  }
  
  return pdfDoc;
}

/**
 * Speichert PDF als Download
 */
export async function downloadPdf(pdfDoc, filename = 'document.pdf') {
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Gibt PDF als Blob zurück
 */
export async function getPdfBlob(pdfDoc) {
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Generiert Brand Guidelines PDF
 */
export async function generateGuidelinesPdf(tokens, options = {}) {
  const pdfDoc = await PDFDocument.create();
  
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const primaryRgb = hexToRgb(tokens.colors.primary.value);
  const textRgb = hexToRgb(tokens.colors.text.value);
  const primaryColor = rgb(primaryRgb[0]/255, primaryRgb[1]/255, primaryRgb[2]/255);
  const textColor = rgb(textRgb[0]/255, textRgb[1]/255, textRgb[2]/255);
  
  // ===== SEITE 1: Cover =====
  const coverPage = pdfDoc.addPage([595, 842]);
  
  // Header-Block
  coverPage.drawRectangle({
    x: 0, y: 842 - 250,
    width: 595, height: 250,
    color: primaryColor
  });
  
  coverPage.drawText('BRAND', {
    x: 50, y: 842 - 120,
    size: 60, font: fontBold,
    color: rgb(1, 1, 1)
  });
  
  coverPage.drawText('GUIDELINES', {
    x: 50, y: 842 - 180,
    size: 60, font: fontBold,
    color: rgb(1, 1, 1)
  });
  
  coverPage.drawText(tokens.meta.name, {
    x: 50, y: 842 - 350,
    size: 32, font: fontBold,
    color: textColor
  });
  
  coverPage.drawText(`Stand: ${new Date().toLocaleDateString('de-DE')}`, {
    x: 50, y: 50,
    size: 12, font: fontRegular,
    color: rgb(0.5, 0.5, 0.5)
  });

  // ===== SEITE 2: Farben =====
  const colorsPage = pdfDoc.addPage([595, 842]);
  
  colorsPage.drawText('Farben', {
    x: 50, y: 842 - 60,
    size: 28, font: fontBold,
    color: textColor
  });
  
  // Farb-Swatches
  const colors = [
    { name: 'Primary', ...tokens.colors.primary },
    { name: 'Secondary', ...tokens.colors.secondary },
    { name: 'Accent', ...tokens.colors.accent },
    { name: 'Background', ...tokens.colors.background },
    { name: 'Text', ...tokens.colors.text }
  ];
  
  let yPos = 842 - 120;
  colors.forEach((color, index) => {
    const colorRgb = hexToRgb(color.value);
    
    // Farbfeld
    colorsPage.drawRectangle({
      x: 50, y: yPos - 60,
      width: 80, height: 60,
      color: rgb(colorRgb[0]/255, colorRgb[1]/255, colorRgb[2]/255),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1
    });
    
    // Farbname
    colorsPage.drawText(color.name, {
      x: 150, y: yPos - 25,
      size: 14, font: fontBold,
      color: textColor
    });
    
    // Hex-Wert
    colorsPage.drawText(color.value.toUpperCase(), {
      x: 150, y: yPos - 45,
      size: 12, font: fontRegular,
      color: rgb(0.4, 0.4, 0.4)
    });
    
    // RGB-Wert
    colorsPage.drawText(`RGB: ${color.rgb.join(', ')}`, {
      x: 280, y: yPos - 45,
      size: 12, font: fontRegular,
      color: rgb(0.4, 0.4, 0.4)
    });
    
    yPos -= 90;
  });

  // ===== SEITE 3: Typografie =====
  const typoPage = pdfDoc.addPage([595, 842]);
  
  typoPage.drawText('Typografie', {
    x: 50, y: 842 - 60,
    size: 28, font: fontBold,
    color: textColor
  });
  
  typoPage.drawText('Überschriften', {
    x: 50, y: 842 - 120,
    size: 14, font: fontBold,
    color: primaryColor
  });
  
  typoPage.drawText(tokens.typography.heading.fontFamilyClean, {
    x: 50, y: 842 - 145,
    size: 20, font: fontBold,
    color: textColor
  });
  
  typoPage.drawText('Fließtext', {
    x: 50, y: 842 - 200,
    size: 14, font: fontBold,
    color: primaryColor
  });
  
  typoPage.drawText(tokens.typography.body.fontFamilyClean, {
    x: 50, y: 842 - 225,
    size: 16, font: fontRegular,
    color: textColor
  });
  
  // Schriftgrößen-Skala
  typoPage.drawText('Größen-Skala', {
    x: 50, y: 842 - 300,
    size: 14, font: fontBold,
    color: primaryColor
  });
  
  const scales = Object.entries(tokens.typography.scale);
  let scaleY = 842 - 340;
  scales.forEach(([name, scale]) => {
    typoPage.drawText(`${name}: ${scale.size}px`, {
      x: 50, y: scaleY,
      size: 12, font: fontRegular,
      color: textColor
    });
    scaleY -= 25;
  });

  // ===== SEITE 4: Tonalität =====
  const voicePage = pdfDoc.addPage([595, 842]);
  
  voicePage.drawText('Markenstimme', {
    x: 50, y: 842 - 60,
    size: 28, font: fontBold,
    color: textColor
  });
  
  if (tokens.voice.tagline) {
    voicePage.drawText('Kernbotschaft', {
      x: 50, y: 842 - 120,
      size: 14, font: fontBold,
      color: primaryColor
    });
    
    voicePage.drawText(`"${tokens.voice.tagline}"`, {
      x: 50, y: 842 - 150,
      size: 18, font: fontRegular,
      color: textColor
    });
  }
  
  voicePage.drawText('Tonalität', {
    x: 50, y: 842 - 210,
    size: 14, font: fontBold,
    color: primaryColor
  });
  
  const toneLabels = {
    professional: 'Professionell & Sachlich',
    friendly: 'Freundlich & Nahbar',
    innovative: 'Innovativ & Visionär',
    premium: 'Premium & Exklusiv',
    playful: 'Spielerisch & Locker',
    trustworthy: 'Vertrauenswürdig & Seriös'
  };
  
  voicePage.drawText(toneLabels[tokens.voice.tone] || tokens.voice.tone, {
    x: 50, y: 842 - 235,
    size: 14, font: fontRegular,
    color: textColor
  });
  
  if (tokens.voice.dos.length > 0) {
    voicePage.drawText('Do\'s - Diese Wörter verwenden:', {
      x: 50, y: 842 - 300,
      size: 14, font: fontBold,
      color: rgb(0.13, 0.77, 0.37)
    });
    
    voicePage.drawText(tokens.voice.dos.join(', '), {
      x: 50, y: 842 - 325,
      size: 12, font: fontRegular,
      color: textColor,
      maxWidth: 495
    });
  }
  
  if (tokens.voice.donts.length > 0) {
    voicePage.drawText('Don\'ts - Diese Wörter vermeiden:', {
      x: 50, y: 842 - 390,
      size: 14, font: fontBold,
      color: rgb(0.94, 0.27, 0.27)
    });
    
    voicePage.drawText(tokens.voice.donts.join(', '), {
      x: 50, y: 842 - 415,
      size: 12, font: fontRegular,
      color: textColor,
      maxWidth: 495
    });
  }

  return pdfDoc;
}

export default { generateFlyerPdf, generateBusinessCardPdf, generateGuidelinesPdf, downloadPdf, getPdfBlob };
