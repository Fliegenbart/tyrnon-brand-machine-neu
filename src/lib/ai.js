// ============================================
// AI SERVICES - Text, Image, Web Scraping
// Uses Claude API via serverless function for text generation
// ============================================

const getOpenAIKey = () => {
  return localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY || null;
};

/**
 * Generiert einen System-Prompt basierend auf der Brand Voice
 */
export function buildBrandPrompt(brand) {
  const toneDescriptions = {
    professional: 'professionell, sachlich und kompetent',
    friendly: 'freundlich, nahbar und warm',
    innovative: 'innovativ, visionär und zukunftsorientiert',
    premium: 'exklusiv, hochwertig und elegant',
    playful: 'spielerisch, locker und humorvoll',
    trustworthy: 'vertrauenswürdig, seriös und zuverlässig'
  };

  const formalityGuide = {
    du: 'Verwende die informelle "Du"-Ansprache.',
    sie: 'Verwende die formelle "Sie"-Ansprache.',
    wir: 'Verwende eine inklusive "Wir"-Perspektive.'
  };

  const dos = brand.voice.dos ? brand.voice.dos.split(',').map(s => s.trim()).filter(Boolean) : [];
  const donts = brand.voice.donts ? brand.voice.donts.split(',').map(s => s.trim()).filter(Boolean) : [];

  return `Du bist ein erfahrener Marketing-Texter und Content-Stratege für die Marke "${brand.name}".

TONALITÄT: ${toneDescriptions[brand.voice.tone] || 'professionell'}
ANSPRACHE: ${formalityGuide[brand.voice.formality] || formalityGuide.sie}
${brand.voice.tagline ? `KERNBOTSCHAFT/CLAIM: "${brand.voice.tagline}"` : ''}

${dos.length > 0 ? `BEVORZUGTE WÖRTER/PHRASEN: ${dos.join(', ')}` : ''}
${donts.length > 0 ? `VERMEIDE DIESE WÖRTER: ${donts.join(', ')}` : ''}

Schreibe immer auf Deutsch, sei prägnant und markenkonform. Liefere hochwertige, einsatzbereite Texte.`;
}

/**
 * Asset-spezifische Strukturen für komplette Generierung
 */
export const assetStructures = {
  website: {
    name: 'Website / Landingpage',
    structure: `Generiere alle Texte für eine Landingpage:

1. HERO-BEREICH:
   - Headline (max. 8 Wörter, kraftvoll)
   - Subline (1-2 Sätze)
   - CTA-Button (2-4 Wörter)

2. FEATURES/VORTEILE (3 Stück):
   Je Feature:
   - Titel (3-5 Wörter)
   - Beschreibung (2-3 Sätze)

3. ÜBER UNS / TRUST:
   - Titel
   - Absatz (3-4 Sätze)

4. CALL-TO-ACTION BEREICH:
   - Überschrift
   - Text (1-2 Sätze)
   - Button-Text

5. FOOTER:
   - Kurze Unternehmensbeschreibung (1 Satz)`
  },
  flyer: {
    name: 'Flyer / Broschüre',
    structure: `Generiere alle Texte für einen Flyer:

1. VORDERSEITE:
   - Headline (max. 6 Wörter, Aufmerksamkeit erregend)
   - Subline (max. 15 Wörter)
   - Eyecatcher-Text (1 kurzer Satz oder Phrase)

2. INNENSEITE:
   - Einleitung (2-3 Sätze)
   - 4 Key Benefits (je 1-2 Sätze)
   - Zitat/Testimonial (optional, erfinde ein passendes)

3. RÜCKSEITE:
   - Call-to-Action Headline
   - Kontakt-Aufforderung (1 Satz)
   - Slogan/Claim`
  },
  social: {
    name: 'Social Media Kampagne',
    structure: `Generiere eine Social Media Kampagne (5 Posts):

Für jeden Post liefere:
- HOOK (erster Satz, Aufmerksamkeit)
- HAUPTTEXT (2-4 Sätze)
- CALL-TO-ACTION
- HASHTAGS (5-7)
- BILDIDEE (kurze Beschreibung für passendes Visual)

Posts sollten variieren: 1x informativ, 1x emotional, 1x Frage/Interaktion, 1x Angebot/Aktion, 1x Behind-the-Scenes/Authentisch`
  },
  email: {
    name: 'Newsletter / E-Mail',
    structure: `Generiere einen kompletten Newsletter:

1. BETREFFZEILE (max. 50 Zeichen, zum Öffnen animierend)
2. PREHEADER (max. 100 Zeichen)
3. ANREDE
4. EINLEITUNG (2-3 Sätze, Hook)
5. HAUPTTEIL:
   - Abschnitt 1: Neuigkeit/Thema (3-4 Sätze)
   - Abschnitt 2: Mehrwert/Tipp (2-3 Sätze)
   - Abschnitt 3: Angebot/CTA (2 Sätze)
6. CTA-BUTTON-TEXT
7. ABSCHLUSS/GRUSS
8. P.S. (optional, verstärkt den CTA)`
  },
  presentation: {
    name: 'Präsentation / Pitch Deck',
    structure: `Generiere Texte für eine Präsentation (10 Slides):

SLIDE 1 - TITEL:
- Präsentationstitel
- Untertitel/Tagline

SLIDE 2 - PROBLEM:
- Headline
- 3 Bullet Points

SLIDE 3 - LÖSUNG:
- Headline
- Kernaussage (2 Sätze)

SLIDE 4-6 - FEATURES/VORTEILE:
Je Slide:
- Feature-Name
- Kurzbeschreibung
- Key Benefit

SLIDE 7 - SOCIAL PROOF:
- Headline
- 2-3 Kundenaussagen/Zahlen

SLIDE 8 - TEAM/ÜBER UNS:
- Headline
- Beschreibung

SLIDE 9 - ANGEBOT/PRICING:
- Headline
- Wertversprechen

SLIDE 10 - CTA/KONTAKT:
- Abschluss-Headline
- Call-to-Action`
  },
  businesscard: {
    name: 'Visitenkarte',
    structure: `Generiere Texte für eine Visitenkarte:

VORDERSEITE:
- Slogan/Tagline (optional, max. 5 Wörter)

RÜCKSEITE:
- Titel/Position (kreative Alternative falls gewünscht)
- Kurze Beschreibung der Tätigkeit (max. 10 Wörter)
- Call-to-Action oder Motto (optional)`
  }
};

