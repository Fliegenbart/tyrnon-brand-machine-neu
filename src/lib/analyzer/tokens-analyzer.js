// ============================================
// DESIGN TOKENS ANALYZER
// Parses JSON design token files (Figma, Style Dictionary, Tokens Studio, etc.)
// ============================================

/**
 * Analyze a design tokens JSON file
 * @param {File} file - JSON file with design tokens
 * @returns {Promise<Object>} Analyzed tokens
 */
export async function analyzeTokens(file) {
  const text = await file.text();
  let json;

  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error('Invalid JSON:', e);
    return { source: file.name, valid: false, error: 'Invalid JSON' };
  }

  const analysis = {
    source: file.name,
    valid: true,
    format: detectTokenFormat(json),
    colors: [],
    fonts: [],
    spacing: [],
    radii: [],
    shadows: [],
    raw: json,
    confidence: 0.85
  };

  // Parse based on detected format
  switch (analysis.format) {
    case 'figma-tokens':
    case 'tokens-studio':
      parseTokensStudioFormat(json, analysis);
      break;
    case 'style-dictionary':
      parseStyleDictionaryFormat(json, analysis);
      break;
    case 'figma-variables':
      parseFigmaVariablesFormat(json, analysis);
      break;
    default:
      // Try generic parsing
      parseGenericTokens(json, analysis);
  }

  return analysis;
}

/**
 * Detect the token file format
 */
function detectTokenFormat(json) {
  // Tokens Studio / Figma Tokens format
  if (json.$themes || json.$metadata || hasNestedTokenStructure(json)) {
    return 'tokens-studio';
  }

  // Figma Variables export
  if (json.variables || json.variableCollections) {
    return 'figma-variables';
  }

  // Style Dictionary format
  if (json.color || json.size || json.font) {
    return 'style-dictionary';
  }

  return 'generic';
}

/**
 * Check if object has Tokens Studio structure
 */
function hasNestedTokenStructure(obj) {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === 'object') {
      if (value.$value !== undefined || value.value !== undefined) {
        return true;
      }
      if (hasNestedTokenStructure(value)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Parse Tokens Studio / Figma Tokens format
 */
function parseTokensStudioFormat(json, analysis) {
  const processTokenGroup = (group, path = []) => {
    for (const [key, value] of Object.entries(group)) {
      if (key.startsWith('$')) continue; // Skip metadata

      const currentPath = [...path, key];

      if (value && typeof value === 'object') {
        // Check if it's a token value
        const tokenValue = value.$value || value.value;
        const tokenType = value.$type || value.type;

        if (tokenValue !== undefined) {
          const token = {
            name: currentPath.join('.'),
            value: tokenValue,
            type: tokenType,
            description: value.$description || value.description
          };

          // Categorize token
          if (tokenType === 'color' || isColorValue(tokenValue)) {
            analysis.colors.push({
              name: token.name,
              value: normalizeColor(tokenValue),
              description: token.description
            });
          } else if (tokenType === 'fontFamily' || tokenType === 'fontFamilies') {
            analysis.fonts.push({
              name: token.name,
              value: tokenValue,
              description: token.description
            });
          } else if (tokenType === 'spacing' || tokenType === 'dimension') {
            analysis.spacing.push({
              name: token.name,
              value: tokenValue,
              description: token.description
            });
          } else if (tokenType === 'borderRadius') {
            analysis.radii.push({
              name: token.name,
              value: tokenValue,
              description: token.description
            });
          } else if (tokenType === 'boxShadow') {
            analysis.shadows.push({
              name: token.name,
              value: tokenValue,
              description: token.description
            });
          }
        } else {
          // Recurse into nested group
          processTokenGroup(value, currentPath);
        }
      }
    }
  };

  processTokenGroup(json);
}

/**
 * Parse Style Dictionary format
 */
function parseStyleDictionaryFormat(json, analysis) {
  const processCategory = (category, data, path = []) => {
    for (const [key, value] of Object.entries(data)) {
      const currentPath = [...path, key];

      if (value && typeof value === 'object') {
        if (value.value !== undefined) {
          const token = {
            name: currentPath.join('.'),
            value: value.value,
            attributes: value.attributes
          };

          if (category === 'color') {
            analysis.colors.push({
              name: token.name,
              value: normalizeColor(value.value)
            });
          } else if (category === 'font') {
            analysis.fonts.push({
              name: token.name,
              value: value.value
            });
          } else if (category === 'size' || category === 'spacing') {
            analysis.spacing.push({
              name: token.name,
              value: value.value
            });
          }
        } else {
          processCategory(category, value, currentPath);
        }
      }
    }
  };

  // Process each top-level category
  for (const [category, data] of Object.entries(json)) {
    if (data && typeof data === 'object') {
      processCategory(category, data, [category]);
    }
  }
}

/**
 * Parse Figma Variables export format
 */
function parseFigmaVariablesFormat(json, analysis) {
  const variables = json.variables || [];

  for (const variable of variables) {
    const name = variable.name || variable.key;
    const value = variable.value || variable.resolvedValue;

    if (!name || value === undefined) continue;

    // Determine type from variable type or value
    if (variable.resolvedType === 'COLOR' || isColorValue(value)) {
      analysis.colors.push({
        name,
        value: normalizeColor(value)
      });
    } else if (typeof value === 'number') {
      analysis.spacing.push({
        name,
        value: value + 'px'
      });
    } else if (typeof value === 'string') {
      // Could be font or other
      if (name.toLowerCase().includes('font')) {
        analysis.fonts.push({ name, value });
      }
    }
  }
}

/**
 * Generic token parsing for unknown formats
 */
function parseGenericTokens(json, analysis) {
  const processObject = (obj, path = []) => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];
      const fullKey = currentPath.join('.');

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        processObject(value, currentPath);
      } else {
        // Check if value looks like a color
        if (isColorValue(value)) {
          analysis.colors.push({
            name: fullKey,
            value: normalizeColor(value)
          });
        }
        // Check if value looks like a font
        else if (typeof value === 'string' &&
          (key.toLowerCase().includes('font') ||
            key.toLowerCase().includes('family'))) {
          analysis.fonts.push({
            name: fullKey,
            value
          });
        }
        // Check if value looks like spacing
        else if (typeof value === 'string' &&
          (value.endsWith('px') || value.endsWith('rem') || value.endsWith('em'))) {
          analysis.spacing.push({
            name: fullKey,
            value
          });
        }
      }
    }
  };

  processObject(json);
}

/**
 * Check if a value looks like a color
 */
function isColorValue(value) {
  if (typeof value !== 'string') return false;

  // Hex colors
  if (/^#[0-9A-Fa-f]{3,8}$/.test(value)) return true;

  // RGB/RGBA
  if (/^rgba?\(.+\)$/i.test(value)) return true;

  // HSL/HSLA
  if (/^hsla?\(.+\)$/i.test(value)) return true;

  return false;
}

/**
 * Normalize color to hex format
 */
function normalizeColor(value) {
  if (typeof value !== 'string') return value;

  // Already hex
  if (value.startsWith('#')) {
    // Expand shorthand
    if (value.length === 4) {
      return '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
    }
    return value.toLowerCase();
  }

  // Parse RGB/RGBA
  const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return '#' + r + g + b;
  }

  return value;
}

export default analyzeTokens;
