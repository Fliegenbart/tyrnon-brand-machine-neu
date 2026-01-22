// ============================================
// PPTX/POTX ANALYZER - Comprehensive PowerPoint Analysis
// Extracts: Colors, Fonts, Logos, Images, Layouts, Spacing
// ============================================
import JSZip from 'jszip';

/**
 * Analyze a PPTX/POTX file and extract all brand patterns
 * @param {File} file - PPTX or POTX file to analyze
 * @returns {Promise<Object>} Comprehensive analysis results
 */
export async function analyzePptx(file) {
  const zip = await JSZip.loadAsync(file);

  const analysis = {
    source: file.name,
    type: file.name.endsWith('.potx') ? 'potx' : 'pptx',

    // Theme data
    theme: {
      colors: [],
      fonts: {
        major: null,
        minor: null,
        all: []
      }
    },

    // Typography details
    typography: {
      headingStyles: [],
      bodyStyles: [],
      fontSizes: [],
      fontWeights: new Set(),
      textTransforms: new Set()
    },

    // Layout patterns
    layouts: {
      slideSize: { width: 0, height: 0 },
      masterLayouts: [],
      contentAreas: [],
      logoPositions: []
    },

    // Spacing & Grid
    spacing: {
      margins: [],
      paddings: [],
      gaps: [],
      gridValues: [],
      commonSpacings: []
    },

    // Color usage patterns
    patterns: {
      colorUsage: {},
      typographyPatterns: {
        usesUppercase: false,
        usesBold: false,
        usesItalic: false
      },
      detectedGridValues: []
    },

    // Extracted assets
    extractedAssets: {
      logos: [],
      images: [],
      icons: [],
      backgrounds: []
    },

    slideCount: 0,
    confidence: 0
  };

  // 1. Parse presentation properties (slide size)
  await parsePresentationProps(zip, analysis);

  // 2. Parse Theme (colors, fonts)
  await parseTheme(zip, analysis);

  // 3. Parse Slide Masters (layouts, typography styles)
  await parseSlideMasters(zip, analysis);

  // 4. Parse Slide Layouts
  await parseSlideLayouts(zip, analysis);

  // 5. Parse all slides (color usage, content patterns)
  await parseSlides(zip, analysis);

  // 6. Extract all media assets (logos, images)
  await extractAllMedia(zip, analysis);

  // 7. Analyze relationships to find logo positions
  await analyzeRelationships(zip, analysis);

  // 8. Calculate final patterns and confidence
  finalizeAnalysis(analysis);

  return analysis;
}

/**
 * Parse presentation properties for slide dimensions
 */
async function parsePresentationProps(zip, analysis) {
  const propsFile = zip.file('ppt/presentation.xml');
  if (!propsFile) return;

  const xml = await propsFile.async('text');

  // Extract slide size (in EMUs - 914400 EMU = 1 inch)
  const sizeMatch = xml.match(/sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
  if (sizeMatch) {
    analysis.layouts.slideSize = {
      width: Math.round(parseInt(sizeMatch[1]) / 914400 * 96),
      height: Math.round(parseInt(sizeMatch[2]) / 914400 * 96),
      widthEmu: parseInt(sizeMatch[1]),
      heightEmu: parseInt(sizeMatch[2])
    };
  }
}

/**
 * Parse theme colors and fonts
 */
async function parseTheme(zip, analysis) {
  const themeFiles = zip.file(/ppt\/theme\/theme\d*\.xml/);
  if (themeFiles.length === 0) return;

  for (const themeFile of themeFiles) {
    const xml = await themeFile.async('text');

    // Extract scheme colors
    const schemeColors = [
      { name: 'dk1', type: 'dark', label: 'Dark 1' },
      { name: 'lt1', type: 'light', label: 'Light 1' },
      { name: 'dk2', type: 'dark', label: 'Dark 2' },
      { name: 'lt2', type: 'light', label: 'Light 2' },
      { name: 'accent1', type: 'accent', label: 'Accent 1' },
      { name: 'accent2', type: 'accent', label: 'Accent 2' },
      { name: 'accent3', type: 'accent', label: 'Accent 3' },
      { name: 'accent4', type: 'accent', label: 'Accent 4' },
      { name: 'accent5', type: 'accent', label: 'Accent 5' },
      { name: 'accent6', type: 'accent', label: 'Accent 6' },
      { name: 'hlink', type: 'link', label: 'Hyperlink' },
      { name: 'folHlink', type: 'link', label: 'Followed Link' }
    ];

    for (const { name, type, label } of schemeColors) {
      const color = extractColorFromElement(xml, name);
      if (color) {
        analysis.theme.colors.push({
          name,
          type,
          label,
          value: color,
          source: 'theme'
        });
      }
    }

    // Extract fonts
    const majorFontMatch = xml.match(/<a:majorFont>[\s\S]*?<a:latin typeface="([^"]+)"/i);
    const minorFontMatch = xml.match(/<a:minorFont>[\s\S]*?<a:latin typeface="([^"]+)"/i);

    if (majorFontMatch && !majorFontMatch[1].startsWith('+')) {
      analysis.theme.fonts.major = majorFontMatch[1];
      analysis.theme.fonts.all.push({ name: majorFontMatch[1], usage: 'heading', source: 'theme' });
    }
    if (minorFontMatch && !minorFontMatch[1].startsWith('+')) {
      analysis.theme.fonts.minor = minorFontMatch[1];
      analysis.theme.fonts.all.push({ name: minorFontMatch[1], usage: 'body', source: 'theme' });
    }

    // Extract additional fonts from font scheme
    const fontMatches = xml.matchAll(/typeface="([^"+][^"]*)"/gi);
    const seenFonts = new Set([analysis.theme.fonts.major, analysis.theme.fonts.minor].filter(Boolean));

    for (const match of fontMatches) {
      if (!seenFonts.has(match[1]) && match[1].length > 1) {
        seenFonts.add(match[1]);
        analysis.theme.fonts.all.push({ name: match[1], usage: 'other', source: 'theme' });
      }
    }
  }
}