/**
 * Generiert kompletten Asset-Content basierend auf Briefing
 * Uses Claude API via serverless function
 */
export async function generateCompleteAsset(brand, assetType, briefing, scrapedContent = null) {
  const brandPrompt = buildBrandPrompt(brand);
  const structure = assetStructures[assetType];

  if (!structure) {
    throw new Error(`Unbekannter Asset-Typ: ${assetType}`);
  }

  const contextInfo = scrapedContent
    ? `\n\nKONTEXT VON WEBSITE:\n${scrapedContent}\n\nNutze diese Informationen als Basis und Inspiration.`
    : '';

  const userPrompt = `${structure.structure}

BRIEFING: ${briefing}${contextInfo}

Liefere die Texte strukturiert und direkt einsetzbar. Formatiere klar mit den angegebenen Abschnitten.`;

  try {
    // Call Claude API via serverless function
    const response = await fetch('/api/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandPrompt,
        userPrompt
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      // Fallback to demo content if API fails
      console.warn('Claude API failed, using demo content:', error);
      return generateDemoAsset(brand, assetType, briefing);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('AI Generation failed:', error);
    // Fallback to demo content
    return generateDemoAsset(brand, assetType, briefing);
  }
}

/**
 * Fetch and analyze website content
 * Returns both raw extracted data and AI analysis
 */
export async function scrapeWebsite(url) {
  const apiKey = getOpenAIKey(); // Optional: for AI analysis

  // Step 1: Fetch actual website content via our serverless function
  let websiteData;
  try {
    const fetchResponse = await fetch('/api/fetch-website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!fetchResponse.ok) {
      const error = await fetchResponse.json();
      throw new Error(error.error || 'Website konnte nicht geladen werden');
    }

    websiteData = await fetchResponse.json();
  } catch (error) {
    console.error('Website fetch failed:', error);
    throw new Error(`Website-Abruf fehlgeschlagen: ${error.message}`);
  }

  // Format extracted data for display
  const extractedContent = formatExtractedContent(websiteData);

  // If no API key, return just the extracted content
  if (!apiKey) {
    return extractedContent;
  }

  // Step 2: Have AI analyze the extracted content
  const analysisPrompt = `Analysiere diese Website-Inhalte und extrahiere Marketing-relevante Insights:

WEBSITE META:
- Titel: ${websiteData.meta.title}
- Beschreibung: ${websiteData.meta.description}
- Keywords: ${websiteData.meta.keywords}

ÜBERSCHRIFTEN:
H1: ${websiteData.headings.h1.join(' | ')}
H2: ${websiteData.headings.h2.join(' | ')}

INHALTE:
${websiteData.content.paragraphs.slice(0, 10).join('\n\n')}

CALL-TO-ACTIONS:
${websiteData.ctas.join(', ')}

NAVIGATION:
${websiteData.navigation.join(', ')}

---

Analysiere und fasse zusammen:
1. **Value Proposition**: Was ist das Hauptversprechen?
2. **Kernbotschaften**: Die 3 wichtigsten Messages
3. **Zielgruppe**: Wer wird angesprochen?
4. **Tonalität**: Wie ist der Kommunikationsstil?
5. **Stärken**: Was macht die Website gut?
6. **Content-Ideen**: 3 Ideen, die wir für ähnliche Inhalte nutzen können`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Du bist ein erfahrener Marketing-Analyst. Analysiere Website-Inhalte präzise und liefere actionable Insights auf Deutsch.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      // Return extracted content without AI analysis
      return extractedContent;
    }

    const data = await response.json();
    const aiAnalysis = data.choices[0].message.content;

    return `📊 AI-ANALYSE

${aiAnalysis}

---

📄 EXTRAHIERTE INHALTE

${extractedContent}`;
  } catch (error) {
    console.error('AI analysis failed:', error);
    // Return extracted content without AI analysis
    return extractedContent;
  }
}

