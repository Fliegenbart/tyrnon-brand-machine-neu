// ============================================
// IMAGE ANALYZER - Extract Colors and Properties from Images
// ============================================

/**
 * Analyze an image file and extract colors and properties
 * @param {File} file - Image file to analyze
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeImage(file) {
  const img = await loadImage(file);
  const canvas = drawToCanvas(img);
  const context = canvas.getContext('2d');

  const analysis = {
    source: file.name,
    type: 'image',
    dimensions: {
      width: img.width,
      height: img.height,
      aspectRatio: img.width / img.height
    },
    colors: {
      dominant: [],
      palette: []
    },
    properties: {
      hasTransparency: false,
      isLikelyLogo: false,
      suggestedMinSize: 0
    },
    confidence: 0.7,
    patterns: {
      colorUsage: {}
    }
  };

  // Check for transparency (PNG)
  analysis.properties.hasTransparency = checkTransparency(canvas, context);

  // Extract colors
  const colors = extractDominantColors(canvas, context);
  analysis.colors.palette = colors;
  analysis.colors.dominant = colors.slice(0, 3);

  // Build color usage pattern
  for (const color of colors) {
    analysis.patterns.colorUsage[color.hex] = {
      frequency: color.percentage,
      confidence: 0.8
    };
  }

  // Detect if likely a logo
  analysis.properties.isLikelyLogo = detectLogoCharacteristics(
    file.name,
    file.size,
    colors.length,
    analysis.properties.hasTransparency,
    analysis.dimensions.aspectRatio
  );

  // Calculate suggested minimum size
  analysis.properties.suggestedMinSize = Math.max(
    Math.round(img.width * 0.5),
    32
  );

  // Adjust confidence based on characteristics
  if (analysis.properties.isLikelyLogo) {
    analysis.confidence = 0.9;
  }

  return analysis;
}

/**
 * Load image from file
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Draw image to canvas for analysis
 */
function drawToCanvas(img) {
  // Scale down large images for faster processing
  const maxSize = 300;
  let width = img.width;
  let height = img.height;

  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, width, height);

  return canvas;
}

/**
 * Check if image has transparency
 */
function checkTransparency(canvas, context) {
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Check corners and edges for transparency
  const checkPoints = [
    0, // top-left
    (canvas.width - 1) * 4, // top-right
    (canvas.height - 1) * canvas.width * 4, // bottom-left
    ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4 // bottom-right
  ];

  for (const point of checkPoints) {
    if (data[point + 3] < 255) {
      return true;
    }
  }

  // Sample random pixels
  for (let i = 0; i < data.length; i += 400) {
    if (data[i + 3] < 250) {
      return true;
    }
  }

  return false;
}

/**
 * Extract dominant colors from canvas
 */
function extractDominantColors(canvas, context, numColors = 8) {
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const colorCounts = {};

  // Sample every nth pixel for performance
  const step = Math.max(1, Math.floor(data.length / 4 / 1000));

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    // Quantize to reduce color variety
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;

    const key = `${qr},${qg},${qb}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  // Convert to array and sort
  const totalPixels = Object.values(colorCounts).reduce((a, b) => a + b, 0);

  const sortedColors = Object.entries(colorCounts)
    .map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number);
      return {
        r, g, b,
        hex: rgbToHex(r, g, b),
        count,
        percentage: Math.round((count / totalPixels) * 100)
      };
    })
    .filter(c => {
      // Filter out near-white and near-black
      const lum = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
      return lum > 20 && lum < 240;
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, numColors);

  return sortedColors;
}

/**
 * Detect if image is likely a logo
 */
function detectLogoCharacteristics(filename, fileSize, colorCount, hasTransparency, aspectRatio) {
  let score = 0;

  // Filename hints
  const name = filename.toLowerCase();
  if (name.includes('logo')) score += 3;
  if (name.includes('brand')) score += 2;
  if (name.includes('icon')) score += 1;
  if (name.includes('mark')) score += 1;

  // Transparency is common in logos
  if (hasTransparency) score += 2;

  // Logos typically have few colors
  if (colorCount <= 4) score += 2;
  if (colorCount <= 2) score += 1;

  // Small file size
  if (fileSize < 50000) score += 1;
  if (fileSize < 20000) score += 1;

  // Aspect ratio close to square or wide (common for logos)
  if (aspectRatio >= 0.5 && aspectRatio <= 3) score += 1;

  return score >= 4;
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

export default analyzeImage;
