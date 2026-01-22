# Brand Engine - Entwickler-Briefing

## Vision

Eine radikal einfache Web-App, die aus einem Brand-PDF automatisch Marketing-Content generiert. Keine komplizierten Einstellungen, keine Sidebars, keine Tabs. Nur 3 Schritte.

**Das Problem:** Bestehende Brand-Tools sind zu komplex. Man muss Farben manuell eingeben, Fonts auswählen, Tonalität definieren - bevor man überhaupt Content erstellen kann.

**Die Lösung:** PDF hochladen → KI lernt die Marke → Ein Klick → Fertiger Content.

---

## User Flow (3 Schritte)

### Schritt 1: Upload

Der User landet auf einer cleanen Seite mit einer großen Drag & Drop Zone.

**Was der User tut:**
- Zieht ein Brand-PDF (z.B. "E.ON Markenrichtlinien.pdf") in die Drop-Zone
- Oder klickt zum Durchsuchen

**Was im Hintergrund passiert:**
- PDF wird an Claude API (Anthropic) gesendet
- KI analysiert das Dokument visuell
- Extrahiert automatisch:
  - **Farben** (Primary, Secondary, Accent mit Hex-Codes)
  - **Schriften** (Headline-Font, Body-Font)
  - **Tone of Voice** (Professionell/Freundlich, Du/Sie, etc.)

**UI zeigt:**
- Ladeanimation mit Fortschrittsbalken
- "KI analysiert Brand-Elemente..."

**Ergebnis:**
- Weiterleitung zu Schritt 2
- Extrahierte Brand-Daten werden im State gespeichert

---

### Schritt 2: Generieren

Der User sieht eine Zusammenfassung der erkannten Brand-CI und wählt, was er erstellen möchte.

**UI-Elemente:**

1. **Brand-Zusammenfassung (oben)**
   - 3 Farbkreise (Primary, Secondary, Accent)
   - Optional: Logo-Vorschau
   - Erkannter Stil (z.B. "Professionell, Du-Ansprache")

2. **Asset-Auswahl (Mitte)**
   - 5 große Buttons/Cards:
     - **Website** - Landingpage mit Hero, Features, CTA
     - **Flyer** - Print-Broschüre mit Vorder-/Rückseite
     - **Social Media** - 5 Posts für Instagram/LinkedIn
     - **E-Mail** - Newsletter mit Betreff, Body, CTA
     - **Präsentation** - 10-Slide Pitch Deck

3. **Optionales Briefing (unten)**
   - Ein einzeiliges Textfeld
   - Placeholder: "z.B. Landingpage für neuen E-Auto Service"
   - Nicht erforderlich - KI generiert auch ohne Eingabe

4. **Generate-Button**
   - Großer, prominenter Button
   - "✦ Generieren"

**Was im Hintergrund passiert:**
- Request an Claude API mit:
  - Brand-Prompt (Tonalität, Ansprache, Do's/Don'ts)
  - Asset-Struktur (was genau generiert werden soll)
  - User-Briefing (falls eingegeben)
- KI generiert kompletten, strukturierten Content

---

### Schritt 3: Ergebnis

Der User sieht eine Live-Vorschau des generierten Contents.

**UI-Elemente:**

1. **Preview-Bereich (groß, zentral)**
   - Zeigt den generierten Content als gestylte Vorschau
   - Bei Website: Hero-Section mit Headline, Subline, Button
   - Bei Flyer: Vorder-/Rückseite
   - Farben entsprechen der extrahierten Brand-CI

2. **Export-Buttons**
   - **PDF** - Download als PDF
   - **PNG** - Download als Bild
   - **HTML** - Download als HTML-Datei (nur bei Website)
   - **Kopieren** - Text in Zwischenablage

3. **Navigation**
   - "Anderes Asset erstellen" → Zurück zu Schritt 2
   - "Neues Brand hochladen" → Zurück zu Schritt 1

4. **Raw-Text (ausklappbar)**
   - "Generierter Text anzeigen"
   - Zeigt den reinen Text zum Kopieren

---

## Technische Umsetzung

### Frontend

**Framework:** React 18 mit Vite

**Styling:** Vanilla CSS
- Keine CSS-Frameworks
- Apple-inspiriertes Design (clean, viel Whitespace)
- CSS Variables für Farben und Spacing

