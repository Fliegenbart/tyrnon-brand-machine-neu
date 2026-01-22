// ============================================
// PPTX EXPORT - Native PowerPoint Generation
// ============================================
import PptxGenJS from 'pptxgenjs';

/**
 * Generiert eine PowerPoint-Präsentation aus Design Tokens und Content
 */
export async function generatePptx(tokens, content, options = {}) {
  const pptx = new PptxGenJS();
  
  // Präsentations-Metadaten
  pptx.author = content.fields?.author?.value || tokens.meta.name;
  pptx.title = content.fields?.title?.value || 'Präsentation';
  pptx.subject = tokens.meta.name + ' Präsentation';
  pptx.company = tokens.meta.name;
  
  // Layout: 16:9
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
  pptx.layout = 'LAYOUT_16x9';
  
  // Master-Slide definieren
  const masterSlide = {
    title: 'BRAND_MASTER',
    background: { color: tokens.colors.background.value.replace('#', '') },
    objects: [
      // Logo oben rechts (wenn vorhanden)
      // Footer-Linie
      {
        line: {
          x: 0.5, y: 5.2, w: 9, h: 0,
          line: { color: tokens.colors.primary.value.replace('#', ''), width: 1 }
        }
      }
    ]
  };
  
  pptx.defineSlideMaster(masterSlide);
  
  // Slides generieren
  const slides = content.slides || getDefaultSlides(tokens, content);
  
  for (const slideData of slides) {
    const slide = pptx.addSlide({ masterName: 'BRAND_MASTER' });
    
    switch (slideData.layout) {
      case 'title':
        renderTitleSlide(slide, slideData, tokens);
        break;
      case 'bullets':
        renderBulletSlide(slide, slideData, tokens);
        break;
      case 'image':
        renderImageSlide(slide, slideData, tokens);
        break;
      case 'twoColumn':
        renderTwoColumnSlide(slide, slideData, tokens);
        break;
      case 'closing':
        renderClosingSlide(slide, slideData, tokens);
        break;
      default:
        renderBulletSlide(slide, slideData, tokens);
    }
  }
  
  return pptx;
}

/**
 * Default-Slides wenn keine definiert sind
 */
function getDefaultSlides(tokens, content) {
  return [
    {
      layout: 'title',
      fields: {
        title: { value: content.fields?.title?.value || tokens.voice.tagline || 'Präsentation' },
        subtitle: { value: content.fields?.subtitle?.value || tokens.meta.name }
      }
    },
    {
      layout: 'bullets',
      fields: {
        headline: { value: 'Agenda' },
        bullets: { value: ['Einführung', 'Hauptthemen', 'Zusammenfassung', 'Fragen & Diskussion'] }
      }
    },
    {
      layout: 'closing',
      fields: {
        headline: { value: 'Vielen Dank!' },
        contact: { value: content.fields?.author?.value || '' }
      }
    }
  ];
}

/**
 * Titelfolie
 */
function renderTitleSlide(slide, data, tokens) {
  const primaryColor = tokens.colors.primary.value.replace('#', '');
  const textColor = tokens.colors.text.value.replace('#', '');
  const fontHeading = tokens.typography.heading.fontFamilyClean;
  const fontBody = tokens.typography.body.fontFamilyClean;
  
  // Farbiger Header-Balken
  slide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: 1.8,
    fill: { color: primaryColor }
  });
  
  // Logo (wenn vorhanden)
  if (tokens.assets.logo) {
    slide.addImage({
      data: tokens.assets.logo,
      x: 0.5, y: 0.4, h: 1,
      sizing: { type: 'contain', h: 1 }
    });
  }
  
  // Titel
  slide.addText(data.fields.title?.value || 'Titel', {
    x: 0.5, y: 2.2, w: 9, h: 1.2,
    fontSize: 44,
    fontFace: fontHeading,
    color: textColor,
    bold: true,
    align: 'left'
  });
  
  // Untertitel
  if (data.fields.subtitle?.value) {
    slide.addText(data.fields.subtitle.value, {
      x: 0.5, y: 3.4, w: 9, h: 0.6,
      fontSize: 22,
      fontFace: fontBody,
      color: primaryColor,
      align: 'left'
    });
  }
}

/**
 * Aufzählungsfolie
 */
function renderBulletSlide(slide, data, tokens) {
  const primaryColor = tokens.colors.primary.value.replace('#', '');
  const accentColor = tokens.colors.accent.value.replace('#', '');
  const textColor = tokens.colors.text.value.replace('#', '');
  const fontHeading = tokens.typography.heading.fontFamilyClean;
  const fontBody = tokens.typography.body.fontFamilyClean;
  
  // Header-Linie
  slide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: 0.15,
    fill: { color: primaryColor }
  });
  
  // Headline
  slide.addText(data.fields.headline?.value || 'Überschrift', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 32,
    fontFace: fontHeading,
    color: textColor,
    bold: true
  });
  
  // Aufzählungspunkte
  const bullets = data.fields.bullets?.value || [];
  const bulletTexts = bullets.map(text => ({
    text: text,
    options: {
      fontSize: 20,
      fontFace: fontBody,
      color: textColor,
      bullet: { 
        type: 'bullet',
        color: accentColor
      },
      paraSpaceAfter: 12
    }
  }));
  
  slide.addText(bulletTexts, {
    x: 0.5, y: 1.5, w: 9, h: 3.5,
    valign: 'top'
  });
  
  // Logo klein unten rechts
  if (tokens.assets.logo) {
    slide.addImage({
      data: tokens.assets.logo,
      x: 8.5, y: 4.8, h: 0.5,
      sizing: { type: 'contain', h: 0.5 }
    });
  }
}

