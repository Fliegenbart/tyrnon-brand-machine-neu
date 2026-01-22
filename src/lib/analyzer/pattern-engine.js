// ============================================
// PATTERN ENGINE - Generate Brand Rules from Analysis
// Creates comprehensive rules from PPTX, PDF, and Image analysis
// ============================================

/**
 * Analyze all parsed assets and generate brand rules with confidence scores
 * @param {Object} analyzedAssets - Results from all analyzers
 * @returns {Object} Rules and extracted assets
 */
export function analyzePatterns(analyzedAssets) {
  const { pptx = [], pdf = [], images = [], fonts = [], tokens = [] } = analyzedAssets;

  const rules = [];

  // Detect color rules (including from design tokens)
  rules.push(...detectColorRules(pptx, pdf, images, tokens));

  // Detect typography rules (including uploaded fonts and tokens)
  rules.push(...detectTypographyRules(pptx, fonts, tokens));

  // Detect font size rules
  rules.push(...detectFontSizeRules(pptx));

  // Detect spacing/grid rules (including from tokens)
  rules.push(...detectSpacingRules(pptx, tokens));

  // Detect layout rules
  rules.push(...detectLayoutRules(pptx));

  // Detect logo rules
  rules.push(...detectLogoRules(pptx));

  // Detect component style rules (buttons, cards, etc.)
  rules.push(...detectComponentStyleRules(pptx, tokens));

  // Merge extracted assets (including fonts)
  const extractedAssets = mergeExtractedAssets(pptx, images, fonts);

  // Separate rules by confidence
  const confirmedRules = rules.filter(r => r.confidence >= 0.6);
  const needsReview = rules.filter(r => r.confidence >= 0.3 && r.confidence < 0.6);

  // If we have no rules at all, include all with any confidence
  if (confirmedRules.length === 0 && needsReview.length === 0 && rules.length > 0) {
    return {
      rules: [],
      needsReview: rules,
      extractedAssets
    };
  }

  return {
    rules: confirmedRules,
    needsReview,
    extractedAssets
  };
}

/**
 * Detect color rules from all sources
 */