/**
 * Format extracted website data for display
 */
function formatExtractedContent(data) {
  const sections = [];

  if (data.meta.title) {
    sections.push(`**Titel:** ${data.meta.title}`);
  }
  if (data.meta.description) {
    sections.push(`**Meta-Beschreibung:** ${data.meta.description}`);
  }

  if (data.headings.h1.length > 0) {
    sections.push(`\n**Hauptüberschriften (H1):**\n${data.headings.h1.map(h => `• ${h}`).join('\n')}`);
  }
  if (data.headings.h2.length > 0) {
    sections.push(`\n**Zwischenüberschriften (H2):**\n${data.headings.h2.map(h => `• ${h}`).join('\n')}`);
  }

  if (data.content.paragraphs.length > 0) {
    sections.push(`\n**Haupttext-Auszüge:**\n${data.content.paragraphs.slice(0, 5).map(p => `"${p.slice(0, 200)}${p.length > 200 ? '...' : ''}"`).join('\n\n')}`);
  }

  if (data.ctas.length > 0) {
    sections.push(`\n**Call-to-Actions:**\n${data.ctas.map(c => `• ${c}`).join('\n')}`);
  }

  if (data.navigation.length > 0) {
    sections.push(`\n**Navigation:**\n${data.navigation.slice(0, 10).join(' | ')}`);
  }

  return sections.join('\n');
}

/**
 * Generiert ein Bild mit DALL-E (requires OpenAI API key)
 */
export async function generateImage(prompt, brand, style = 'modern') {
  const apiKey = getOpenAIKey();

  if (!apiKey) {
    throw new Error('OpenAI API-Key benötigt für Bildgenerierung (DALL-E)');
  }

  const styleGuides = {
    modern: 'modern, clean, minimalist design with bold colors',
    corporate: 'professional corporate style, clean and trustworthy',
    creative: 'creative, artistic, unique visual style',
    photo: 'photorealistic, high quality photography style',
    illustration: 'flat illustration style, vector-like graphics'
  };

  const enhancedPrompt = `${prompt}. Style: ${styleGuides[style] || styleGuides.modern}. Brand colors: ${brand.colors.primary} as primary. High quality, marketing-ready image.`;

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Bildgenerierung fehlgeschlagen');
    }

    const data = await response.json();
    return `data:image/png;base64,${data.data[0].b64_json}`;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw error;
  }
}

/**
 * Demo-Asset für Vorschau ohne API
 */
