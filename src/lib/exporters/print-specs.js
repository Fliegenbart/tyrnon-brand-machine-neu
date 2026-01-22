// Print Specifications Export (CMYK, Bleed, etc.)

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

function rgbToCmyk(r, g, b) {
  // Normalize RGB values
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Calculate K (black)
  const k = 1 - Math.max(rNorm, gNorm, bNorm);

  // Handle pure black
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  // Calculate CMY
  const c = Math.round((1 - rNorm - k) / (1 - k) * 100);
  const m = Math.round((1 - gNorm - k) / (1 - k) * 100);
  const y = Math.round((1 - bNorm - k) / (1 - k) * 100);

  return { c, m, y, k: Math.round(k * 100) };
}

function hexToCmyk(hex) {
  const rgb = hexToRgb(hex);
  return rgbToCmyk(rgb[0], rgb[1], rgb[2]);
}

function findClosestPantone(hex) {
  // Simplified Pantone matching - in production, use a proper Pantone library
  const pantoneMap = {
    '#0071e3': 'PMS 2925 C',
    '#007aff': 'PMS 2925 C',
    '#000000': 'PMS Black C',
    '#ffffff': 'PMS White',
    '#ff9500': 'PMS 144 C',
    '#ff3b30': 'PMS 485 C',
    '#34c759': 'PMS 361 C',
    '#5856d6': 'PMS 2725 C'
  };

  // Find closest match
  const hexLower = hex.toLowerCase();
  if (pantoneMap[hexLower]) {
    return pantoneMap[hexLower];
  }

  // If no exact match, suggest process color
  return 'Process (CMYK)';
}

function extractFontName(fontString) {
  const match = fontString.match(/'([^']+)'/);
  return match ? match[1] : fontString.split(',')[0].trim();
}

export function exportPrintSpecs(brand) {
  const colors = {};

  // Convert all brand colors to print specs
  Object.entries(brand.colors).forEach(([name, hex]) => {
    const rgb = hexToRgb(hex);
    const cmyk = hexToCmyk(hex);
    const pantone = findClosestPantone(hex);

    colors[name] = {
      hex: hex.toUpperCase(),
      rgb: { r: rgb[0], g: rgb[1], b: rgb[2] },
      cmyk: cmyk,
      cmykString: `C${cmyk.c} M${cmyk.m} Y${cmyk.y} K${cmyk.k}`,
      pantone: pantone,
      usage: getColorUsage(name)
    };
  });

  return {
    meta: {
      brand: brand.name,
      version: "1.0",
      exportedAt: new Date().toISOString(),
      generator: "TYRN.ON Brand Engine v3.0"
    },

    colorSpace: {
      recommended: "CMYK",
      profile: "ISO Coated v2 (ECI)",
      alternative: "FOGRA39",
      note: "For digital print, sRGB may be acceptable"
    },

    colors: colors,

    typography: {
      heading: {
        fontFamily: extractFontName(brand.fonts.heading),
        recommendedSizes: {
          headline: "24-48pt",
          subheadline: "18-24pt",
          title: "14-18pt"
        },
        minSize: "10pt",
        note: "Ensure fonts are embedded or outlined for print"
      },
      body: {
        fontFamily: extractFontName(brand.fonts.body),
        recommendedSizes: {
          body: "10-12pt",
          caption: "8-9pt",
          legal: "6-8pt"
        },
        minSize: "6pt",
        lineHeight: "120-150%"
      }
    },

    blackHandling: {
      textBlack: {
        cmyk: { c: 0, m: 0, y: 0, k: 100 },
        note: "Use 100% K for small text and lines"
      },
      richBlack: {
        cmyk: { c: 40, m: 40, y: 40, k: 100 },
        note: "Use for large black areas (30mm+ square)",
        warning: "Avoid for text smaller than 24pt"
      },
      registrationBlack: {
        cmyk: { c: 100, m: 100, y: 100, k: 100 },
        warning: "Never use in artwork - registration marks only"
      }
    },

    formats: {
      businessCard: {
        size: { width: "85mm", height: "55mm" },
        bleed: "3mm",
        safeZone: "5mm",
        resolution: "300dpi"
      },
      a4: {
        size: { width: "210mm", height: "297mm" },
        bleed: "3mm",
        safeZone: "6mm",
        resolution: "300dpi"
      },
      a5: {
        size: { width: "148mm", height: "210mm" },
        bleed: "3mm",
        safeZone: "5mm",
        resolution: "300dpi"
      },
      dinLang: {
        size: { width: "210mm", height: "99mm" },
        bleed: "3mm",
        safeZone: "5mm",
        resolution: "300dpi",
        note: "Standard flyer/envelope size"
      },
      poster_a3: {
        size: { width: "297mm", height: "420mm" },
        bleed: "5mm",
        safeZone: "10mm",
        resolution: "300dpi"
      },
      poster_a2: {
        size: { width: "420mm", height: "594mm" },
        bleed: "5mm",
        safeZone: "10mm",
        resolution: "150-300dpi",
        note: "150dpi acceptable for viewing distance > 50cm"
      }
    },

    fileSpecs: {
      preferred: ["PDF/X-4", "PDF/X-1a"],
      acceptable: ["TIFF", "EPS"],
      avoid: ["JPG", "PNG", "RGB PDFs"],
      requirements: [
        "All fonts embedded or converted to outlines",
        "Images at 300dpi minimum",
        "No RGB images",
        "No spot colors unless specified",
        "Bleed extended to edge",
        "Crop marks included"
      ]
    },

    minimumSizes: {
      lines: "0.25pt (0.1mm)",
      positiveText: "6pt",
      reverseText: "8pt",
      logo: "10mm width minimum"
    },

    guidelines: [
      "Always use CMYK color space",
      "Embed all fonts or convert to outlines",
      "Include 3mm bleed on all sides",
      "Keep important elements 5mm from trim edge",
      "Use 100% K for black text",
      "Export as PDF/X-4 for best compatibility",
      "Include crop marks in final output"
    ]
  };
}

function getColorUsage(colorName) {
  const usageMap = {
    primary: "Main brand color - headers, CTAs, key elements",
    secondary: "Supporting color - subheadings, accents",
    accent: "Highlights, buttons, call-to-action elements",
    background: "Page backgrounds, large areas",
    text: "Body text, paragraphs, general copy"
  };
  return usageMap[colorName] || "General use";
}