**Struktur:**
```
src/
├── App.jsx                      # Login + Router
├── components/
│   └── simple/
│       ├── SimpleBrandEngine.jsx   # State-Management
│       ├── UploadStep.jsx          # Drag & Drop
│       ├── GenerateStep.jsx        # Asset-Auswahl
│       └── ResultStep.jsx          # Preview + Export
├── lib/
│   └── ai.js                       # API-Calls
└── styles.css
```

### Backend (Serverless)

**Platform:** Vercel Edge Functions

**Endpoints:**

1. `POST /api/analyze-brand`
   - Input: Base64-encoded PDF/Bild
   - Output: JSON mit Farben, Fonts, Tone of Voice
   - Nutzt: Claude API mit Vision

2. `POST /api/generate-content`
   - Input: Brand-Prompt + Asset-Typ + Briefing
   - Output: Generierter Text
   - Nutzt: Claude API

### APIs

**Anthropic Claude API**
- Model: `claude-sonnet-4-20250514`
- Für: PDF-Analyse (Vision) + Text-Generierung
- API Key als Environment Variable

---

## Design-Richtlinien

### Farben
```css
--bg-primary: #ffffff;      /* Hintergrund */
--bg-secondary: #f5f5f7;    /* Grauer Hintergrund */
--text-primary: #1d1d1f;    /* Haupttext */
--text-secondary: #86868b;  /* Sekundärtext */
--accent: #0071e3;          /* Buttons, Links */
--border: rgba(0,0,0,0.08); /* Rahmen */
```

### Typografie
- System-Font: -apple-system, SF Pro, Helvetica Neue
- Headlines: 24-28px, font-weight 600
- Body: 14-15px, font-weight 400
- Hints: 13px, color: text-secondary

### Spacing
- Viel Whitespace
- Padding: 16px (md), 24px (lg), 32px (xl)
- Border-Radius: 12-20px

### Interaktionen
- Hover-States auf allen Buttons
- Subtile Transitions (0.2s ease)
- Loading-Spinner während API-Calls

---

## Asset-Strukturen (Was die KI generiert)

### Website
```
HERO-BEREICH:
- Headline (max. 8 Wörter)
- Subline (1-2 Sätze)
- CTA-Button (2-4 Wörter)

FEATURES (3 Stück):
- Titel (3-5 Wörter)
- Beschreibung (2-3 Sätze)

ÜBER UNS:
- Titel + Absatz

CTA-BEREICH:
- Überschrift + Text + Button
```

### Flyer
```
VORDERSEITE:
- Headline, Subline, Eyecatcher

INNENSEITE:
- Einleitung + 4 Benefits

RÜCKSEITE:
- CTA + Kontakt + Slogan
```

### Social Media (5 Posts)
```
Pro Post:
- Hook (erster Satz)
- Haupttext (2-4 Sätze)
- CTA
- Hashtags (5-7)
- Bildidee
```

### E-Mail
```
- Betreffzeile (max. 50 Zeichen)
- Preheader
- Anrede + Einleitung
- 3 Abschnitte
- CTA-Button
- P.S.
```

### Präsentation (10 Slides)
```
1. Titel
2. Problem
3. Lösung
4-6. Features
7. Social Proof
8. Team
9. Angebot
10. CTA
```

---

## Login/Authentifizierung

- Einfacher Passwort-Schutz
- Passwort: `brandengine2026`
- Speicherung im localStorage
- Kein User-Management, keine Registrierung

---

## Deployment

**Plattform:** Vercel

**Environment Variables:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

**Build:**
```bash
npm install
npm run build
```

**Auto-Deploy:** Bei Push auf `main` Branch

---

## Nicht im Scope

- User-Accounts / Registrierung
- Speichern von generierten Assets in DB
- Mehrsprachigkeit (nur Deutsch)
- Mobile-Optimierung (Desktop-first)
- Bildgenerierung (nur Text)
- Team-Collaboration

---

## Zusammenfassung

| Aspekt | Entscheidung |
|--------|--------------|
| Frontend | React + Vite |
| Styling | Vanilla CSS |
| Backend | Vercel Edge Functions |
| KI | Claude API (Anthropic) |
| Auth | Simples Passwort |
| Sprache | Nur Deutsch |
| Ziel | 3 Klicks: Upload → Generate → Export |

**Wichtigste Prinzipien:**
1. Radikal einfach - keine unnötigen Features
2. KI macht die Arbeit - User entscheidet nur WAS
3. Sofort nutzbar - kein Onboarding
4. Schönes Design - Apple-inspiriert