function generateDemoAsset(brand, assetType, briefing) {
  const formal = brand.voice.formality === 'sie';
  const anrede = formal ? 'Sie' : 'du';

  const demos = {
    website: `# HERO-BEREICH

**Headline:** ${briefing.split(' ').slice(0, 4).join(' ')} — Neu gedacht

**Subline:** Entdecken ${anrede} innovative Lösungen, die ${formal ? 'Ihren' : 'deinen'} Alltag verändern. ${brand.name} steht für Qualität und Vertrauen.

**CTA:** Jetzt entdecken

---

# FEATURES

**Feature 1: Einfach & Intuitiv**
Komplexe Herausforderungen verdienen elegante Lösungen. Unsere Plattform ist so gestaltet, dass ${anrede} sofort loslegen ${formal ? 'können' : 'kannst'}.

**Feature 2: Sicher & Zuverlässig**
${formal ? 'Ihre' : 'Deine'} Daten sind bei uns in besten Händen. Modernste Sicherheitsstandards garantieren Schutz.

**Feature 3: Schnell & Effizient**
Zeit ist wertvoll. Deshalb optimieren wir jeden Prozess für maximale Effizienz.

---

# ÜBER UNS

**Headline:** Wer wir sind

Bei ${brand.name} verbinden wir Innovation mit Tradition. Seit Jahren arbeiten wir daran, ${briefing.toLowerCase()} für unsere Kunden zugänglicher zu machen.

---

# CTA-BEREICH

**Headline:** Bereit für den nächsten Schritt?

${formal ? 'Kontaktieren Sie uns' : 'Kontaktiere uns'} noch heute und ${formal ? 'erfahren Sie' : 'erfahre'}, wie wir ${formal ? 'Ihnen' : 'dir'} helfen können.

**Button:** Gespräch vereinbaren`,

    flyer: `# VORDERSEITE

**Headline:** ${briefing.split(' ').slice(0, 3).join(' ')} erleben

**Subline:** ${brand.name} präsentiert die Zukunft von ${briefing.toLowerCase()}.

**Eyecatcher:** Jetzt neu!

---

# INNENSEITE

**Einleitung:** In einer Welt voller Möglichkeiten setzen wir auf das Wesentliche: Qualität, Innovation und ${formal ? 'Ihren' : 'deinen'} Erfolg.

**Benefits:**
• Höchste Qualitätsstandards für beste Ergebnisse
• Persönliche Betreuung von Anfang bis Ende
• Schnelle Umsetzung ${formal ? 'Ihrer' : 'deiner'} Projekte
• Faire und transparente Preise

---

# RÜCKSEITE

**CTA:** ${formal ? 'Starten Sie' : 'Starte'} jetzt!

**Kontakt:** ${formal ? 'Rufen Sie uns an' : 'Ruf uns an'} oder ${formal ? 'besuchen Sie' : 'besuch'} unsere Website.

**Claim:** ${brand.voice.tagline || `${brand.name} — Für ${formal ? 'Ihren' : 'deinen'} Erfolg.`}`,

    social: `# POST 1 — INFORMATIV

**Hook:** Wusstest ${anrede}, dass ${briefing.toLowerCase()} der Schlüssel zum Erfolg ist?

**Text:** Bei ${brand.name} haben wir es uns zur Mission gemacht, genau das zu ermöglichen. Mit innovativen Ansätzen und jahrelanger Erfahrung unterstützen wir ${formal ? 'Sie' : 'dich'} dabei, ${formal ? 'Ihre' : 'deine'} Ziele zu erreichen.

**CTA:** Mehr erfahren — Link in Bio

**Hashtags:** #${brand.name.replace(/\s/g, '')} #Innovation #Erfolg #Zukunft #Marketing

---

# POST 2 — EMOTIONAL

**Hook:** Der Moment, wenn alles klick macht. ✨

**Text:** Genau dieses Gefühl wollen wir ${formal ? 'Ihnen' : 'dir'} geben. ${brand.name} steht für Lösungen, die wirklich funktionieren — und für Menschen, die an ${formal ? 'Ihren' : 'deinen'} Erfolg glauben.

**CTA:** Was ist ${formal ? 'Ihr' : 'dein'} nächstes Ziel?

**Hashtags:** #Motivation #Erfolgsgeschichte #${brand.name.replace(/\s/g, '')}`,

    email: `**Betreff:** ${briefing.split(' ').slice(0, 4).join(' ')} — ${formal ? 'Ihre' : 'Deine'} Chance

**Preheader:** Entdecken ${anrede} jetzt, was ${brand.name} für ${formal ? 'Sie' : 'dich'} bereithält.

---

${formal ? 'Sehr geehrte Damen und Herren' : 'Hallo'},

${briefing} — ein Thema, das uns bei ${brand.name} besonders am Herzen liegt.

**Warum gerade jetzt?**
In Zeiten des Wandels braucht es Partner, auf die man sich verlassen kann. Wir sind seit Jahren an ${formal ? 'Ihrer' : 'deiner'} Seite und entwickeln Lösungen, die wirklich funktionieren.

**Unser Tipp für ${formal ? 'Sie' : 'dich'}:**
${formal ? 'Nehmen Sie sich' : 'Nimm dir'} heute 5 Minuten Zeit und ${formal ? 'entdecken Sie' : 'entdeck'}, wie wir ${formal ? 'Ihnen' : 'dir'} helfen können.

**Jetzt entdecken**

Mit besten Grüßen,
${formal ? 'Ihr' : 'Dein'} ${brand.name} Team

P.S. ${formal ? 'Antworten Sie' : 'Antworte'} einfach auf diese E-Mail — wir freuen uns auf den Austausch!`,

    presentation: `# SLIDE 1 — TITEL
**${brand.name}**
${brand.voice.tagline || briefing}

# SLIDE 2 — PROBLEM
**Die Herausforderung**
• Komplexität steigt täglich
• Ressourcen sind begrenzt
• Zeit wird knapper

# SLIDE 3 — LÖSUNG
**Unsere Antwort**
${brand.name} bietet die Lösung für ${briefing.toLowerCase()}. Einfach, effizient, effektiv.

# SLIDE 4-6 — FEATURES
**Feature 1: Effizienz**
Maximale Ergebnisse bei minimalem Aufwand.

**Feature 2: Innovation**
Immer einen Schritt voraus durch moderne Technologie.

**Feature 3: Support**
Persönliche Betreuung, wann immer ${anrede} sie ${formal ? 'brauchen' : 'brauchst'}.

# SLIDE 7 — SOCIAL PROOF
**Unsere Kunden vertrauen uns**
"${brand.name} hat unsere Erwartungen übertroffen." — Beispielkunde

# SLIDE 10 — CTA
**Nächste Schritte**
${formal ? 'Vereinbaren Sie' : 'Vereinbare'} jetzt ${formal ? 'Ihr' : 'dein'} kostenloses Beratungsgespräch.`,

    businesscard: `# VORDERSEITE
**${brand.voice.tagline || brand.name}**

# RÜCKSEITE
**Position:** Experte für ${briefing.toLowerCase()}
**Beschreibung:** Innovative Lösungen für ${formal ? 'Ihren' : 'deinen'} Erfolg
**Motto:** Gemeinsam mehr erreichen`
  };

  return demos[assetType] || `Demo-Content für ${assetType}:\n\n${briefing}`;
}

