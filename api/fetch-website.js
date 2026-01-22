// Vercel Serverless Function - Website Content Fetcher
// Reads website text, structure, and meta info for AI analysis

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch the website with a reasonable timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandEngineBot/1.0; +https://tyrn.on)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Website returned ${response.status}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();

    // Parse HTML content
    const result = parseWebsiteContent(html, parsedUrl.origin);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return new Response(JSON.stringify({
      error: error.name === 'AbortError'
        ? 'Website took too long to respond'
        : 'Failed to fetch website'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Parse HTML content and extract meaningful marketing-relevant information
 */
function parseWebsiteContent(html, baseUrl) {
  // Extract meta information
  const title = extractTag(html, 'title') || '';
  const metaDescription = extractMeta(html, 'description') || extractMeta(html, 'og:description') || '';
  const metaKeywords = extractMeta(html, 'keywords') || '';
  const ogTitle = extractMeta(html, 'og:title') || '';
  const ogImage = extractMeta(html, 'og:image') || '';

  // Remove script, style, and other non-content elements
  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Extract headings
  const h1s = extractAllTags(cleanHtml, 'h1');
  const h2s = extractAllTags(cleanHtml, 'h2');
  const h3s = extractAllTags(cleanHtml, 'h3');

  // Extract paragraphs and list items
  const paragraphs = extractAllTags(cleanHtml, 'p');
  const listItems = extractAllTags(cleanHtml, 'li');

  // Extract links with text (for navigation understanding)
  const links = extractLinks(cleanHtml);

  // Extract buttons and CTAs
  const buttons = extractAllTags(cleanHtml, 'button');
  const inputSubmits = extractInputValues(cleanHtml);

  // Extract any visible text content as fallback
  const bodyText = extractBodyText(cleanHtml);

  // Structure the result
  const structure = {
    meta: {
      title: cleanText(title),
      description: cleanText(metaDescription),
      keywords: cleanText(metaKeywords),
      ogTitle: cleanText(ogTitle),
      ogImage,
    },
    headings: {
      h1: h1s.slice(0, 5).map(cleanText),
      h2: h2s.slice(0, 10).map(cleanText),
      h3: h3s.slice(0, 10).map(cleanText),
    },
    content: {
      paragraphs: paragraphs.slice(0, 20).map(cleanText).filter(p => p.length > 20),
      listItems: listItems.slice(0, 20).map(cleanText).filter(l => l.length > 5),
    },
    navigation: links.slice(0, 15),
    ctas: [...buttons, ...inputSubmits].slice(0, 10).map(cleanText).filter(Boolean),
    summary: generateSummary(bodyText),
  };

  return structure;
}

/**
 * Extract single tag content
 */
function extractTag(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1] : null;
}

/**
 * Extract all instances of a tag
 */
function extractAllTags(html, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * Extract meta tag content
 */
function extractMeta(html, name) {
  // Try name attribute
  let match = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (match) return match[1];

  // Try content before name
  match = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'));
  if (match) return match[1];

  // Try property attribute (for og: tags)
  match = html.match(new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (match) return match[1];

  match = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, 'i'));
  return match ? match[1] : null;
}

/**
 * Extract links with their text
 */
function extractLinks(html) {
  const regex = /<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)</gi;
  const links = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = cleanText(match[2]);
    if (text && text.length > 1 && text.length < 50) {
      links.push(text);
    }
  }
  return [...new Set(links)];
}

/**
 * Extract button/submit input values
 */
function extractInputValues(html) {
  const regex = /<input[^>]*type=["']submit["'][^>]*value=["']([^"']*)["']/gi;
  const values = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    values.push(match[1]);
  }
  return values;
}

/**
 * Extract all visible body text
 */
function extractBodyText(html) {
  // Remove remaining HTML tags
  let text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a text summary for AI context
 */
function generateSummary(bodyText) {
  // Take first 3000 characters of body text as summary
  const summary = bodyText.slice(0, 3000);
  return summary.length === 3000 ? summary + '...' : summary;
}
