// ============================================
// FONT ANALYZER - Extract font metadata
// ============================================

/**
 * Analyze a font file and extract metadata
 * @param {File} file - Font file (.ttf, .otf, .woff, .woff2)
 * @returns {Promise<Object>} Font analysis results
 */
export async function analyzeFont(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  const analysis = {
    source: file.name,
    type: ext,
    name: extractFontName(file.name),
    format: getFontFormat(ext),
    size: file.size,
    dataUrl: null,
    confidence: 0.9
  };

  // Convert to data URL for preview/usage
  try {
    const blob = new Blob([arrayBuffer], { type: getFontMimeType(ext) });
    analysis.dataUrl = await blobToDataUrl(blob);
  } catch (e) {
    console.warn('Could not convert font to data URL:', e);
  }

  // Try to extract font name from file (basic parsing)
  try {
    const fontName = await extractFontNameFromData(arrayBuffer, ext);
    if (fontName) {
      analysis.name = fontName;
    }
  } catch (e) {
    // Use filename as fallback
  }

  return analysis;
}

/**
 * Extract font name from filename
 */
function extractFontName(filename) {
  // Remove extension
  let name = filename.replace(/\.(ttf|otf|woff2?)/i, '');

  // Remove common suffixes
  name = name.replace(/[-_](Regular|Bold|Italic|Light|Medium|SemiBold|ExtraBold|Black|Thin|Heavy)/gi, '');

  // Convert dashes/underscores to spaces
  name = name.replace(/[-_]/g, ' ');

  // Capitalize first letters
  name = name.replace(/\b\w/g, l => l.toUpperCase());

  return name.trim();
}

/**
 * Get font format description
 */
function getFontFormat(ext) {
  const formats = {
    'ttf': 'TrueType',
    'otf': 'OpenType',
    'woff': 'Web Open Font Format',
    'woff2': 'Web Open Font Format 2'
  };
  return formats[ext] || 'Unknown';
}

/**
 * Get MIME type for font
 */
function getFontMimeType(ext) {
  const mimeTypes = {
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'woff': 'font/woff',
    'woff2': 'font/woff2'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Try to extract actual font name from font file data
 * This is a simplified parser - full parsing would require a library
 */
async function extractFontNameFromData(arrayBuffer, ext) {
  const view = new DataView(arrayBuffer);

  // Only attempt for TTF/OTF (they have similar structure)
  if (ext !== 'ttf' && ext !== 'otf') {
    return null;
  }

  try {
    // Check for valid font signature
    const signature = view.getUint32(0, false);

    // TTF: 0x00010000 or 'true', OTF: 'OTTO'
    if (signature !== 0x00010000 && signature !== 0x74727565 && signature !== 0x4F54544F) {
      return null;
    }

    // Find number of tables
    const numTables = view.getUint16(4, false);

    // Search for 'name' table
    let nameTableOffset = 0;
    for (let i = 0; i < numTables; i++) {
      const tableOffset = 12 + i * 16;
      const tag = String.fromCharCode(
        view.getUint8(tableOffset),
        view.getUint8(tableOffset + 1),
        view.getUint8(tableOffset + 2),
        view.getUint8(tableOffset + 3)
      );

      if (tag === 'name') {
        nameTableOffset = view.getUint32(tableOffset + 8, false);
        break;
      }
    }

    if (nameTableOffset === 0) return null;

    // Parse name table
    const nameCount = view.getUint16(nameTableOffset + 2, false);
    const stringOffset = view.getUint16(nameTableOffset + 4, false);

    // Look for name ID 4 (Full font name) or 1 (Font family)
    for (let i = 0; i < nameCount; i++) {
      const recordOffset = nameTableOffset + 6 + i * 12;
      const platformID = view.getUint16(recordOffset, false);
      const nameID = view.getUint16(recordOffset + 6, false);

      // We want nameID 4 (full name) or 1 (family), prefer Windows platform (3)
      if ((nameID === 4 || nameID === 1) && platformID === 3) {
        const length = view.getUint16(recordOffset + 8, false);
        const offset = view.getUint16(recordOffset + 10, false);

        const stringStart = nameTableOffset + stringOffset + offset;
        let name = '';

        // Windows names are UTF-16BE
        for (let j = 0; j < length; j += 2) {
          const charCode = view.getUint16(stringStart + j, false);
          if (charCode > 0) {
            name += String.fromCharCode(charCode);
          }
        }

        if (name.length > 0) {
          return name;
        }
      }
    }
  } catch (e) {
    // Parsing failed, return null
  }

  return null;
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default analyzeFont;