// Legacy exports for backwards compatibility
export const textTypes = {
  headline: {
    name: 'Headlines',
    icon: 'H',
    prompt: 'Generiere 5 verschiedene Headline-Varianten für das Thema. Jede sollte unter 10 Wörtern sein. Nummeriere sie 1-5.',
    placeholder: 'z.B. "Produktlaunch E-Mobility Lösung"'
  },
  subline: {
    name: 'Subline',
    icon: 'S',
    prompt: 'Schreibe eine überzeugende Subline (1-2 Sätze, max. 150 Zeichen) für das Thema.',
    placeholder: 'z.B. "Neue Ladeinfrastruktur für Unternehmen"'
  },
  cta: {
    name: 'Call-to-Actions',
    icon: 'C',
    prompt: 'Generiere 5 verschiedene Call-to-Action Button-Texte (je 2-4 Wörter) für das Thema.',
    placeholder: 'z.B. "Newsletter-Anmeldung"'
  }
};

export async function generateText(brand, textType, topic, apiKey = null) {
  const key = apiKey || getOpenAIKey();
  const brandPrompt = buildBrandPrompt(brand);
  const typeConfig = textTypes[textType];

  if (!key) {
    return `Demo: ${topic} — ${brand.voice.tagline || brand.name}`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: brandPrompt },
          { role: 'user', content: `${typeConfig?.prompt || 'Generiere passenden Text für:'}\n\nThema: ${topic}` }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    if (!response.ok) throw new Error('AI-Anfrage fehlgeschlagen');
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Generation failed:', error);
    throw error;
  }
}

export default {
  generateText,
  generateCompleteAsset,
  generateImage,
  scrapeWebsite,
  textTypes,
  assetStructures,
  buildBrandPrompt
};