function detectColorRules(pptxResults, pdfResults, imageResults, tokenResults = []) {
  const rules = [];
  const colorFrequency = {};
  const colorSources = {};

  // Add colors from design tokens (highest priority)
  for (const tokens of tokenResults) {
    if (!tokens.valid) continue;

    for (const color of tokens.colors || []) {
      const hex = color.value;
      if (!hex || !hex.startsWith('#')) continue;

      const normalizedHex = hex.toLowerCase();
      // Design tokens get very high weight
      colorFrequency[normalizedHex] = (colorFrequency[normalizedHex] || 0) + 20;
      colorSources[normalizedHex] = colorSources[normalizedHex] || [];
      colorSources[normalizedHex].push({
        file: tokens.source,
        location: 'design-tokens',
        name: color.name,
        description: color.description
      });
    }
  }

  // Aggregate colors from PPTX themes
  for (const pptx of pptxResults) {
    // Theme colors (high priority)
    for (const themeColor of pptx.theme?.colors || []) {
      const hex = themeColor.value;
      if (!hex) continue;

      // Weight by color type
      let weight = 5;
      if (themeColor.type === 'accent') weight = 10;
      if (themeColor.name === 'accent1') weight = 15;

      colorFrequency[hex] = (colorFrequency[hex] || 0) + weight;
      colorSources[hex] = colorSources[hex] || [];
      colorSources[hex].push({
        file: pptx.source,
        location: 'theme',
        type: themeColor.type,
        name: themeColor.label || themeColor.name
      });
    }

    // Slide colors
    for (const [hex, data] of Object.entries(pptx.patterns?.colorUsage || {})) {
      colorFrequency[hex] = (colorFrequency[hex] || 0) + data.frequency;
      colorSources[hex] = colorSources[hex] || [];
      colorSources[hex].push({
        file: pptx.source,
        location: 'slides',
        contexts: data.contexts
      });
    }
  }

  // Add colors from PDFs
  for (const pdf of pdfResults) {
    for (const color of [...(pdf.colors?.dominant || []), ...(pdf.colors?.accent || [])]) {
      const hex = color.hex;
      if (!hex) continue;
      colorFrequency[hex] = (colorFrequency[hex] || 0) + (color.count || 1);
      colorSources[hex] = colorSources[hex] || [];
      colorSources[hex].push({ file: pdf.source, location: 'pages' });
    }
  }

  // Add colors from images (logos)
  for (const img of imageResults) {
    if (img.properties?.isLikelyLogo) {
      for (const color of img.colors?.dominant || []) {
        const hex = color.hex;
        if (!hex) continue;
        colorFrequency[hex] = (colorFrequency[hex] || 0) + 5;
        colorSources[hex] = colorSources[hex] || [];
        colorSources[hex].push({ file: img.source, location: 'logo' });
      }
    }
  }

  // Sort colors by frequency
  const sortedColors = Object.entries(colorFrequency)
    .filter(([hex]) => !isNearWhiteOrBlack(hex))
    .sort((a, b) => b[1] - a[1]);

  // Generate rules for top colors
  if (sortedColors.length > 0) {
    const [primaryHex, primaryFreq] = sortedColors[0];
    const primarySources = colorSources[primaryHex] || [];
    const usage = detectColorUsage(primarySources);

    rules.push({
      id: generateId(),
      category: 'color',
      name: 'Primärfarbe',
      description: `${primaryHex} wird als Hauptfarbe verwendet${usage.length > 0 ? ` (${usage.join(', ')})` : ''}`,
      confidence: calculateColorConfidence(primaryFreq, primarySources.length),
      sources: primarySources,
      value: {
        type: 'primary',
        color: primaryHex,
        usage
      },
      applicableTo: ['all']
    });
  }

  if (sortedColors.length > 1) {
    const [secondaryHex, secondaryFreq] = sortedColors[1];
    const secondarySources = colorSources[secondaryHex] || [];

    rules.push({
      id: generateId(),
      category: 'color',
      name: 'Sekundärfarbe',
      description: `${secondaryHex} wird als zweite Markenfarbe verwendet`,
      confidence: calculateColorConfidence(secondaryFreq, secondarySources.length) * 0.9,
      sources: secondarySources,
      value: {
        type: 'secondary',
        color: secondaryHex
      },
      applicableTo: ['all']
    });
  }

  // Find accent colors (different hue from primary)
  if (sortedColors.length > 2) {
    const primaryHue = getHue(sortedColors[0][0]);
    let accentCount = 0;

    for (let i = 2; i < Math.min(sortedColors.length, 8); i++) {
      const [hex, freq] = sortedColors[i];
      const hue = getHue(hex);
      const hueDiff = Math.min(Math.abs(hue - primaryHue), 360 - Math.abs(hue - primaryHue));

      if (hueDiff > 30 && accentCount < 2) {
        const sources = colorSources[hex] || [];
        rules.push({
          id: generateId(),
          category: 'color',
          name: accentCount === 0 ? 'Akzentfarbe' : 'Akzentfarbe 2',
          description: `${hex} wird als Akzentfarbe für CTAs und Highlights verwendet`,
          confidence: calculateColorConfidence(freq, sources.length) * 0.8,
          sources,
          value: {
            type: 'accent',
            color: hex,
            usage: ['cta', 'highlight']
          },
          applicableTo: ['all']
        });
        accentCount++;
      }
    }
  }

  return rules;
}

/**
 * Detect typography rules
 */