/**
 * Extract color from XML element
 */
function extractColorFromElement(xml, elementName) {
  // Try different color formats
  const patterns = [
    new RegExp(`<a:${elementName}>\\s*<a:srgbClr val="([A-Fa-f0-9]{6})"`, 'i'),
    new RegExp(`<a:${elementName}>[\\s\\S]*?val="([A-Fa-f0-9]{6})"`, 'i'),
    new RegExp(`<a:${elementName}>\\s*<a:sysClr[^>]*lastClr="([A-Fa-f0-9]{6})"`, 'i')
  ];

  for (const regex of patterns) {
    const match = xml.match(regex);
    if (match) {
      return '#' + match[1].toLowerCase();
    }
  }
  return null;
}

/**
 * Parse slide masters for layout and typography
 */
async function parseSlideMasters(zip, analysis) {
  const masterFiles = zip.file(/ppt\/slideMasters\/slideMaster\d+\.xml/);

  for (const masterFile of masterFiles) {
    const xml = await masterFile.async('text');
    const masterName = masterFile.name;
    const masterNum = masterName.match(/slideMaster(\d+)/)?.[1] || '1';

    // Extract master layout info
    const masterLayout = {
      name: masterName,
      titleStyle: null,
      bodyStyle: null,
      placeholders: [],
      images: []
    };

    // Parse title style
    const titleStyleMatch = xml.match(/<p:titleStyle>([\s\S]*?)<\/p:titleStyle>/i);
    if (titleStyleMatch) {
      masterLayout.titleStyle = parseTextStyle(titleStyleMatch[1]);
      if (masterLayout.titleStyle) {
        analysis.typography.headingStyles.push(masterLayout.titleStyle);
      }
    }

    // Parse body style
    const bodyStyleMatch = xml.match(/<p:bodyStyle>([\s\S]*?)<\/p:bodyStyle>/i);
    if (bodyStyleMatch) {
      masterLayout.bodyStyle = parseTextStyle(bodyStyleMatch[1]);
      if (masterLayout.bodyStyle) {
        analysis.typography.bodyStyles.push(masterLayout.bodyStyle);
      }
    }

    // Extract placeholder positions
    const placeholderMatches = xml.matchAll(/<p:sp>[\s\S]*?<p:ph([^>]*)>[\s\S]*?<a:off x="(\d+)" y="(\d+)"[\s\S]*?<a:ext cx="(\d+)" cy="(\d+)"/gi);
    for (const match of placeholderMatches) {
      const typeMatch = match[1].match(/type="([^"]+)"/);
      masterLayout.placeholders.push({
        type: typeMatch ? typeMatch[1] : 'content',
        x: emuToPixels(match[2]),
        y: emuToPixels(match[3]),
        width: emuToPixels(match[4]),
        height: emuToPixels(match[5])
      });
    }

    // Extract typography patterns
    if (xml.match(/<a:rPr[^>]*\bb="1"/)) {
      analysis.patterns.typographyPatterns.usesBold = true;
      analysis.typography.fontWeights.add('bold');
    }
    if (xml.match(/<a:rPr[^>]*\bi="1"/)) {
      analysis.patterns.typographyPatterns.usesItalic = true;
    }
    if (xml.match(/<a:rPr[^>]*\bcap="all"/)) {
      analysis.patterns.typographyPatterns.usesUppercase = true;
      analysis.typography.textTransforms.add('uppercase');
    }

    // Extract fonts used
    const fontMatches = xml.matchAll(/typeface="([^"+][^"]*)"/gi);
    for (const match of fontMatches) {
      if (!analysis.theme.fonts.all.find(f => f.name === match[1])) {
        analysis.theme.fonts.all.push({ name: match[1], usage: 'slide', source: 'master' });
      }
    }

    // Extract font sizes
    const sizeMatches = xml.matchAll(/sz="(\d+)"/gi);
    for (const match of sizeMatches) {
      const sizePt = parseInt(match[1]) / 100; // OOXML uses hundredths of points
      if (sizePt > 6 && sizePt < 200) {
        analysis.typography.fontSizes.push(sizePt);
      }
    }

    // Extract images from slide master (logos, backgrounds, etc.)
    await extractMasterAssets(zip, masterNum, xml, analysis, masterLayout);

    analysis.layouts.masterLayouts.push(masterLayout);
  }

  // Also parse slide layouts for assets
  await extractLayoutAssets(zip, analysis);
}

