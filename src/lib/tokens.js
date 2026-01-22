// ============================================
// DESIGN TOKENS - Single Source of Truth
// ============================================

/**
 * Konvertiert ein Brand-Objekt in standardisierte Design Tokens
 * Diese Tokens sind das Master-Format für alle Exporte
 */
export function brandToTokens(brand) {
  return {
    meta: {
      id: brand.id,
      name: brand.name,
      version: '1.0',
      created: new Date().toISOString()
    },
    
    colors: {
      primary: {
        value: brand.colors.primary,
        rgb: hexToRgb(brand.colors.primary),
        description: 'Hauptfarbe für CTAs, Links, Akzente'
      },
      secondary: {
        value: brand.colors.secondary,
        rgb: hexToRgb(brand.colors.secondary),
        description: 'Sekundärfarbe für Hintergründe, Hover-States'
      },
      accent: {
        value: brand.colors.accent,
        rgb: hexToRgb(brand.colors.accent),
        description: 'Akzentfarbe für Highlights, Badges'
      },
      background: {
        value: brand.colors.background,
        rgb: hexToRgb(brand.colors.background),
        description: 'Haupthintergrund'
      },
      text: {
        value: brand.colors.text,
        rgb: hexToRgb(brand.colors.text),
        description: 'Haupttextfarbe'
      },
      // Automatisch generierte Varianten
      primaryLight: {
        value: lightenColor(brand.colors.primary, 0.2),
        rgb: hexToRgb(lightenColor(brand.colors.primary, 0.2)),
        description: 'Aufgehellte Primärfarbe'
      },
      primaryDark: {
        value: darkenColor(brand.colors.primary, 0.2),
        rgb: hexToRgb(darkenColor(brand.colors.primary, 0.2)),
        description: 'Abgedunkelte Primärfarbe'
      },
      textMuted: {
        value: brand.colors.text + '80',
        description: 'Gedämpfte Textfarbe (50% Opacity)'
      }
    },
    
    typography: {
      heading: {
        fontFamily: brand.fonts.heading,
        fontFamilyClean: extractFontName(brand.fonts.heading),
        weights: [600, 700],
        description: 'Für Headlines, Titel, H1-H6'
      },
      body: {
        fontFamily: brand.fonts.body,
        fontFamilyClean: extractFontName(brand.fonts.body),
        weights: [400, 500, 600],
        description: 'Für Fließtext, UI-Elemente'
      },
      // Typografie-Skala
      scale: {
        h1: { size: 48, lineHeight: 1.1, weight: 700 },
        h2: { size: 36, lineHeight: 1.2, weight: 700 },
        h3: { size: 28, lineHeight: 1.3, weight: 600 },
        h4: { size: 22, lineHeight: 1.4, weight: 600 },
        body: { size: 16, lineHeight: 1.6, weight: 400 },
        small: { size: 14, lineHeight: 1.5, weight: 400 },
        caption: { size: 12, lineHeight: 1.4, weight: 400 }
      }
    },
    
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
      xxxl: 64
    },
    
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999
    },
    
    voice: {
      tone: brand.voice.tone,
      formality: brand.voice.formality,
      tagline: brand.voice.tagline,
      dos: brand.voice.dos ? brand.voice.dos.split(',').map(s => s.trim()).filter(Boolean) : [],
      donts: brand.voice.donts ? brand.voice.donts.split(',').map(s => s.trim()).filter(Boolean) : []
    },
    
    assets: {
      logo: brand.logo,
      logoAlt: `${brand.name} Logo`
    }
  };
}

/**
 * Exportiert Tokens als CSS Variables
 */
export function tokensToCss(tokens) {
  return `:root {
  /* Colors */
  --color-primary: ${tokens.colors.primary.value};
  --color-primary-rgb: ${tokens.colors.primary.rgb.join(', ')};
  --color-primary-light: ${tokens.colors.primaryLight.value};
  --color-primary-dark: ${tokens.colors.primaryDark.value};
  --color-secondary: ${tokens.colors.secondary.value};
  --color-accent: ${tokens.colors.accent.value};
  --color-background: ${tokens.colors.background.value};
  --color-text: ${tokens.colors.text.value};
  --color-text-muted: ${tokens.colors.textMuted.value};
  
  /* Typography */
  --font-heading: ${tokens.typography.heading.fontFamily};
  --font-body: ${tokens.typography.body.fontFamily};
  
  /* Font Sizes */
  --text-h1: ${tokens.typography.scale.h1.size}px;
  --text-h2: ${tokens.typography.scale.h2.size}px;
  --text-h3: ${tokens.typography.scale.h3.size}px;
  --text-h4: ${tokens.typography.scale.h4.size}px;
  --text-body: ${tokens.typography.scale.body.size}px;
  --text-small: ${tokens.typography.scale.small.size}px;
  --text-caption: ${tokens.typography.scale.caption.size}px;
  
  /* Spacing */
  --space-xs: ${tokens.spacing.xs}px;
  --space-sm: ${tokens.spacing.sm}px;
  --space-md: ${tokens.spacing.md}px;
  --space-lg: ${tokens.spacing.lg}px;
  --space-xl: ${tokens.spacing.xl}px;
  --space-xxl: ${tokens.spacing.xxl}px;
  
  /* Border Radius */
  --radius-sm: ${tokens.borderRadius.sm}px;
  --radius-md: ${tokens.borderRadius.md}px;
  --radius-lg: ${tokens.borderRadius.lg}px;
  --radius-xl: ${tokens.borderRadius.xl}px;
}`;
}

/**
 * Exportiert Tokens als Tailwind Config
 */
export function tokensToTailwind(tokens) {
  return `// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '${tokens.colors.primary.value}',
          light: '${tokens.colors.primaryLight.value}',
          dark: '${tokens.colors.primaryDark.value}',
        },
        secondary: '${tokens.colors.secondary.value}',
        accent: '${tokens.colors.accent.value}',
      },
      fontFamily: {
        heading: ['${tokens.typography.heading.fontFamilyClean}', 'sans-serif'],
        body: ['${tokens.typography.body.fontFamilyClean}', 'sans-serif'],
      },
    },
  },
}`;
}

/**
 * Exportiert Tokens als JSON (für Figma, andere Tools)
 */
export function tokensToJson(tokens) {
  return JSON.stringify(tokens, null, 2);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function lightenColor(hex, amount) {
  const rgb = hexToRgb(hex);
  const lightened = rgb.map(c => c + (255 - c) * amount);
  return rgbToHex(...lightened);
}

function darkenColor(hex, amount) {
  const rgb = hexToRgb(hex);
  const darkened = rgb.map(c => c * (1 - amount));
  return rgbToHex(...darkened);
}

function extractFontName(fontFamily) {
  // "'Space Grotesk', sans-serif" → "Space Grotesk"
  const match = fontFamily.match(/['"]([^'"]+)['"]/);
  return match ? match[1] : fontFamily.split(',')[0].trim();
}

export { hexToRgb, rgbToHex, lightenColor, darkenColor, extractFontName };