function detectTypographyRules(pptxResults, fontResults = [], tokenResults = []) {
  const rules = [];

  // Collect fonts from all PPTX files
  const allFonts = [];

  for (const pptx of pptxResults) {
    if (pptx.theme?.fonts?.major) {
      allFonts.push({ name: pptx.theme.fonts.major, usage: 'heading', source: pptx.source });
    }
    if (pptx.theme?.fonts?.minor) {
      allFonts.push({ name: pptx.theme.fonts.minor, usage: 'body', source: pptx.source });
    }

    // Additional fonts
    for (const font of pptx.theme?.fonts?.all || []) {
      if (font.name && !allFonts.find(f => f.name === font.name)) {
        allFonts.push({ ...font, source: pptx.source });
      }
    }
  }

  // Add uploaded font files as brand fonts
  for (const font of fontResults) {
    if (font.name && !allFonts.find(f => f.name === font.name)) {
      allFonts.push({
        name: font.name,
        usage: 'uploaded',
        source: font.source,
        dataUrl: font.dataUrl,
        format: font.format
      });
    }
  }

  // Add fonts from design tokens
  for (const tokens of tokenResults) {
    if (!tokens.valid) continue;

    for (const font of tokens.fonts || []) {
      if (font.value && !allFonts.find(f => f.name === font.value)) {
        allFonts.push({
          name: font.value,
          usage: font.name?.toLowerCase().includes('heading') ? 'heading' :
                 font.name?.toLowerCase().includes('body') ? 'body' : 'token',
          source: tokens.source
        });
      }
    }
  }

  // Count font usage
  const fontUsage = {};
  for (const font of allFonts) {
    const key = font.name;
    fontUsage[key] = fontUsage[key] || { count: 0, usages: [], sources: [] };
    fontUsage[key].count++;
    if (!fontUsage[key].usages.includes(font.usage)) {
      fontUsage[key].usages.push(font.usage);
    }
    fontUsage[key].sources.push(font.source);
  }

  // Create font rules
  const sortedFonts = Object.entries(fontUsage).sort((a, b) => b[1].count - a[1].count);

  // Heading font
  const headingFont = sortedFonts.find(([, data]) => data.usages.includes('heading'));
  if (headingFont) {
    const [font, data] = headingFont;
    rules.push({
      id: generateId(),
      category: 'typography',
      name: 'Headline-Schrift',
      description: `"${font}" wird für Überschriften verwendet`,
      confidence: Math.min(0.95, 0.6 + data.count * 0.1),
      sources: data.sources.map(s => ({ file: s, location: 'theme' })),
      value: {
        type: 'heading',
        fontFamily: font
      },
      applicableTo: ['all']
    });
  }

  // Body font
  const bodyFont = sortedFonts.find(([, data]) => data.usages.includes('body'));
  if (bodyFont) {
    const [font, data] = bodyFont;
    rules.push({
      id: generateId(),
      category: 'typography',
      name: 'Body-Schrift',
      description: `"${font}" wird für Fließtext verwendet`,
      confidence: Math.min(0.95, 0.6 + data.count * 0.1),
      sources: data.sources.map(s => ({ file: s, location: 'theme' })),
      value: {
        type: 'body',
        fontFamily: font
      },
      applicableTo: ['all']
    });
  }

  // Typography patterns (uppercase, bold, etc.)
  let uppercaseCount = 0;
  let boldCount = 0;
  let italicCount = 0;

  for (const pptx of pptxResults) {
    if (pptx.patterns?.typographyPatterns?.usesUppercase) uppercaseCount++;
    if (pptx.patterns?.typographyPatterns?.usesBold) boldCount++;
    if (pptx.patterns?.typographyPatterns?.usesItalic) italicCount++;
  }

  if (uppercaseCount > 0 && pptxResults.length > 0) {
    const confidence = 0.5 + (uppercaseCount / pptxResults.length) * 0.4;
    rules.push({
      id: generateId(),
      category: 'typography',
      name: 'Headline-Stil: Großbuchstaben',
      description: 'Headlines werden in Großbuchstaben (UPPERCASE) gesetzt',
      confidence,
      sources: pptxResults.filter(p => p.patterns?.typographyPatterns?.usesUppercase)
        .map(p => ({ file: p.source, location: 'slideMaster' })),
      value: {
        textTransform: 'uppercase'
      },
      applicableTo: ['website', 'presentation', 'flyer']
    });
  }

  // Letter-spacing patterns
  const letterSpacings = [];
  for (const pptx of pptxResults) {
    if (pptx.typography?.styles) {
      for (const style of pptx.typography.styles) {
        if (style.letterSpacing && style.letterSpacing !== 0) {
          letterSpacings.push({
            value: style.letterSpacing,
            source: pptx.source,
            context: style.name || 'text'
          });
        }
      }
    }
  }

  if (letterSpacings.length > 0) {
    // Find most common letter-spacing
    const spacingCounts = {};
    for (const ls of letterSpacings) {
      const rounded = Math.round(ls.value * 100) / 100;
      spacingCounts[rounded] = (spacingCounts[rounded] || 0) + 1;
    }

    const mostCommon = Object.entries(spacingCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
      const spacingValue = parseFloat(mostCommon[0]);
      const spacingEm = spacingValue > 1 ? `${spacingValue}%` : `${spacingValue}em`;

      rules.push({
        id: generateId(),
        category: 'typography',
        name: 'Letter-Spacing',
        description: `Headlines verwenden ${spacingEm} Buchstabenabstand`,
        confidence: 0.5 + Math.min(mostCommon[1] * 0.1, 0.4),
        sources: letterSpacings.map(ls => ({ file: ls.source, location: 'styles' })),
        value: {
          letterSpacing: spacingEm
        },
        applicableTo: ['website', 'presentation', 'flyer', 'social']
      });
    }
  }

  return rules;
}