/**
 * Extract assets (logos, images) from slide master
 */
async function extractMasterAssets(zip, masterNum, masterXml, analysis, masterLayout) {
  // Get the relationships file for this master
  const relsFile = zip.file(`ppt/slideMasters/_rels/slideMaster${masterNum}.xml.rels`);
  if (!relsFile) return;

  const relsXml = await relsFile.async('text');

  // Find all image relationships
  const imageRels = {};
  const relMatches = relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/gi);
  for (const match of relMatches) {
    if (match[2].includes('/media/') || match[2].includes('../media/')) {
      imageRels[match[1]] = match[2].replace('../', 'ppt/');
    }
  }

  // Find image references in master XML with positions
  const picMatches = masterXml.matchAll(/<p:pic>([\s\S]*?)<\/p:pic>/gi);

  for (const picMatch of picMatches) {
    const picXml = picMatch[1];

    // Get embed reference
    const embedMatch = picXml.match(/r:embed="(rId\d+)"/);
    if (!embedMatch) continue;

    const relId = embedMatch[1];
    const mediaPath = imageRels[relId];
    if (!mediaPath) continue;

    // Get position
    const posMatch = picXml.match(/<a:off x="(\d+)" y="(\d+)"/);
    const sizeMatch = picXml.match(/<a:ext cx="(\d+)" cy="(\d+)"/);

    const position = posMatch ? {
      x: emuToPixels(posMatch[1]),
      y: emuToPixels(posMatch[2])
    } : null;

    const size = sizeMatch ? {
      width: emuToPixels(sizeMatch[1]),
      height: emuToPixels(sizeMatch[2])
    } : null;

    // Extract the actual media file
    const mediaFile = zip.file(mediaPath);
    if (!mediaFile) continue;

    const filename = mediaPath.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();

    if (!['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'emf', 'wmf'].includes(ext)) {
      continue;
    }

    let dataUrl;
    let dimensions;
    let isSvg = ext === 'svg';

    if (isSvg) {
      // Handle SVG files specially - read as text
      const svgText = await mediaFile.async('text');
      dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
      dimensions = getSvgDimensions(svgText);
    } else {
      const blob = await mediaFile.async('blob');
      dataUrl = await blobToDataUrl(blob);
      dimensions = await getImageDimensions(dataUrl);
    }

    const blob = await mediaFile.async('blob');

    // Assets in slide master are very likely logos or brand elements
    const asset = {
      name: filename,
      data: dataUrl,
      size: blob.size,
      type: 'logo', // Master assets are typically logos
      source: 'slideMaster',
      position,
      dimensions: dimensions || size,
      isVector: isSvg || ext === 'emf' || ext === 'wmf',
      confidence: 0.9 // High confidence for master assets
    };

    // Determine position category
    if (position && analysis.layouts.slideSize.width > 0) {
      const slideWidth = analysis.layouts.slideSize.width;
      const slideHeight = analysis.layouts.slideSize.height;

      if (position.x < slideWidth * 0.3 && position.y < slideHeight * 0.3) {
        asset.positionCategory = 'top-left';
      } else if (position.x > slideWidth * 0.5 && position.y < slideHeight * 0.3) {
        asset.positionCategory = 'top-right';
      } else if (position.x < slideWidth * 0.3 && position.y > slideHeight * 0.7) {
        asset.positionCategory = 'bottom-left';
      } else if (position.x > slideWidth * 0.5 && position.y > slideHeight * 0.7) {
        asset.positionCategory = 'bottom-right';
      } else {
        asset.positionCategory = 'center';
      }

      // Add to logo positions for rule detection
      analysis.layouts.logoPositions.push({
        name: filename,
        position: asset.positionCategory,
        x: position.x,
        y: position.y,
        source: 'master'
      });
    }

    // Add to logos (master assets are brand assets)
    analysis.extractedAssets.logos.push(asset);
    masterLayout.images.push(asset);
  }

  // Also extract background images from master
  const bgMatches = masterXml.matchAll(/<p:bgPr>([\s\S]*?)<\/p:bgPr>/gi);
  for (const bgMatch of bgMatches) {
    const bgXml = bgMatch[1];
    const embedMatch = bgXml.match(/r:embed="(rId\d+)"/);

    if (embedMatch && imageRels[embedMatch[1]]) {
      const mediaPath = imageRels[embedMatch[1]];
      const mediaFile = zip.file(mediaPath);

      if (mediaFile) {
        const filename = mediaPath.split('/').pop();
        const blob = await mediaFile.async('blob');
        const dataUrl = await blobToDataUrl(blob);

        analysis.extractedAssets.backgrounds.push({
          name: filename,
          data: dataUrl,
          size: blob.size,
          type: 'background',
          source: 'slideMaster',
          confidence: 0.95
        });
      }
    }
  }
}

