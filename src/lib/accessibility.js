// ============================================
// ACCESSIBILITY CHECKER - WCAG 2.1 Compliance
// ============================================

import { hexToRgb } from './tokens.js';

/**
 * Berechnet die relative Luminanz eines RGB-Farbwerts
 * nach WCAG 2.1 Formel
 */
export function getLuminance(rgb) {
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Berechnet das Kontrastverhältnis zwischen zwei Farben
 * Rückgabe: Wert zwischen 1:1 und 21:1
 */
export function getContrastRatio(color1Hex, color2Hex) {
  const rgb1 = hexToRgb(color1Hex);
  const rgb2 = hexToRgb(color2Hex);
  
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG Level-Bewertung
 */
export function getWCAGLevel(ratio, isLargeText = false) {
  if (isLargeText) {
    // Große Texte (>=18pt oder >=14pt bold)
    if (ratio >= 4.5) return { level: 'AAA', pass: true };
    if (ratio >= 3) return { level: 'AA', pass: true };
  } else {
    // Normale Texte
    if (ratio >= 7) return { level: 'AAA', pass: true };
    if (ratio >= 4.5) return { level: 'AA', pass: true };
  }
  return { level: 'Fail', pass: false };
}

/**
 * Vollständiger Accessibility-Check für eine Brand
 */
export function checkBrandAccessibility(brand) {
  const results = {
    score: 0,
    maxScore: 100,
    checks: [],
    warnings: [],
    errors: []
  };

  // 1. Text auf Hintergrund prüfen
  const textOnBg = checkContrast(
    brand.colors.text, 
    brand.colors.background,
    'Text auf Hintergrund',
    false
  );
  results.checks.push(textOnBg);

  // 2. Primary auf Hintergrund (für Buttons, Links)
  const primaryOnBg = checkContrast(
    brand.colors.primary,
    brand.colors.background,
    'Primärfarbe auf Hintergrund',
    true // als großer Text / UI-Element
  );
  results.checks.push(primaryOnBg);

  // 3. Weiß auf Primary (Button-Text)
  const whiteOnPrimary = checkContrast(
    '#ffffff',
    brand.colors.primary,
    'Weiß auf Primärfarbe (Button-Text)',
    false
  );
  results.checks.push(whiteOnPrimary);

  // 4. Weiß auf Accent
  const whiteOnAccent = checkContrast(
    '#ffffff',
    brand.colors.accent,
    'Weiß auf Akzentfarbe',
    false
  );
  results.checks.push(whiteOnAccent);

  // 5. Text auf Primary (falls als Hintergrund verwendet)
  const textOnPrimary = checkContrast(
    '#ffffff',
    brand.colors.primary,
    'Text auf Primär-Hintergrund',
    false
  );
  results.checks.push(textOnPrimary);

  // 6. Secondary Checks
  const textOnSecondary = checkContrast(
    '#ffffff',
    brand.colors.secondary,
    'Text auf Sekundär-Hintergrund',
    false
  );
  results.checks.push(textOnSecondary);

  // Score berechnen
  const passedChecks = results.checks.filter(c => c.wcag.pass);
  const aaaChecks = results.checks.filter(c => c.wcag.level === 'AAA');
  
  // Basis-Score: Prozent der bestandenen Tests
  results.score = Math.round((passedChecks.length / results.checks.length) * 70);
  
  // Bonus für AAA
  results.score += Math.round((aaaChecks.length / results.checks.length) * 30);

  // Warnings und Errors sammeln
  results.checks.forEach(check => {
    if (!check.wcag.pass) {
      results.errors.push({
        message: `${check.name}: Kontrast ${check.ratio.toFixed(1)}:1 ist zu niedrig`,
        suggestion: `Mindestens ${check.isLargeText ? '3:1' : '4.5:1'} für WCAG AA erforderlich`
      });
    } else if (check.wcag.level === 'AA' && !check.isLargeText) {
      results.warnings.push({
        message: `${check.name}: Nur AA-Level (${check.ratio.toFixed(1)}:1)`,
        suggestion: 'Für AAA-Level mindestens 7:1 anstreben'
      });
    }
  });

  // Gesamtbewertung
  if (results.score >= 90) {
    results.rating = 'Exzellent';
    results.ratingColor = '#22c55e';
  } else if (results.score >= 70) {
    results.rating = 'Gut';
    results.ratingColor = '#84cc16';
  } else if (results.score >= 50) {
    results.rating = 'Ausreichend';
    results.ratingColor = '#f59e0b';
  } else {
    results.rating = 'Kritisch';
    results.ratingColor = '#ef4444';
  }

  return results;
}

/**
 * Einzelner Kontrast-Check
 */
function checkContrast(fgColor, bgColor, name, isLargeText) {
  const ratio = getContrastRatio(fgColor, bgColor);
  const wcag = getWCAGLevel(ratio, isLargeText);
  
  return {
    name,
    foreground: fgColor,
    background: bgColor,
    ratio,
    wcag,
    isLargeText
  };
}

/**
 * Generiert Farbvorschläge für besseren Kontrast
 */
export function suggestBetterColor(fgColor, bgColor, targetRatio = 4.5) {
  const bgRgb = hexToRgb(bgColor);
  const bgLuminance = getLuminance(bgRgb);
  
  // Bestimme ob wir aufhellen oder abdunkeln sollten
  const shouldLighten = bgLuminance < 0.5;
  
  let bestColor = fgColor;
  let bestRatio = getContrastRatio(fgColor, bgColor);
  
  // Iterativ anpassen
  const fgRgb = hexToRgb(fgColor);
  
  for (let i = 0; i <= 100; i += 5) {
    const factor = i / 100;
    const newRgb = fgRgb.map(c => {
      if (shouldLighten) {
        return Math.min(255, c + (255 - c) * factor);
      } else {
        return Math.max(0, c * (1 - factor));
      }
    });
    
    const newHex = rgbToHex(newRgb);
    const newRatio = getContrastRatio(newHex, bgColor);
    
    if (newRatio >= targetRatio && newRatio > bestRatio) {
      bestColor = newHex;
      bestRatio = newRatio;
      break;
    }
  }
  
  return { color: bestColor, ratio: bestRatio };
}

/**
 * RGB zu Hex Konvertierung
 */
function rgbToHex(rgb) {
  return '#' + rgb.map(c => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Prüft ob eine Farbkombination für BITV 2.0 geeignet ist
 */
export function checkBITV(brand) {
  const results = checkBrandAccessibility(brand);
  
  // BITV 2.0 basiert auf WCAG 2.1 AA
  const bitvCompliant = results.checks.every(check => check.wcag.pass);
  
  return {
    compliant: bitvCompliant,
    level: bitvCompliant ? 'BITV 2.0 konform' : 'Nicht BITV 2.0 konform',
    details: results
  };
}

/**
 * Kurzübersicht für UI-Anzeige
 */
export function getAccessibilitySummary(brand) {
  const results = checkBrandAccessibility(brand);
  
  return {
    score: results.score,
    rating: results.rating,
    ratingColor: results.ratingColor,
    passCount: results.checks.filter(c => c.wcag.pass).length,
    totalChecks: results.checks.length,
    criticalErrors: results.errors.length,
    warnings: results.warnings.length
  };
}

export default { 
  checkBrandAccessibility, 
  getContrastRatio, 
  getWCAGLevel, 
  suggestBetterColor,
  checkBITV,
  getAccessibilitySummary
};