/**
 * Detect font size rules
 */
function detectFontSizeRules(pptxResults) {
  const rules = [];
  const allSizes = [];

  for (const pptx of pptxResults) {
    allSizes.push(...(pptx.typography?.fontSizes || []));
  }

  if (allSizes.length === 0) return rules;

  // Get unique sizes and sort
  const uniqueSizes = [...new Set(allSizes)].sort((a, b) => a - b);

  if (uniqueSizes.length >= 3) {
    // Find heading, subheading, and body sizes
    const headingSize = uniqueSizes[uniqueSizes.length - 1];
    const bodySize = uniqueSizes.find(s => s >= 10 && s <= 14) || uniqueSizes[0];
    const subheadingSize = uniqueSizes.find(s => s > bodySize && s < headingSize);

    rules.push({
      id: generateId(),
      category: 'typography',
      name: 'Schriftgrößen-Hierarchie',
      description: `Headline: ${headingSize}pt, ${subheadingSize ? `Subheadline: ${subheadingSize}pt, ` : ''}Body: ${bodySize}pt`,
      confidence: 0.7,
      sources: pptxResults.map(p => ({ file: p.source, location: 'styles' })),
      value: {
        heading: headingSize,
        subheading: subheadingSize,
        body: bodySize,
        scale: uniqueSizes
      },
      applicableTo: ['all']
    });
  }

  return rules;
}

/**
 * Detect spacing/grid rules
 */
