// Vercel Serverless Function - Content Generation with Claude API
// Generates marketing content for various asset types

export const config = {
  runtime: 'edge',
  maxDuration: 60,
};

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
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
    const { brandPrompt, userPrompt } = await request.json();

    if (!userPrompt) {
      return new Response(JSON.stringify({ error: 'No prompt provided' }), {
        status: 400,
        headers: corsHeaders(),
      });
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
        system: brandPrompt || 'Du bist ein erfahrener Marketing-Texter. Schreibe auf Deutsch.',
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);

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

    return new Response(JSON.stringify({ content: textContent.text }), {
      status: 200,
      headers: corsHeaders(),
    });

  } catch (error) {
    console.error('Generation error:', error);
    return new Response(JSON.stringify({
      error: 'Generation failed',
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
