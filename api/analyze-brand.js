// Vercel Serverless Function - Brand Analysis with Claude API
// Analyzes PDF/images to extract brand elements (colors, fonts, logos)

export const config = {
  runtime: 'edge',
  maxDuration: 60, // Allow up to 60 seconds for Claude response
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
      headers: corsHeaders(),
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500,
      headers: corsHeaders(),
    });
  }

  try {
    const { files } = await request.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided' }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Build content array for Claude
    const content = [];

    // Add analysis prompt
    content.push({
      type: 'text',
      text: BRAND_ANALYSIS_PROMPT
    });

    // Add files (images or PDF pages)
    for (const file of files) {
      if (file.type === 'image') {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.mediaType || 'image/png',
            data: file.data
          }
        });
      } else if (file.type === 'document') {
        // PDF as document
        content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: file.data
          }
        });
      }
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);

      // Parse error for better message
      let errorMessage = 'Claude API error';
      try {
        const parsed = JSON.parse(errorData);
        errorMessage = parsed.error?.message || parsed.message || errorData;
      } catch {
        errorMessage = errorData;
      }

      return new Response(JSON.stringify({
        error: errorMessage,
        status: response.status
      }), {
        status: 500,
        headers: corsHeaders(),
      });
    }

    const data = await response.json();

    // Extract the text response
    const textContent = data.content?.find(c => c.type === 'text');
    if (!textContent?.text) {
      return new Response(JSON.stringify({ error: 'No response from Claude' }), {
        status: 500,
        headers: corsHeaders(),
      });
    }

    // Parse the JSON response from Claude
    const brandData = parseClaudeResponse(textContent.text);

    return new Response(JSON.stringify(brandData), {
      status: 200,
      headers: corsHeaders(),
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({
      error: 'Analysis failed',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
}

/**
 * Parse Claude's response and extract JSON
 */
function parseClaudeResponse(text) {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error('JSON parse error:', e);
    }
  }

  // Try parsing the whole text as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    // Return raw text if parsing fails
    return { raw: text, parseError: true };
  }
}

const BRAND_ANALYSIS_PROMPT = `Analysiere dieses Brand-Dokument und extrahiere alle Brand-Elemente.

Gib das Ergebnis als JSON zurück mit dieser Struktur:

\`\`\`json
{
  "colors": [
    {
      "hex": "#EA1B0A",
      "name": "Brand Red",
      "role": "primary",
      "usage": "Hauptfarbe für Akzente und CTAs"
    }
  ],
  "fonts": [
    {
      "name": "EON Headline",
      "role": "heading",
      "description": "Für Headlines und große Texte"
    },
    {
      "name": "EON Body",
      "role": "body",
      "description": "Für Fließtext"
    }
  ],
  "logos": [
    {
      "description": "Hauptlogo mit Claim",
      "format": "SVG oder PNG empfohlen"
    }
  ],
  "toneOfVoice": {
    "keywords": ["Einfach", "Auf den Punkt", "Empathisch"],
    "description": "Kurze Beschreibung des Tonfalls"
  },
  "additionalNotes": "Weitere wichtige Brand-Hinweise"
}
\`\`\`

Wichtige Regeln:
1. Extrahiere ALLE Farben die du findest mit ihrem exakten Hex-Code
2. Unterscheide zwischen Primär-, Sekundär- und Akzentfarben
3. Erkenne Schriftarten und ihre Verwendung
4. Beschreibe den Tone of Voice falls erkennbar
5. Gib NUR valides JSON zurück, keine anderen Erklärungen
6. Farben die als Gradients verwendet werden, extrahiere die Einzelfarben

Analysiere das Dokument jetzt:`;