function detectSpacingRules(pptxResults, tokenResults = []) {
  const rules = [];
  const allSpacings = [];

  for (const pptx of pptxResults) {
    allSpacings.push(...(pptx.spacing?.commonSpacings || []));
    allSpacings.push(...(pptx.patterns?.detectedGridValues || []));
  }

  // Add spacing from design tokens
  for (const tokens of tokenResults) {
    if (!tokens.valid) continue;

    for (const spacing of tokens.spacing || []) {
      const value = parseSpacingValue(spacing.value);
      if (value > 0) {
        allSpacings.push(value);
      }
    }
  }

  if (allSpacings.length === 0) return rules;

  // Find grid base
  let gridBase = 8;
  for (const pptx of pptxResults) {
    if (pptx.patterns?.gridBase) {
      gridBase = pptx.patterns.gridBase;
      break;
    }
  }

  // Get common spacings
  const spacingCounts = {};
  for (const spacing of allSpacings) {
    const rounded = Math.round(spacing / 4) * 4;
    if (rounded > 0 && rounded < 200) {
      spacingCounts[rounded] = (spacingCounts[rounded] || 0) + 1;
    }
  }

  const commonSpacings = Object.entries(spacingCounts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([spacing]) => parseInt(spacing))
    .sort((a, b) => a - b);

  if (commonSpacings.length > 0) {
    rules.push({
      id: generateId(),
      category: 'spacing',
      name: 'Grid-System',
      description: `${gridBase}px Grundraster - Abstände: ${commonSpacings.join(', ')}px`,
      confidence: 0.6 + Math.min(commonSpacings.length * 0.05, 0.3),
      sources: pptxResults.map(p => ({ file: p.source, location: 'layouts' })),
      value: {
        baseUnit: gridBase,
        scale: commonSpacings,
        spacingTokens: {
          xs: commonSpacings[0] || gridBase,
          sm: commonSpacings[1] || gridBase * 2,
          md: commonSpacings[2] || gridBase * 3,
          lg: commonSpacings[3] || gridBase * 4,
          xl: commonSpacings[4] || gridBase * 6
        }
      },
      applicableTo: ['website', 'presentation', 'flyer']
    });
  }

  return rules;
}

/**
 * Detect layout rules
 */
