// ============================================
// PPTX PARSER - Extract Brand Assets from PowerPoint
// ============================================
import JSZip from 'jszip';

/**
 * Parst eine PPTX-Datei und extrahiert Brand-Elemente
 */
export async function parsePptx(file) {
  const zip = await JSZip.loadAsync(file);

  const brand = {
    colors: new Set(),
    fonts: new Set(),
    images: [],
    name: file.name.replace('.pptx', '').replace('.ppt', '')
  };

  // Theme-Farben extrahieren
  const themeFile = zip.file(/ppt\/theme\/theme\d+\.xml/);
  if (themeFile.length > 0) {
    const themeXml = await themeFile[0].async('text');
    extractThemeColors(themeXml, brand);
  }

  // Slide-Master für Schriftarten
  const masterFiles = zip.file(/ppt\/slideMasters\/slideMaster\d+\.xml/);
  for (const master of masterFiles) {
    const masterXml = await master.async('text');
    extractFonts(masterXml, brand);
  }

  // Slides durchgehen für Farben und Bilder
  const slideFiles = zip.file(/ppt\/slides\/slide\d+\.xml/);
  for (const slide of slideFiles) {
    const slideXml = await slide.async('text');
    extractSlideColors(slideXml, brand);
  }

  // Bilder extrahieren
  const mediaFiles = zip.file(/ppt\/media\/.+/);
  for (const media of mediaFiles) {
    const filename = media.name.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
      const blob = await media.async('blob');
      const dataUrl = await blobToDataUrl(blob, ext);
      brand.images.push({
        name: filename,
        data: dataUrl,
        isLogo: isLikelyLogo(filename, blob.size)
      });
    }
  }

  return normalizeBrand(brand);
}

/**
 * Extrahiert Farben aus dem Theme
 */
function extractThemeColors(xml, brand) {
  // Scheme Colors (dk1, lt1, dk2, lt2, accent1-6)
  const schemeColorRegex = /<a:(dk1|lt1|dk2|lt2|accent1|accent2|accent3|accent4|accent5|accent6)>[\s\S]*?<a:srgbClr val="([A-Fa-f0-9]{6})"/g;
  let match;
  while ((match = schemeColorRegex.exec(xml)) !== null) {
    brand.colors.add('#' + match[2].toLowerCase());
  }

  // System Colors
  const sysColorRegex = /lastClr="([A-Fa-f0-9]{6})"/g;
  while ((match = sysColorRegex.exec(xml)) !== null) {
    brand.colors.add('#' + match[1].toLowerCase());
  }
}

/**
 * Extrahiert Schriftarten
 */
function extractFonts(xml, brand) {
  const fontRegex = /typeface="([^"]+)"/g;
  let match;
  while ((match = fontRegex.exec(xml)) !== null) {
    const font = match[1];
    if (!font.startsWith('+') && font.length > 1) {
      brand.fonts.add(font);
    }
  }
}

/**
 * Extrahiert Farben aus Slides
 */
function extractSlideColors(xml, brand) {
  // RGB Colors
  const rgbRegex = /<a:srgbClr val="([A-Fa-f0-9]{6})"/g;
  let match;
  while ((match = rgbRegex.exec(xml)) !== null) {
    brand.colors.add('#' + match[1].toLowerCase());
  }
}

/**
 * Konvertiert Blob zu Data URL
 */
function blobToDataUrl(blob, ext) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

/**
 * Heuristik: Ist das Bild wahrscheinlich ein Logo?
 */
function isLikelyLogo(filename, size) {
  const name = filename.toLowerCase();
  if (name.includes('logo')) return true;
  if (name.includes('brand')) return true;
  if (name.includes('icon')) return true;
  // Kleine Bilder sind oft Logos
  if (size < 100000) return true;
  return false;
}

/**
 * Normalisiert die extrahierten Daten zu einem Brand-Objekt
 */
function normalizeBrand(rawBrand) {
  const colors = Array.from(rawBrand.colors);
  const fonts = Array.from(rawBrand.fonts);

  // Farben nach Helligkeit sortieren
  const sortedColors = colors
    .filter(c => c !== '#000000' && c !== '#ffffff')
    .sort((a, b) => getLuminance(a) - getLuminance(b));

  // Primärfarbe = dunkelste nicht-schwarze Farbe
  // Akzentfarbe = mittlere Farbe
  const primary = sortedColors[0] || '#2563eb';
  const secondary = sortedColors[1] || darken(primary, 20);
  const accent = sortedColors[Math.floor(sortedColors.length / 2)] || '#f59e0b';

  // Logo finden (erstes wahrscheinliches Logo)
  const logo = rawBrand.images.find(img => img.isLogo)?.data || null;

  return {
    name: rawBrand.name,
    colors: {
      primary,
      secondary,
      accent,
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: fonts[0] ? `'${fonts[0]}', sans-serif` : "'Space Grotesk', sans-serif",
      body: fonts[1] || fonts[0] ? `'${fonts[1] || fonts[0]}', sans-serif` : "'Inter', sans-serif"
    },
    voice: {
      tone: 'professional',
      formality: 'sie',
      tagline: '',
      dos: '',
      donts: ''
    },
    logo,
    extractedAssets: {
      allColors: colors,
      allFonts: fonts,
      allImages: rawBrand.images
    }
  };
}

/**
 * Berechnet Helligkeit einer Farbe
 */
function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function darken(hex, percent) {
  const rgb = hexToRgb(hex);
  const factor = 1 - percent / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default parsePptx;
