// ============================================
// PDF ANALYZER - Extract Colors from PDF Documents
// ============================================
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Analyze a PDF file and extract dominant colors
 * @param {File} file - PDF file to analyze
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzePdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const analysis = {
    source: file.name,
    type: 'pdf',
    pageCount: pdf.numPages,
    colors: {
      dominant: [],
      accent: [],
      background: []
    },
    confidence: 0,
    patterns: {
      colorUsage: {}
    }
  };

  // Analyze up to 5 pages for color extraction
  const pagesToAnalyze = Math.min(pdf.numPages, 5);
  const allColors = [];

  for (let i = 1; i <= pagesToAnalyze; i++) {
    try {
      const page = await pdf.getPage(i);
      const pageColors = await extractColorsFromPage(page);
      allColors.push(...pageColors);
    } catch (error) {
      console.warn(`Error analyzing page ${i}:`, error);
    }
  }

  // Cluster colors to find dominant ones
  const clusteredColors = clusterColors(allColors);

  // Categorize colors
  for (const color of clusteredColors) {
    const luminance = getLuminance(color.hex);

    if (luminance > 240) {
      analysis.colors.background.push(color);
    } else if (luminance < 50) {
      // Very dark colors - likely text
    } else if (color.count > clusteredColors[0].count * 0.3) {
      analysis.colors.dominant.push(color);
    } else {
      analysis.colors.accent.push(color);
    }

    analysis.patterns.colorUsage[color.hex] = {
      frequency: color.count,
      confidence: Math.min(color.count / 100, 1.0)
    };
  }

  // Calculate overall confidence based on consistency
  const totalColors = clusteredColors.length;
  analysis.confidence = totalColors > 0 && totalColors < 20 ? 0.8 : 0.5;

  return analysis;
}

/**
 * Extract colors from a single PDF page using canvas
 */
async function extractColorsFromPage(page) {
  const scale = 0.5; // Lower scale for faster processing
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  // Sample pixels from the canvas
  return sampleCanvasColors(canvas, 500);
}

/**
 * Sample random pixels from canvas and extract colors
 */
function sampleCanvasColors(canvas, sampleSize) {
  const context = canvas.getContext('2d');
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const colors = [];

  const step = Math.max(1, Math.floor(data.length / 4 / sampleSize));

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    colors.push({ r, g, b });
  }

  return colors;
}

/**
 * Cluster similar colors using simplified k-means
 */
function clusterColors(colors, numClusters = 10) {
  if (colors.length === 0) return [];

  // Quantize colors to reduce variety
  const quantized = {};

  for (const color of colors) {
    // Quantize to nearest 16 values
    const qr = Math.round(color.r / 16) * 16;
    const qg = Math.round(color.g / 16) * 16;
    const qb = Math.round(color.b / 16) * 16;
    const key = `${qr},${qg},${qb}`;

    if (!quantized[key]) {
      quantized[key] = { r: qr, g: qg, b: qb, count: 0 };
    }
    quantized[key].count++;
  }

  // Convert to array and sort by frequency
  const sorted = Object.values(quantized)
    .filter(c => {
      // Filter out near-white and near-black
      const lum = getLuminance(rgbToHex(c.r, c.g, c.b));
      return lum > 10 && lum < 250;
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, numClusters);

  // Convert to hex and return
  return sorted.map(c => ({
    hex: rgbToHex(c.r, c.g, c.b),
    r: c.r,
    g: c.g,
    b: c.b,
    count: c.count
  }));
}

/**
 * Calculate luminance of a hex color
 */
function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.min(255, Math.max(0, x)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export default analyzePdf;