function detectLayoutRules(pptxResults) {
  const rules = [];

  for (const pptx of pptxResults) {
    // Slide dimensions
    if (pptx.layouts?.slideSize?.width > 0) {
      const { width, height } = pptx.layouts.slideSize;
      const aspectRatio = width / height;
      let formatName = 'Custom';

      if (Math.abs(aspectRatio - 16/9) < 0.1) formatName = '16:9 Widescreen';
      else if (Math.abs(aspectRatio - 4/3) < 0.1) formatName = '4:3 Standard';
      else if (Math.abs(aspectRatio - 1) < 0.1) formatName = '1:1 Quadrat';

      rules.push({
        id: generateId(),
        category: 'component',
        name: 'Präsentationsformat',
        description: `${formatName} (${width}×${height}px)`,
        confidence: 0.95,
        sources: [{ file: pptx.source, location: 'presentation' }],
        value: {
          width,
          height,
          aspectRatio: aspectRatio.toFixed(2),
          format: formatName
        },
        applicableTo: ['presentation']
      });
      break; // Only need one
    }
  }

  // Content margins
  const allMargins = [];
  for (const pptx of pptxResults) {
    allMargins.push(...(pptx.spacing?.margins || []));
  }

  if (allMargins.length > 0) {
    const marginCounts = {};
    for (const margin of allMargins) {
      const rounded = Math.round(margin / 8) * 8;
      if (rounded > 0 && rounded < 200) {
        marginCounts[rounded] = (marginCounts[rounded] || 0) + 1;
      }
    }

    const commonMargin = Object.entries(marginCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (commonMargin) {
      rules.push({
        id: generateId(),
        category: 'spacing',
        name: 'Content-Margins',
        description: `Standard-Außenabstand: ${commonMargin[0]}px`,
        confidence: 0.5 + Math.min(commonMargin[1] * 0.05, 0.3),
        sources: pptxResults.map(p => ({ file: p.source, location: 'layouts' })),
        value: {
          margin: parseInt(commonMargin[0])
        },
        applicableTo: ['website', 'presentation', 'flyer']
      });
    }
  }

  return rules;
}

/**
 * Detect logo rules
 */
function detectLogoRules(pptxResults) {
  const rules = [];
  const logoPositions = [];

  for (const pptx of pptxResults) {
    logoPositions.push(...(pptx.layouts?.logoPositions || []));
  }

  if (logoPositions.length > 0) {
    // Count position categories
    const positionCounts = {};
    for (const logo of logoPositions) {
      positionCounts[logo.position] = (positionCounts[logo.position] || 0) + 1;
    }

    const mostCommon = Object.entries(positionCounts).sort((a, b) => b[1] - a[1])[0];

    if (mostCommon) {
      const positionLabels = {
        'top-left': 'oben links',
        'top-right': 'oben rechts',
        'bottom-left': 'unten links',
        'bottom-right': 'unten rechts',
        'center': 'zentriert'
      };

      rules.push({
        id: generateId(),
        category: 'component',
        name: 'Logo-Positionierung',
        description: `Logo wird bevorzugt ${positionLabels[mostCommon[0]] || mostCommon[0]} platziert`,
        confidence: 0.5 + Math.min(mostCommon[1] * 0.1, 0.4),
        sources: pptxResults.map(p => ({ file: p.source, location: 'slides' })),
        value: {
          position: mostCommon[0],
          occurrences: mostCommon[1]
        },
        applicableTo: ['website', 'presentation', 'flyer', 'email']
      });
    }
  }

  return rules;
}

/**
 * Detect component style rules (buttons, cards, border-radius, shadows)
 */
function detectComponentStyleRules(pptxResults, tokenResults = []) {
  const rules = [];

  // Collect border radius values
  const radiusValues = [];

  // From design tokens
  for (const tokens of tokenResults) {
    if (!tokens.valid) continue;

    for (const radius of tokens.radii || []) {
      const value = parseRadiusValue(radius.value);
      if (value > 0) {
        radiusValues.push({
          value,
          name: radius.name,
          source: tokens.source
        });
      }
    }

    // Shadows from tokens
    for (const shadow of tokens.shadows || []) {
      if (shadow.value) {
        rules.push({
          id: generateId(),
          category: 'component',
          name: shadow.name || 'Box Shadow',
          description: `Schatten: ${shadow.value}`,
          confidence: 0.85,
          sources: [{ file: tokens.source, location: 'design-tokens' }],
          value: {
            boxShadow: shadow.value
          },
          applicableTo: ['website', 'social']
        });
      }
    }
  }

  // From PPTX shape analysis (rounded rectangles)
  for (const pptx of pptxResults) {
    if (pptx.shapes?.roundedRectangles) {
      for (const shape of pptx.shapes.roundedRectangles) {
        if (shape.cornerRadius) {
          radiusValues.push({
            value: shape.cornerRadius,
            source: pptx.source
          });
        }
      }
    }
  }

  // Create border-radius rule from most common values
  if (radiusValues.length > 0) {
    const radiusCounts = {};
    for (const r of radiusValues) {
      const rounded = Math.round(r.value / 2) * 2; // Round to even numbers
      if (rounded > 0 && rounded <= 50) {
        radiusCounts[rounded] = (radiusCounts[rounded] || 0) + 1;
      }
    }

    const sortedRadii = Object.entries(radiusCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([val]) => parseInt(val));

    if (sortedRadii.length > 0) {
      rules.push({
        id: generateId(),
        category: 'component',
        name: 'Border-Radius',
        description: `Eckenradius: ${sortedRadii.join('px, ')}px`,
        confidence: 0.6 + Math.min(radiusValues.length * 0.05, 0.3),
        sources: radiusValues.map(r => ({ file: r.source, location: 'shapes' })),
        value: {
          borderRadius: sortedRadii[0],
          scale: sortedRadii
        },
        applicableTo: ['website', 'social', 'email']
      });
    }
  }

  // Button style detection from PPTX
  const buttonPatterns = [];
  for (const pptx of pptxResults) {
    // Look for shapes that could be buttons (small rectangles with fills)
    if (pptx.shapes?.buttons) {
      buttonPatterns.push(...pptx.shapes.buttons);
    }
  }

  if (buttonPatterns.length > 0) {
    // Analyze common button properties
    const buttonColors = {};
    for (const btn of buttonPatterns) {
      if (btn.fillColor) {
        buttonColors[btn.fillColor] = (buttonColors[btn.fillColor] || 0) + 1;
      }
    }

    const mostCommonBtnColor = Object.entries(buttonColors).sort((a, b) => b[1] - a[1])[0];
    if (mostCommonBtnColor) {
      rules.push({
        id: generateId(),
        category: 'component',
        name: 'Button-Stil',
        description: `Buttons verwenden ${mostCommonBtnColor[0]} als Hintergrundfarbe`,
        confidence: 0.5 + Math.min(mostCommonBtnColor[1] * 0.1, 0.4),
        sources: pptxResults.map(p => ({ file: p.source, location: 'shapes' })),
        value: {
          backgroundColor: mostCommonBtnColor[0],
          borderRadius: radiusValues[0]?.value || 8
        },
        applicableTo: ['website', 'email', 'flyer']
      });
    }
  }

  return rules;
}

/**
 * Parse border-radius value to pixels
 */
function parseRadiusValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const pxMatch = value.match(/^([\d.]+)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);

  const remMatch = value.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;

  const num = parseFloat(value);
  if (!isNaN(num)) return num;

  return 0;
}

