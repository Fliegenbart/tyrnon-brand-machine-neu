// ============================================
// QR CODE GENERATOR
// ============================================

/**
 * Generiert einen QR-Code als SVG
 * Basiert auf einer einfachen QR-Code Matrix Implementierung
 */
export function generateQRCode(text, options = {}) {
  const {
    size = 200,
    darkColor = '#000000',
    lightColor = '#ffffff',
    margin = 4
  } = options;

  // Für komplexe QR-Codes würde man normalerweise eine Library nutzen
  // Hier generieren wir einen vereinfachten QR-Code-ähnlichen Pattern
  // In Produktion: qrcode oder qr.js Library verwenden
  
  const matrix = generateQRMatrix(text);
  const moduleCount = matrix.length;
  const moduleSize = (size - margin * 2) / moduleCount;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  
  // Hintergrund
  svg += `<rect width="${size}" height="${size}" fill="${lightColor}"/>`;
  
  // Module zeichnen
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (matrix[row][col]) {
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * Generiert QR-Code als Data URL (für Einbettung in Bilder/PDFs)
 */
export function generateQRCodeDataUrl(text, options = {}) {
  const svg = generateQRCode(text, options);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generiert QR-Code als Canvas (für weitere Verarbeitung)
 */
export async function generateQRCodeCanvas(text, options = {}) {
  const { size = 200 } = options;
  const svg = generateQRCode(text, options);
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const img = new Image();
  img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
  
  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
  });
}

/**
 * Generiert QR-Code als PNG Data URL
 */
export async function generateQRCodePng(text, options = {}) {
  const canvas = await generateQRCodeCanvas(text, options);
  return canvas.toDataURL('image/png');
}

/**
 * Vereinfachte QR-Matrix Generierung
 * Für echte QR-Codes sollte eine Library wie 'qrcode' verwendet werden
 */
function generateQRMatrix(text) {
  // Bestimme Größe basierend auf Textlänge
  const baseSize = 21; // QR Version 1
  const extraModules = Math.ceil(text.length / 10) * 4;
  const size = Math.min(baseSize + extraModules, 41); // Max Version 6
  
  // Matrix initialisieren
  const matrix = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Finder Patterns (die drei großen Quadrate in den Ecken)
  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, size - 7, 0);
  addFinderPattern(matrix, 0, size - 7);
  
  // Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
  
  // Daten encodieren (vereinfacht)
  const dataArea = getDataArea(matrix, size);
  const binaryData = textToBinary(text);
  
  let dataIndex = 0;
  for (const [row, col] of dataArea) {
    if (dataIndex < binaryData.length) {
      matrix[row][col] = binaryData[dataIndex] === '1';
      dataIndex++;
    } else {
      // Padding mit Muster
      matrix[row][col] = (row + col) % 3 === 0;
    }
  }
  
  return matrix;
}

/**
 * Fügt ein Finder Pattern (7x7 Quadrat) hinzu
 */
function addFinderPattern(matrix, startRow, startCol) {
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const isOuter = row === 0 || row === 6 || col === 0 || col === 6;
      const isInner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
      matrix[startRow + row][startCol + col] = isOuter || isInner;
    }
  }
  
  // Separator (weiße Linie um Finder Pattern)
  for (let i = 0; i < 8; i++) {
    if (startRow + 7 < matrix.length) matrix[startRow + 7][startCol + i] = false;
    if (startCol + 7 < matrix.length) matrix[startRow + i][startCol + 7] = false;
  }
}

/**
 * Ermittelt verfügbare Datenbereiche
 */
function getDataArea(matrix, size) {
  const dataPositions = [];
  
  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // Skip timing pattern
    
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const currentCol = col - c;
        if (currentCol >= 0 && !isReserved(row, currentCol, size)) {
          dataPositions.push([row, currentCol]);
        }
      }
    }
  }
  
  return dataPositions;
}

/**
 * Prüft ob Position reserviert ist (Finder Pattern etc.)
 */
function isReserved(row, col, size) {
  // Finder Patterns + Separator
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= size - 8) return true;
  if (row >= size - 8 && col < 9) return true;
  
  // Timing Patterns
  if (row === 6 || col === 6) return true;
  
  return false;
}

/**
 * Konvertiert Text zu Binärstring
 */
function textToBinary(text) {
  return text.split('').map(char => 
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');
}

/**
 * Vordefinierte QR-Code Typen für häufige Anwendungsfälle
 */
export const qrCodeTypes = {
  url: {
    name: 'Website URL',
    icon: '🌐',
    format: (value) => value.startsWith('http') ? value : `https://${value}`,
    placeholder: 'https://beispiel.de'
  },
  email: {
    name: 'E-Mail',
    icon: '✉️',
    format: (value) => `mailto:${value}`,
    placeholder: 'email@beispiel.de'
  },
  phone: {
    name: 'Telefon',
    icon: '📞',
    format: (value) => `tel:${value.replace(/\s/g, '')}`,
    placeholder: '+49 123 456789'
  },
  sms: {
    name: 'SMS',
    icon: '💬',
    format: (value, message = '') => `sms:${value}${message ? `?body=${encodeURIComponent(message)}` : ''}`,
    placeholder: '+49 123 456789'
  },
  wifi: {
    name: 'WLAN',
    icon: '📶',
    format: (ssid, password, encryption = 'WPA') => 
      `WIFI:T:${encryption};S:${ssid};P:${password};;`,
    placeholder: 'Netzwerkname'
  },
  vcard: {
    name: 'Visitenkarte (vCard)',
    icon: '👤',
    format: (data) => {
      const { name, org, phone, email, url } = data;
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${name || ''}`,
        org ? `ORG:${org}` : '',
        phone ? `TEL:${phone}` : '',
        email ? `EMAIL:${email}` : '',
        url ? `URL:${url}` : '',
        'END:VCARD'
      ].filter(Boolean).join('\n');
    }
  },
  location: {
    name: 'Standort',
    icon: '📍',
    format: (lat, lng, label = '') => 
      `geo:${lat},${lng}${label ? `?q=${encodeURIComponent(label)}` : ''}`,
    placeholder: '52.5200,13.4050'
  }
};

/**
 * Generiert vCard QR-Code aus Visitenkarten-Daten
 */
export function generateVCardQR(content, brand, options = {}) {
  const fields = content?.fields || {};
  
  const vcard = qrCodeTypes.vcard.format({
    name: fields.name?.value || '',
    org: brand.name,
    phone: fields.phone?.value || '',
    email: fields.email?.value || '',
    url: fields.website?.value || ''
  });
  
  return generateQRCode(vcard, {
    darkColor: brand.colors.primary,
    ...options
  });
}

export default {
  generateQRCode,
  generateQRCodeDataUrl,
  generateQRCodePng,
  generateVCardQR,
  qrCodeTypes
};