/**
 * Extract assets from slide layouts
 */
async function extractLayoutAssets(zip, analysis) {
  const layoutFiles = zip.file(/ppt\/slideLayouts\/slideLayout\d+\.xml/);

  for (const layoutFile of layoutFiles) {
    const xml = await layoutFile.async('text');
    const layoutNum = layoutFile.name.match(/slideLayout(\d+)/)?.[1] || '1';

    // Get relationships
    const relsFile = zip.file(`ppt/slideLayouts/_rels/slideLayout${layoutNum}.xml.rels`);
    if (!relsFile) continue;

    const relsXml = await relsFile.async('text');

    // Find image relationships
    const imageRels = {};
    const relMatches = relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/gi);
    for (const match of relMatches) {
      if (match[2].includes('/media/') || match[2].includes('../media/')) {
        imageRels[match[1]] = match[2].replace('../', 'ppt/');
      }
    }

    // Find images in layout
    const picMatches = xml.matchAll(/<p:pic>([\s\S]*?)<\/p:pic>/gi);

    for (const picMatch of picMatches) {
      const picXml = picMatch[1];
      const embedMatch = picXml.match(/r:embed="(rId\d+)"/);

      if (!embedMatch) continue;

      const mediaPath = imageRels[embedMatch[1]];
      if (!mediaPath) continue;

      // Check if we already have this asset
      const filename = mediaPath.split('/').pop();
      if (analysis.extractedAssets.logos.find(a => a.name === filename)) continue;

      const mediaFile = zip.file(mediaPath);
      if (!mediaFile) continue;

      const ext = filename.split('.').pop().toLowerCase();
      if (!['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'emf', 'wmf'].includes(ext)) continue;

      let dataUrl;
      let dimensions;
      let isSvg = ext === 'svg';

      if (isSvg) {
        const svgText = await mediaFile.async('text');
        dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
        dimensions = getSvgDimensions(svgText);
      } else {
        const blob = await mediaFile.async('blob');
        dataUrl = await blobToDataUrl(blob);
        dimensions = await getImageDimensions(dataUrl);
      }

      const blob = await mediaFile.async('blob');

      // Get position
      const posMatch = picXml.match(/<a:off x="(\d+)" y="(\d+)"/);
      const position = posMatch ? {
        x: emuToPixels(posMatch[1]),
        y: emuToPixels(posMatch[2])
      } : null;

      const asset = {
        name: filename,
        data: dataUrl,
        size: blob.size,
        type: 'logo',
        source: 'slideLayout',
        position,
        dimensions,
        isVector: isSvg || ext === 'emf' || ext === 'wmf',
        confidence: 0.85 // High confidence for layout assets
      };

      // Determine position category
      if (position && analysis.layouts.slideSize.width > 0) {
        const slideWidth = analysis.layouts.slideSize.width;
        const slideHeight = analysis.layouts.slideSize.height;

        if (position.x < slideWidth * 0.3 && position.y < slideHeight * 0.3) {
          asset.positionCategory = 'top-left';
        } else if (position.x > slideWidth * 0.5 && position.y < slideHeight * 0.3) {
          asset.positionCategory = 'top-right';
        } else if (position.x < slideWidth * 0.3 && position.y > slideHeight * 0.7) {
          asset.positionCategory = 'bottom-left';
        } else if (position.x > slideWidth * 0.5 && position.y > slideHeight * 0.7) {
          asset.positionCategory = 'bottom-right';
        } else {
          asset.positionCategory = 'center';
        }

        analysis.layouts.logoPositions.push({
          name: filename,
          position: asset.positionCategory,
          x: position.x,
          y: position.y,
          source: 'layout'
        });
      }

      analysis.extractedAssets.logos.push(asset);
    }
  }
}

/**
 * Parse text style from XML
 */
function parseTextStyle(xml) {
  const style = {
    fontSize: null,
    fontWeight: 'normal',
    textTransform: 'none',
    letterSpacing: null,
    lineHeight: null
  };

  // Font size
  const sizeMatch = xml.match(/sz="(\d+)"/);
  if (sizeMatch) {
    style.fontSize = parseInt(sizeMatch[1]) / 100;
  }

  // Bold
  if (xml.match(/\bb="1"/)) {
    style.fontWeight = 'bold';
  }

  // Uppercase
  if (xml.match(/cap="all"/)) {
    style.textTransform = 'uppercase';
  }

  // Letter spacing (spc attribute in hundredths of points)
  const spacingMatch = xml.match(/spc="(-?\d+)"/);
  if (spacingMatch) {
    style.letterSpacing = parseInt(spacingMatch[1]) / 100;
  }

  // Line spacing
  const lineMatch = xml.match(/lnSpc>[\s\S]*?val="(\d+)"/);
  if (lineMatch) {
    style.lineHeight = parseInt(lineMatch[1]) / 100000; // Percentage
  }

  return style;
}

/**
 * Parse slide layouts
 */
async function parseSlideLayouts(zip, analysis) {
  const layoutFiles = zip.file(/ppt\/slideLayouts\/slideLayout\d+\.xml/);

  for (const layoutFile of layoutFiles) {
    const xml = await layoutFile.async('text');

    // Extract content areas from layouts
    const spMatches = xml.matchAll(/<p:sp>[\s\S]*?<a:off x="(\d+)" y="(\d+)"[\s\S]*?<a:ext cx="(\d+)" cy="(\d+)"/gi);

    for (const match of spMatches) {
      const x = emuToPixels(match[1]);
      const y = emuToPixels(match[2]);
      const width = emuToPixels(match[3]);
      const height = emuToPixels(match[4]);

      // Track margins (distance from edges)
      if (analysis.layouts.slideSize.width > 0) {
        const leftMargin = x;
        const rightMargin = analysis.layouts.slideSize.width - x - width;
        const topMargin = y;
        const bottomMargin = analysis.layouts.slideSize.height - y - height;

        if (leftMargin > 10) analysis.spacing.margins.push(leftMargin);
        if (rightMargin > 10) analysis.spacing.margins.push(rightMargin);
        if (topMargin > 10) analysis.spacing.margins.push(topMargin);
        if (bottomMargin > 10) analysis.spacing.margins.push(bottomMargin);
      }

      analysis.layouts.contentAreas.push({ x, y, width, height });
    }
  }
}

/**
 * Parse all slides for patterns
 */
async function parseSlides(zip, analysis) {
  const slideFiles = zip.file(/ppt\/slides\/slide\d+\.xml/);
  analysis.slideCount = slideFiles.length;

  for (const slideFile of slideFiles) {
    const xml = await slideFile.async('text');

    // Track color usage
    const colorPatterns = [
      /<a:srgbClr val="([A-Fa-f0-9]{6})"/gi,
      /val="([A-Fa-f0-9]{6})"/gi,
      /lastClr="([A-Fa-f0-9]{6})"/gi
    ];

    for (const regex of colorPatterns) {
      let match;
      while ((match = regex.exec(xml)) !== null) {
        const color = '#' + match[1].toLowerCase();
        if (isNearWhiteOrBlack(color)) continue;

        if (!analysis.patterns.colorUsage[color]) {
          analysis.patterns.colorUsage[color] = { frequency: 0, contexts: [] };
        }
        analysis.patterns.colorUsage[color].frequency++;

        // Detect context
        const contextBefore = xml.substring(Math.max(0, match.index - 150), match.index);
        if (contextBefore.includes('solidFill') && contextBefore.includes('spPr')) {
          addUniqueContext(analysis.patterns.colorUsage[color].contexts, 'background');
        } else if (contextBefore.includes('rPr') || contextBefore.includes('defRPr')) {
          addUniqueContext(analysis.patterns.colorUsage[color].contexts, 'text');
        } else if (contextBefore.includes('ln>') || contextBefore.includes('lnRef')) {
          addUniqueContext(analysis.patterns.colorUsage[color].contexts, 'border');
        }
      }
    }

    // Extract spacing values
    const posMatches = xml.matchAll(/(?:x|y|cx|cy)="(\d+)"/gi);
    for (const match of posMatches) {
      const px = emuToPixels(match[1]);
      if (px > 0 && px < 300) {
        analysis.spacing.gridValues.push(px);
      }
    }

    // Extract gap values (between elements)
    const offMatches = [...xml.matchAll(/<a:off x="(\d+)" y="(\d+)"/gi)];
    for (let i = 1; i < offMatches.length; i++) {
      const prevY = emuToPixels(offMatches[i-1][2]);
      const currY = emuToPixels(offMatches[i][2]);
      const gap = Math.abs(currY - prevY);
      if (gap > 5 && gap < 200) {
        analysis.spacing.gaps.push(gap);
      }
    }
  }
}

/**
 * Extract all media assets (skip those already extracted from master/layouts)
 */
async function extractAllMedia(zip, analysis) {
  const mediaFiles = zip.file(/ppt\/media\/.+/);

  // Get already extracted filenames to avoid duplicates
  const existingAssets = new Set([
    ...analysis.extractedAssets.logos.map(a => a.name),
    ...analysis.extractedAssets.images.map(a => a.name),
    ...analysis.extractedAssets.icons.map(a => a.name),
    ...analysis.extractedAssets.backgrounds.map(a => a.name)
  ]);

  for (const media of mediaFiles) {
    const filename = media.name.split('/').pop();

    // Skip if already extracted from master/layout
    if (existingAssets.has(filename)) {
      continue;
    }

    const ext = filename.split('.').pop().toLowerCase();

    if (!['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'emf', 'wmf'].includes(ext)) {
      continue;
    }

    const blob = await media.async('blob');
    let dataUrl;
    let isSvg = false;

    // Special handling for SVG files
    if (ext === 'svg') {
      // Read SVG as text first to ensure proper handling
      const svgText = await media.async('text');
      dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
      isSvg = true;
    } else {
      dataUrl = await blobToDataUrl(blob);
    }

    // Analyze image properties
    const dimensions = isSvg ? await getSvgDimensions(await media.async('text')) : await getImageDimensions(dataUrl);
    const assetType = classifyImage(filename, blob.size, dimensions);

    const asset = {
      name: filename,
      data: dataUrl,
      size: blob.size,
      type: assetType,
      source: 'slides',
      dimensions,
      isVector: isSvg || ext === 'emf' || ext === 'wmf',
      confidence: calculateAssetConfidence(filename, blob.size, dimensions, assetType)
    };

    // Categorize asset
    switch (assetType) {
      case 'logo':
        analysis.extractedAssets.logos.push(asset);
        break;
      case 'icon':
        analysis.extractedAssets.icons.push(asset);
        break;
      case 'background':
        analysis.extractedAssets.backgrounds.push(asset);
        break;
      default:
        analysis.extractedAssets.images.push(asset);
    }
  }

  // Also look for SVG files that might be stored with alternate extensions
  // PowerPoint sometimes stores SVG data inside image1.svg.png or similar
  await extractEmbeddedSvgs(zip, analysis, existingAssets);

  // Sort by confidence (master assets should be first due to higher confidence)
  analysis.extractedAssets.logos.sort((a, b) => b.confidence - a.confidence);
  analysis.extractedAssets.images.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Look for embedded SVG data in various locations
 */
async function extractEmbeddedSvgs(zip, analysis, existingAssets) {
  // Check for SVG stored in different locations
  const possibleSvgLocations = [
    /ppt\/media\/.*\.svg$/i,
    /ppt\/embeddings\/.*\.svg$/i,
    /docProps\/.*\.svg$/i
  ];

  for (const pattern of possibleSvgLocations) {
    const svgFiles = zip.file(pattern);

    for (const svgFile of svgFiles) {
      const filename = svgFile.name.split('/').pop();
      if (existingAssets.has(filename)) continue;

      try {
        const svgText = await svgFile.async('text');

        // Verify it's actual SVG content
        if (!svgText.includes('<svg') && !svgText.includes('<?xml')) continue;

        const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
        const dimensions = await getSvgDimensions(svgText);

        const asset = {
          name: filename,
          data: dataUrl,
          size: svgText.length,
          type: 'logo', // SVGs are typically logos
          source: svgFile.name.includes('embeddings') ? 'embedded' : 'media',
          dimensions,
          isVector: true,
          confidence: 0.85
        };

        analysis.extractedAssets.logos.push(asset);
        existingAssets.add(filename);
      } catch (e) {
        console.warn('Failed to extract SVG:', filename, e);
      }
    }
  }

  // Check for svgBlip references in slide XML (Office 2019+ feature)
  const slideFiles = zip.file(/ppt\/slides\/slide\d+\.xml/);

  for (const slideFile of slideFiles) {
    const xml = await slideFile.async('text');

    // Look for asvg:svgBlip references (modern SVG embedding)
    const svgBlipMatches = xml.matchAll(/asvg:svgBlip[^>]*r:embed="(rId\d+)"/gi);

    for (const match of svgBlipMatches) {
      const relId = match[1];
      const slideNum = slideFile.name.match(/slide(\d+)/)?.[1];

      // Get the relationship file
      const relsFile = zip.file(`ppt/slides/_rels/slide${slideNum}.xml.rels`);
      if (!relsFile) continue;

      const relsXml = await relsFile.async('text');
      const targetMatch = relsXml.match(new RegExp(`Id="${relId}"[^>]*Target="([^"]+)"`, 'i'));

      if (targetMatch) {
        let svgPath = targetMatch[1];
        if (svgPath.startsWith('../')) {
          svgPath = 'ppt/' + svgPath.substring(3);
        }

        const svgFile = zip.file(svgPath);
        if (svgFile) {
          const filename = svgPath.split('/').pop();
          if (existingAssets.has(filename)) continue;

          try {
            const svgText = await svgFile.async('text');
            const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
            const dimensions = await getSvgDimensions(svgText);

            const asset = {
              name: filename,
              data: dataUrl,
              size: svgText.length,
              type: 'logo',
              source: 'svgBlip',
              dimensions,
              isVector: true,
              confidence: 0.9
            };

            analysis.extractedAssets.logos.push(asset);
            existingAssets.add(filename);
          } catch (e) {
            console.warn('Failed to extract svgBlip:', filename, e);
          }
        }
      }
    }
  }
}

/**
 * Classify image type
 */
function classifyImage(filename, size, dimensions) {
  const name = filename.toLowerCase();
  const { width, height } = dimensions || { width: 0, height: 0 };
  const aspectRatio = width && height ? width / height : 1;

  // Logo detection
  if (name.includes('logo')) return 'logo';
  if (name.includes('brand')) return 'logo';
  if (name.includes('mark')) return 'logo';

  // Icon detection
  if (name.includes('icon')) return 'icon';
  if (name.includes('symbol')) return 'icon';
  if (width && height && width < 150 && height < 150) return 'icon';

  // Background detection
  if (name.includes('background') || name.includes('bg')) return 'background';
  if (width && height && width > 1000 && height > 600) return 'background';

  // Small square-ish images are often logos
  if (size < 100000 && aspectRatio > 0.5 && aspectRatio < 2) return 'logo';

  return 'image';
}

/**
 * Calculate asset confidence
 */
function calculateAssetConfidence(filename, size, dimensions, type) {
  let confidence = 0.5;
  const name = filename.toLowerCase();

  if (type === 'logo') {
    if (name.includes('logo')) confidence += 0.3;
    if (name.includes('brand')) confidence += 0.2;
    if (size < 50000) confidence += 0.1;
    if (dimensions && dimensions.width < 500) confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Analyze relationships for logo positions
 */
async function analyzeRelationships(zip, analysis) {
  // Check slide relationships for image positions
  const relFiles = zip.file(/ppt\/slides\/_rels\/slide\d+\.xml\.rels/);

  for (const relFile of relFiles) {
    const xml = await relFile.async('text');

    // Find image relationships
    const imageRels = xml.matchAll(/Target="\.\.\/media\/([^"]+)"/gi);
    for (const match of imageRels) {
      const imageName = match[1];
      const logo = analysis.extractedAssets.logos.find(l => l.name === imageName);

      if (logo) {
        // Try to find position from corresponding slide
        const slideNum = relFile.name.match(/slide(\d+)/)?.[1];
        if (slideNum) {
          const slideFile = zip.file(`ppt/slides/slide${slideNum}.xml`);
          if (slideFile) {
            const slideXml = await slideFile.async('text');
            const posMatch = slideXml.match(new RegExp(`${imageName}[\\s\\S]*?<a:off x="(\\d+)" y="(\\d+)"`, 'i'));

            if (posMatch) {
              logo.position = {
                x: emuToPixels(posMatch[1]),
                y: emuToPixels(posMatch[2]),
                slide: parseInt(slideNum)
              };

              // Determine position category
              const slideWidth = analysis.layouts.slideSize.width || 960;
              const slideHeight = analysis.layouts.slideSize.height || 540;

              if (logo.position.x < slideWidth * 0.3 && logo.position.y < slideHeight * 0.3) {
                logo.positionCategory = 'top-left';
              } else if (logo.position.x > slideWidth * 0.7 && logo.position.y < slideHeight * 0.3) {
                logo.positionCategory = 'top-right';
              } else if (logo.position.x < slideWidth * 0.3 && logo.position.y > slideHeight * 0.7) {
                logo.positionCategory = 'bottom-left';
              } else if (logo.position.x > slideWidth * 0.7 && logo.position.y > slideHeight * 0.7) {
                logo.positionCategory = 'bottom-right';
              } else {
                logo.positionCategory = 'center';
              }

              analysis.layouts.logoPositions.push({
                name: imageName,
                position: logo.positionCategory,
                x: logo.position.x,
                y: logo.position.y
              });
            }
          }
        }
      }
    }
  }
}

/**
 * Finalize analysis and calculate patterns
 */
function finalizeAnalysis(analysis) {
  // Calculate common spacing values
  const spacingFrequency = {};
  [...analysis.spacing.margins, ...analysis.spacing.gaps, ...analysis.spacing.gridValues].forEach(v => {
    const rounded = Math.round(v / 4) * 4; // Round to nearest 4px
    spacingFrequency[rounded] = (spacingFrequency[rounded] || 0) + 1;
  });

  analysis.spacing.commonSpacings = Object.entries(spacingFrequency)
    .filter(([, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([spacing]) => parseInt(spacing));

  // Detect grid system
  const gridCandidates = [4, 8, 10, 12, 16, 20, 24];
  let bestGrid = 8;
  let bestScore = 0;

  for (const base of gridCandidates) {
    const score = analysis.spacing.commonSpacings.filter(s => s % base === 0).length;
    if (score > bestScore) {
      bestScore = score;
      bestGrid = base;
    }
  }

  analysis.patterns.detectedGridValues = analysis.spacing.commonSpacings;
  analysis.patterns.gridBase = bestGrid;

  // Calculate unique font sizes
  analysis.typography.fontSizes = [...new Set(analysis.typography.fontSizes)]
    .filter(s => s > 6 && s < 200)
    .sort((a, b) => a - b);

  // Convert sets to arrays
  analysis.typography.fontWeights = [...analysis.typography.fontWeights];
  analysis.typography.textTransforms = [...analysis.typography.textTransforms];

  // Calculate overall confidence
  let confidenceScore = 0;
  if (analysis.theme.colors.length > 0) confidenceScore += 0.2;
  if (analysis.theme.fonts.major) confidenceScore += 0.15;
  if (analysis.theme.fonts.minor) confidenceScore += 0.1;
  if (analysis.extractedAssets.logos.length > 0) confidenceScore += 0.2;
  if (analysis.spacing.commonSpacings.length > 3) confidenceScore += 0.15;
  if (analysis.typography.fontSizes.length > 2) confidenceScore += 0.1;
  if (analysis.slideCount > 0) confidenceScore += 0.1;

  analysis.confidence = Math.min(confidenceScore, 1.0);
}

// ============================================
// Helper Functions
// ============================================

function emuToPixels(emu) {
  return Math.round(parseInt(emu) / 914400 * 96);
}

function isNearWhiteOrBlack(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return luminance < 30 || luminance > 225;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function addUniqueContext(contexts, context) {
  if (!contexts.includes(context)) {
    contexts.push(context);
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    if (dataUrl.startsWith('data:image/svg')) {
      resolve({ width: 100, height: 100 }); // SVG default
      return;
    }

    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

/**
 * Extract dimensions from SVG content
 */
function getSvgDimensions(svgText) {
  try {
    // Try to get width/height from SVG attributes
    const widthMatch = svgText.match(/width=["']?(\d+(?:\.\d+)?)(px|pt|em|%)?["']?/i);
    const heightMatch = svgText.match(/height=["']?(\d+(?:\.\d+)?)(px|pt|em|%)?["']?/i);

    if (widthMatch && heightMatch) {
      return {
        width: parseFloat(widthMatch[1]),
        height: parseFloat(heightMatch[1])
      };
    }

    // Try viewBox
    const viewBoxMatch = svgText.match(/viewBox=["']?\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)["']?/i);
    if (viewBoxMatch) {
      return {
        width: parseFloat(viewBoxMatch[1]),
        height: parseFloat(viewBoxMatch[2])
      };
    }
  } catch (e) {
    console.warn('Failed to parse SVG dimensions');
  }

  return { width: 100, height: 100 }; // Default
}

export default analyzePptx;