/**
 * Merge extracted assets from all sources
 */
function mergeExtractedAssets(pptxResults, imageResults, fontResults = []) {
  const assets = {
    logos: [],
    images: [],
    icons: [],
    backgrounds: [],
    fonts: []
  };

  // From PPTX
  for (const pptx of pptxResults) {
    assets.logos.push(...(pptx.extractedAssets?.logos || []));
    assets.images.push(...(pptx.extractedAssets?.images || []));
    assets.icons.push(...(pptx.extractedAssets?.icons || []));
    assets.backgrounds.push(...(pptx.extractedAssets?.backgrounds || []));
  }

  // From images
  for (const img of imageResults) {
    if (img.properties?.isLikelyLogo) {
      assets.logos.push({
        name: img.source,
        isLogo: true,
        confidence: img.confidence,
        colors: img.colors?.dominant
      });
    }
  }

  // From uploaded fonts
  for (const font of fontResults) {
    assets.fonts.push({
      name: font.name,
      source: font.source,
      format: font.format,
      dataUrl: font.dataUrl,
      confidence: font.confidence || 0.9
    });
  }

  // Sort by confidence
  assets.logos.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  assets.images.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  assets.fonts.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  return assets;
}

// ============================================
// Helper functions
// ============================================

function generateId() {
  return 'rule-' + Math.random().toString(36).substring(2, 9);
}

function parseSpacingValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  // Parse px values
  const pxMatch = value.match(/^([\d.]+)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);

  // Parse rem values (assume 16px base)
  const remMatch = value.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;

  // Parse em values
  const emMatch = value.match(/^([\d.]+)em$/);
  if (emMatch) return parseFloat(emMatch[1]) * 16;

  // Parse plain numbers
  const num = parseFloat(value);
  if (!isNaN(num)) return num;

  return 0;
}

function isNearWhiteOrBlack(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return luminance < 30 || luminance > 225;
}

function calculateColorConfidence(frequency, sourceCount) {
  const freqScore = Math.min(frequency / 5, 1);
  const sourceScore = Math.min(sourceCount / 2, 1);
  const base = 0.4;
  return Math.round((base + (freqScore * 0.4 + sourceScore * 0.2)) * 100) / 100;
}

function detectColorUsage(sources) {
  const usage = new Set();
  for (const source of sources) {
    if (source.type === 'accent') usage.add('accent');
    if (source.contexts) {
      source.contexts.forEach(c => usage.add(c));
    }
    if (source.location === 'logo') usage.add('logo');
  }
  return Array.from(usage);
}

function getHue(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max === min) return 0;

  let h;
  const d = max - min;

  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }

  return Math.round(h * 360);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export const generateRules = analyzePatterns;
export default analyzePatterns;
