# Brand Engine 🎨

Multi-Brand Marketing Asset Platform – generiere alle Marketing-Assets aus einer Brand-Definition.

## 🚀 Features

### Brand Management
- ✅ Multi-Brand-Support (mehrere Marken anlegen/wechseln)
- ✅ Brand-Konfigurator (Farben, Logo, Fonts, Tonalität)
- ✅ Design Token System (Single Source of Truth)

### 🤖 AI Text-Generator
- Headline-Varianten, Sublines, Social Posts, Newsletter-Texte
- Brand Voice aware (Tonalität, Du/Sie, Do's & Don'ts)
- Funktioniert mit Demo-Texten oder echtem OpenAI API Key

### 📦 Kampagnen-Modus
- Multi-Channel Kampagnen erstellen
- Einmal briefen → alle Assets generieren
- Fortschritt tracken, Kampagnen verwalten

### 🖼️ Bild-Library (Unsplash)
- Direkte Bildsuche in der App
- Quick-Kategorien (Business, Tech, Natur...)
- Mit oder ohne API Key nutzbar

### ♿ Accessibility-Checker
- WCAG 2.1 Kontrast-Prüfung
- BITV 2.0 Konformitäts-Check
- Farbverbesserungsvorschläge

### 🔗 QR-Code Generator
- URL, E-Mail, Telefon, vCard
- Automatisch in Visitenkarten eingebettet
- Brand-Farben

### Export-Formate
- CSS Variables, Tailwind Config, JSON Tokens
- PowerPoint (.pptx) – Native, editierbare Slides
- PDF Flyer, Visitenkarte, **Brand Guidelines**
- Newsletter HTML, Hero Section HTML

## Quick Start

```bash
npm install
npm run dev
```

**Passwort:** `brandengine2024`

## Projektstruktur

```
brand-engine/
├── src/
│   ├── App.jsx              # Hauptkomponente + UI
│   ├── styles.css           # Styling
│   └── lib/
│       ├── tokens.js        # Design Token System
│       ├── content.js       # Content Templates
│       ├── ai.js            # AI Text-Generator
│       ├── accessibility.js # WCAG Checker
│       ├── images.js        # Unsplash Integration
│       ├── campaigns.js     # Kampagnen-Management
│       ├── qrcode.js        # QR-Code Generator
│       └── exporters/
│           ├── index.js     # Export Hub
│           ├── pptx.js      # PowerPoint
│           └── pdf.js       # PDF + Guidelines
```

## API Keys (optional)

Die App funktioniert auch ohne API Keys mit Demo-Daten:

- **OpenAI**: Für echte AI-Textgenerierung (sonst Demo-Texte)
- **Unsplash**: Für unbegrenzte Bildsuche (sonst Demo-Bilder)

## Weiterentwicklung mit Claude Code

```bash
> "Füge Stripe Billing hinzu"
> "Integriere Supabase Auth"
> "Baue einen Figma Plugin Export"
> "Füge XLSX Export für Spreadsheets hinzu"
```

## Roadmap

- [ ] Echte Auth (Supabase/Auth0)
- [ ] Team-Features (Multi-User)
- [ ] API für programmatischen Zugriff
- [ ] Figma Variables Export
- [ ] XLSX Export

## Tech Stack

- React 18, Vite 5
- PptxGenJS, pdf-lib
- Vanilla CSS

---

Made with 🧡
