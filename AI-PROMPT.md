# AI Prompt: Brand Engine - Simplified Brand Content Generator

## Projektbeschreibung

Baue eine React Web-App mit Vite, die in 3 einfachen Schritten markenkonformen Marketing-Content generiert.

## Der Flow

```
SCHRITT 1: UPLOAD
┌─────────────────────────────────────────────────────┐
│                                                     │
│         Brand-Dokument hochladen                    │
│         (PDF, PPTX oder Logo-Bild)                  │
│                                                     │
│         [ Drag & Drop Zone ]                        │
│                                                     │
│  → KI analysiert automatisch:                       │
│    - Farben (Primary, Secondary, Accent)            │
│    - Schriften (Heading, Body)                      │
│    - Tone of Voice                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
                        ↓
SCHRITT 2: GENERIEREN
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Erkannte Brand CI:                                 │
│  [■ Primary] [■ Secondary] [■ Accent]               │
│                                                     │
│  Was möchtest du erstellen?                         │
│                                                     │
│  [ Website ]  [ Flyer ]  [ Social Media ]           │
│  [ E-Mail ]   [ Präsentation ]                      │
│                                                     │
│  Optional: Kurze Beschreibung                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ z.B. "Landingpage für E-Auto Service"       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│            [ ✦ Generieren ]                         │
│                                                     │
└─────────────────────────────────────────────────────┘
                        ↓
SCHRITT 3: ERGEBNIS
┌─────────────────────────────────────────────────────┐
│                                                     │
│         [ LIVE PREVIEW ]                            │
│                                                     │
│    Generierte Website/Flyer/etc.                    │
│    in den extrahierten Brand-Farben                 │
│                                                     │
│  Export: [ PDF ] [ PNG ] [ HTML ] [ Kopieren ]      │
│                                                     │
│  [ Anderes Asset ]  [ Neues Brand ]                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Vanilla CSS (Apple-inspired Design)
- **AI Backend:** Claude API (Anthropic) via Vercel Edge Functions
- **PDF Analyse:** pdf-lib + Claude Vision API
- **Export:** html2canvas, jsPDF

## Komponenten-Struktur

```
src/
├── App.jsx                 # Root mit Login-Check
├── components/
│   └── simple/
│       ├── SimpleBrandEngine.jsx  # Haupt-Orchestrator (3 Steps)
│       ├── UploadStep.jsx         # Drag & Drop + AI-Analyse
│       ├── GenerateStep.jsx       # Asset-Auswahl + Generierung
│       └── ResultStep.jsx         # Preview + Export
├── lib/
│   ├── ai.js                      # Content-Generierung mit Claude
│   └── analyzer/
│       └── ai-analyzer.js         # PDF/Bild-Analyse mit Claude
└── styles.css
```

## API Endpoints (Vercel Edge Functions)

### POST /api/analyze-brand
Analysiert hochgeladene Dokumente mit Claude Vision.

**Request:**
```json
{
  "files": [
    { "type": "document", "data": "base64...", "name": "brand-guide.pdf" }
  ]
}
```

**Response:**
```json
{
  "colors": [
    { "hex": "#EA1B0A", "name": "Primary Red", "role": "primary" },
    { "hex": "#00A9A5", "name": "Accent Teal", "role": "accent" }
  ],
  "fonts": [
    { "name": "Helvetica Neue", "role": "heading" },
    { "name": "Arial", "role": "body" }
  ],
  "toneOfVoice": "Professionell, aber freundlich. Du-Ansprache."
}
```

### POST /api/generate-content
Generiert Marketing-Content basierend auf Brand und Asset-Typ.

**Request:**
```json
{
  "brandPrompt": "Du bist Marketing-Texter für Marke X. Tonalität: professionell...",
  "userPrompt": "Generiere eine Landingpage mit Hero, Features, CTA..."
}
```

**Response:**
```json
{
  "content": "# HERO-BEREICH\n\n**Headline:** Die Zukunft beginnt heute..."
}
```

## Asset-Typen und Strukturen

### Website/Landingpage
- Hero: Headline, Subline, CTA-Button
- 3 Features mit Titel + Beschreibung
- Trust/Über uns Sektion
- Footer CTA

### Flyer
- Vorderseite: Headline, Subline, Eyecatcher
- Innenseite: Einleitung, 4 Benefits
- Rückseite: CTA, Kontakt, Slogan

### Social Media
- 5 Posts mit: Hook, Haupttext, CTA, Hashtags, Bildidee

### E-Mail/Newsletter
- Betreffzeile, Preheader
- Anrede, Einleitung
- 3 Content-Abschnitte
- CTA-Button, P.S.

### Präsentation
- 10 Slides: Titel, Problem, Lösung, 3x Features, Social Proof, Team, Angebot, CTA

## Design-Richtlinien

### Farben (CSS Variables)
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f7;
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --accent: #0071e3;
  --border: rgba(0, 0, 0, 0.08);
}
```

### Typografie
- Font: -apple-system, SF Pro, Helvetica Neue
- Große Headlines (28px), subtile Hints (13px)

### UI-Elemente
- Abgerundete Ecken (12-20px)
- Subtile Schatten
- Viel Whitespace
- Große, klickbare Buttons

## Wichtige Features

1. **Drag & Drop Upload** - Große, einladende Drop-Zone
2. **Automatische AI-Analyse** - Keine manuellen Einstellungen nötig
3. **Ein-Klick-Generierung** - Kein kompliziertes Briefing-Formular
4. **Live Preview** - Sofort sehen was generiert wurde
5. **Multi-Format Export** - PDF, PNG, HTML, Text kopieren
6. **Responsive Design** - Funktioniert auf Desktop und Tablet

## Beispiel-Nutzung

1. User lädt "E.ON Brand Guide.pdf" hoch
2. AI extrahiert: Rot (#EA1B0A), Türkis (#00A9A5), Lila (#8B1E6B)
3. User wählt "Website" und tippt "Ladestation für Elektroautos"
4. AI generiert komplette Landingpage-Texte in E.ON-Tonalität
5. Preview zeigt Website mit E.ON-Farben
6. User exportiert als PDF

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Deployment

- Vercel (empfohlen) - Auto-Deploy von GitHub
- Edge Functions für API-Routen

---

**Ziel:** Maximale Einfachheit. 3-4 Klicks von Upload bis Export. Die KI macht die Arbeit, der User entscheidet nur WAS erstellt werden soll.