/**
 * Bild-Folie
 */
function renderImageSlide(slide, data, tokens) {
  const primaryColor = tokens.colors.primary.value.replace('#', '');
  const textColor = tokens.colors.text.value.replace('#', '');
  const fontHeading = tokens.typography.heading.fontFamilyClean;
  
  // Header-Linie
  slide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: 0.15,
    fill: { color: primaryColor }
  });
  
  // Headline
  if (data.fields.headline?.value) {
    slide.addText(data.fields.headline.value, {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 28,
      fontFace: fontHeading,
      color: textColor,
      bold: true
    });
  }
  
  // Bild (Platzhalter oder echtes Bild)
  if (data.fields.image?.value) {
    slide.addImage({
      data: data.fields.image.value,
      x: 1, y: 1.5, w: 8, h: 3.5,
      sizing: { type: 'contain', w: 8, h: 3.5 }
    });
  } else {
    // Platzhalter
    slide.addShape('rect', {
      x: 1, y: 1.5, w: 8, h: 3.5,
      fill: { color: 'EEEEEE' },
      line: { color: 'CCCCCC', width: 1, dashType: 'dash' }
    });
    slide.addText('Bild hier einfügen', {
      x: 1, y: 2.8, w: 8, h: 0.6,
      fontSize: 16,
      color: '999999',
      align: 'center'
    });
  }
}

/**
 * Zwei-Spalten-Folie
 */
function renderTwoColumnSlide(slide, data, tokens) {
  const primaryColor = tokens.colors.primary.value.replace('#', '');
  const textColor = tokens.colors.text.value.replace('#', '');
  const fontHeading = tokens.typography.heading.fontFamilyClean;
  const fontBody = tokens.typography.body.fontFamilyClean;
  
  // Header-Linie
  slide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: 0.15,
    fill: { color: primaryColor }
  });
  
  // Headline
  slide.addText(data.fields.headline?.value || 'Überschrift', {
    x: 0.5, y: 0.5, w: 9, h: 0.8,
    fontSize: 28,
    fontFace: fontHeading,
    color: textColor,
    bold: true
  });
  
  // Linke Spalte
  slide.addText(data.fields.leftColumn?.value || 'Linke Spalte', {
    x: 0.5, y: 1.5, w: 4.2, h: 3.5,
    fontSize: 16,
    fontFace: fontBody,
    color: textColor,
    valign: 'top'
  });
  
  // Rechte Spalte
  slide.addText(data.fields.rightColumn?.value || 'Rechte Spalte', {
    x: 5.3, y: 1.5, w: 4.2, h: 3.5,
    fontSize: 16,
    fontFace: fontBody,
    color: textColor,
    valign: 'top'
  });
}

/**
 * Abschlussfolie
 */
function renderClosingSlide(slide, data, tokens) {
  const primaryColor = tokens.colors.primary.value.replace('#', '');
  const backgroundColor = tokens.colors.primary.value.replace('#', '');
  const fontHeading = tokens.typography.heading.fontFamilyClean;
  const fontBody = tokens.typography.body.fontFamilyClean;
  
  // Voller farbiger Hintergrund
  slide.addShape('rect', {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: backgroundColor }
  });
  
  // Logo groß in der Mitte
  if (tokens.assets.logo) {
    slide.addImage({
      data: tokens.assets.logo,
      x: 3.5, y: 1, h: 1.5,
      sizing: { type: 'contain', h: 1.5 }
    });
  }
  
  // Dankestext
  slide.addText(data.fields.headline?.value || 'Vielen Dank!', {
    x: 0.5, y: 2.8, w: 9, h: 1,
    fontSize: 40,
    fontFace: fontHeading,
    color: 'FFFFFF',
    bold: true,
    align: 'center'
  });
  
  // Kontakt
  if (data.fields.contact?.value) {
    slide.addText(data.fields.contact.value, {
      x: 0.5, y: 4, w: 9, h: 0.6,
      fontSize: 18,
      fontFace: fontBody,
      color: 'FFFFFF',
      align: 'center'
    });
  }
}

/**
 * Speichert die Präsentation als Download
 */
export async function downloadPptx(pptx, filename = 'presentation.pptx') {
  await pptx.writeFile({ fileName: filename });
}

/**
 * Gibt die Präsentation als Blob zurück
 */
export async function getPptxBlob(pptx) {
  return await pptx.write({ outputType: 'blob' });
}

export default generatePptx;
