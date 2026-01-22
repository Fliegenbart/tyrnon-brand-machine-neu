// Figma Variables Export (W3C Design Tokens Format)

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: 1
  } : { r: 0, g: 0, b: 0, a: 1 };
}

function generateColorScale(hex) {
  const rgb = hexToRgbArray(hex);
  const scale = {};

  for (let i = 50; i <= 900; i += i < 100 ? 50 : 100) {
    const factor = i / 500;
    if (i < 500) {
      const tint = rgb.map(c => Math.round(c + (255 - c) * (1 - factor)));
      scale[i] = rgbArrayToHex(tint);
    } else if (i > 500) {
      const shade = rgb.map(c => Math.round(c * (1 - (factor - 1) * 0.5)));
      scale[i] = rgbArrayToHex(shade);
    } else {
      scale[i] = hex;
    }
  }

  return scale;
}

function hexToRgbArray(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

function rgbArrayToHex(rgb) {
  return '#' + rgb.map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
}

export function exportFigmaVariables(brand) {
  const primaryScale = generateColorScale(brand.colors.primary);
  const secondaryScale = generateColorScale(brand.colors.secondary);

  return {
    // W3C Design Tokens Format
    "$schema": "https://design-tokens.github.io/community-group/format/",
    "name": brand.name,
    "version": "1.0.0",

    // Color primitives
    "color": {
      "primary": {
        "$type": "color",
        "50": { "$value": primaryScale[50] },
        "100": { "$value": primaryScale[100] },
        "200": { "$value": primaryScale[200] },
        "300": { "$value": primaryScale[300] },
        "400": { "$value": primaryScale[400] },
        "500": { "$value": primaryScale[500], "$description": "Primary brand color" },
        "600": { "$value": primaryScale[600] },
        "700": { "$value": primaryScale[700] },
        "800": { "$value": primaryScale[800] },
        "900": { "$value": primaryScale[900] }
      },
      "secondary": {
        "$type": "color",
        "50": { "$value": secondaryScale[50] },
        "100": { "$value": secondaryScale[100] },
        "200": { "$value": secondaryScale[200] },
        "300": { "$value": secondaryScale[300] },
        "400": { "$value": secondaryScale[400] },
        "500": { "$value": secondaryScale[500], "$description": "Secondary brand color" },
        "600": { "$value": secondaryScale[600] },
        "700": { "$value": secondaryScale[700] },
        "800": { "$value": secondaryScale[800] },
        "900": { "$value": secondaryScale[900] }
      },
      "accent": {
        "$type": "color",
        "$value": brand.colors.accent,
        "$description": "Accent color for highlights and CTAs"
      },
      "background": {
        "$type": "color",
        "default": { "$value": brand.colors.background },
        "subtle": { "$value": brand.colors.background + "f5" }
      },
      "text": {
        "$type": "color",
        "default": { "$value": brand.colors.text },
        "muted": { "$value": brand.colors.text + "80" },
        "subtle": { "$value": brand.colors.text + "60" }
      }
    },

    // Typography
    "typography": {
      "fontFamily": {
        "display": {
          "$type": "fontFamily",
          "$value": brand.fonts.heading.split(',')[0].replace(/'/g, '').trim(),
          "$description": "Headlines and display text"
        },
        "body": {
          "$type": "fontFamily",
          "$value": brand.fonts.body.split(',')[0].replace(/'/g, '').trim(),
          "$description": "Body text and UI elements"
        }
      },
      "fontSize": {
        "$type": "dimension",
        "2xs": { "$value": "10px" },
        "xs": { "$value": "12px" },
        "sm": { "$value": "14px" },
        "base": { "$value": "16px" },
        "lg": { "$value": "18px" },
        "xl": { "$value": "20px" },
        "2xl": { "$value": "24px" },
        "3xl": { "$value": "30px" },
        "4xl": { "$value": "36px" },
        "5xl": { "$value": "48px" },
        "6xl": { "$value": "60px" },
        "7xl": { "$value": "72px" }
      },
      "fontWeight": {
        "$type": "fontWeight",
        "regular": { "$value": 400 },
        "medium": { "$value": 500 },
        "semibold": { "$value": 600 },
        "bold": { "$value": 700 }
      },
      "lineHeight": {
        "$type": "number",
        "tight": { "$value": 1.1 },
        "snug": { "$value": 1.2 },
        "normal": { "$value": 1.5 },
        "relaxed": { "$value": 1.6 },
        "loose": { "$value": 2 }
      }
    },

    // Spacing
    "spacing": {
      "$type": "dimension",
      "0": { "$value": "0px" },
      "1": { "$value": "4px" },
      "2": { "$value": "8px" },
      "3": { "$value": "12px" },
      "4": { "$value": "16px" },
      "5": { "$value": "20px" },
      "6": { "$value": "24px" },
      "8": { "$value": "32px" },
      "10": { "$value": "40px" },
      "12": { "$value": "48px" },
      "16": { "$value": "64px" },
      "20": { "$value": "80px" },
      "24": { "$value": "96px" }
    },

    // Border radius
    "borderRadius": {
      "$type": "dimension",
      "none": { "$value": "0px" },
      "sm": { "$value": "4px" },
      "md": { "$value": "8px" },
      "lg": { "$value": "12px" },
      "xl": { "$value": "16px" },
      "2xl": { "$value": "24px" },
      "full": { "$value": "9999px" }
    },

    // Shadows
    "shadow": {
      "$type": "shadow",
      "xs": { "$value": { "offsetX": "0px", "offsetY": "1px", "blur": "2px", "spread": "0px", "color": "rgba(0,0,0,0.05)" } },
      "sm": { "$value": { "offsetX": "0px", "offsetY": "1px", "blur": "3px", "spread": "0px", "color": "rgba(0,0,0,0.1)" } },
      "md": { "$value": { "offsetX": "0px", "offsetY": "4px", "blur": "6px", "spread": "-1px", "color": "rgba(0,0,0,0.1)" } },
      "lg": { "$value": { "offsetX": "0px", "offsetY": "10px", "blur": "15px", "spread": "-3px", "color": "rgba(0,0,0,0.1)" } },
      "xl": { "$value": { "offsetX": "0px", "offsetY": "20px", "blur": "25px", "spread": "-5px", "color": "rgba(0,0,0,0.1)" } }
    },

    // Brand metadata
    "_meta": {
      "brand": {
        "name": brand.name,
        "tagline": brand.voice?.tagline || "",
        "tone": brand.voice?.tone || "professional",
        "formality": brand.voice?.formality || "sie"
      },
      "exported": new Date().toISOString(),
      "generator": "TYRN.ON Brand Engine v3.0"
    }
  };
}

// Alternative export format for direct Figma plugin import
export function exportFigmaPluginFormat(brand) {
  return {
    version: "1.0",
    collections: [{
      name: brand.name,
      modes: [{ name: "Default", modeId: "default" }],
      variables: [
        // Colors
        ...Object.entries(brand.colors).map(([name, value]) => ({
          name: `color/${name}`,
          type: "COLOR",
          valuesByMode: { default: hexToRgb(value) }
        })),
        // Add more as needed
      ]
    }]
  };
}
