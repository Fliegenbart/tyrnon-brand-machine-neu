// ============================================
// AI ANALYZER - Use Claude API for brand extraction
// Sends documents to serverless function for analysis
// ============================================

import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Set worker path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Max file size for API (4MB to be safe)
const MAX_FILE_SIZE = 4 * 1024 * 1024;
// Max pages to extract from large PDFs
const MAX_PDF_PAGES = 10;

/**
 * Analyze files using Claude AI
 * @param {File[]} files - Array of files to analyze
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Extracted brand data
 */
export async function analyzeWithAI(files, onProgress = () => {}) {
  onProgress(5);

  // Convert files to base64
  const preparedFiles = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress(10 + (i / files.length) * 30);

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Handle PDFs - slice if too large
      const pdfData = await processPdf(file, onProgress);
      preparedFiles.push({
        type: 'document',
        data: pdfData,
        name: file.name
      });
    } else if (file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      preparedFiles.push({
        type: 'image',
        data: base64,
        mediaType: file.type,
        name: file.name
      });
    }
  }

  if (preparedFiles.length === 0) {
    throw new Error('Keine analysierbaren Dateien gefunden');
  }

  onProgress(50);

  // Call the serverless function
  const apiUrl = getApiUrl('/api/analyze-brand');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: preparedFiles })
  });

  onProgress(80);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('API Error:', error);
    throw new Error(error.error || `API Fehler: ${response.status}`);
  }

  const brandData = await response.json();
  onProgress(100);

  // Transform Claude's response to our format
  return transformToPreviewFormat(brandData);
}

/**
 * Process PDF - slice to first N pages if too large
 */
async function processPdf(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();

  // Check if file is small enough
  if (file.size <= MAX_FILE_SIZE) {
    // Convert directly to base64
    return arrayBufferToBase64(arrayBuffer);
  }

  // File is too large - extract first N pages
  console.log(`PDF too large (${(file.size / 1024 / 1024).toFixed(1)}MB), extracting first ${MAX_PDF_PAGES} pages...`);

  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();
    const pagesToKeep = Math.min(totalPages, MAX_PDF_PAGES);

    // Create new PDF with only first pages
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdfDoc, Array.from({ length: pagesToKeep }, (_, i) => i));

    for (const page of pages) {
      newPdf.addPage(page);
    }

    const newPdfBytes = await newPdf.save();
    console.log(`Reduced PDF from ${totalPages} to ${pagesToKeep} pages (${(newPdfBytes.length / 1024 / 1024).toFixed(1)}MB)`);

    return arrayBufferToBase64(newPdfBytes);
  } catch (err) {
    console.error('PDF slicing failed, trying original:', err);
    // Fallback to original (might fail with 413)
    return arrayBufferToBase64(arrayBuffer);
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get API URL (works for local dev and production)
 */
function getApiUrl(path) {
  // In development, Vite proxies to the API
  // In production (Vercel), the API is at the same domain
  if (import.meta.env.DEV) {
    // For local development, we need to use Vercel dev server
    // or fallback to localhost:3000 if API is proxied
    return path;
  }
  return path;
}

/**
 * Transform Claude's brand data to preview format
 */
function transformToPreviewFormat(data) {
  if (data.parseError) {
    console.warn('AI response parsing failed, returning raw data');
    return { colors: [], fonts: [], logos: [], raw: data.raw };
  }

  const colors = (data.colors || []).map(c => ({
    hex: c.hex?.toUpperCase() || c.hex,
    name: c.name,
    role: c.role,
    usage: c.usage,
    source: 'ai-analysis'
  }));

  const fonts = (data.fonts || []).map(f => ({
    name: f.name,
    usage: f.role === 'heading' ? 'heading' : f.role === 'body' ? 'body' : f.role,
    description: f.description,
    source: 'ai-analysis'
  }));

  const logos = (data.logos || []).map(l => ({
    description: l.description,
    format: l.format,
    source: 'ai-analysis'
  }));

  return {
    colors,
    fonts,
    logos,
    toneOfVoice: data.toneOfVoice,
    additionalNotes: data.additionalNotes
  };
}

export default analyzeWithAI;
