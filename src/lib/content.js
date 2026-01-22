// ============================================
// CONTENT TEMPLATES - Editierbare Inhalte
// ============================================

/**
 * Standard-Content-Templates für jeden Asset-Typ
 * Diese werden vom User editiert und dann mit den Design Tokens kombiniert
 */

export const defaultContent = {
  website: {
    id: 'website',
    name: 'Website Hero',
    fields: {
      headline: {
        label: 'Headline',
        type: 'text',
        value: '',
        placeholder: 'Ihre starke Headline hier',
        maxLength: 80
      },
      subline: {
        label: 'Subline',
        type: 'textarea',
        value: '',
        placeholder: 'Überzeugende Beschreibung Ihrer Marke und was Sie einzigartig macht.',
        maxLength: 200
      },
      cta: {
        label: 'Call-to-Action',
        type: 'text',
        value: 'Mehr erfahren',
        placeholder: 'Button-Text',
        maxLength: 30
      },
      navLinks: {
        label: 'Navigation',
        type: 'array',
        value: ['Produkte', 'Über uns', 'Kontakt'],
        placeholder: 'Menüpunkt'
      }
    }
  },

  social: {
    id: 'social',
    name: 'Social Media Post',
    fields: {
      headline: {
        label: 'Headline',
        type: 'text',
        value: '',
        placeholder: 'Ihre Social-Media-Botschaft',
        maxLength: 100
      },
      hashtags: {
        label: 'Hashtags',
        type: 'text',
        value: '',
        placeholder: '#marketing #brand',
        maxLength: 100
      }
    },
    variants: [
      { id: 'square', name: 'Quadrat (1:1)', width: 1080, height: 1080 },
      { id: 'story', name: 'Story (9:16)', width: 1080, height: 1920 },
      { id: 'landscape', name: 'Landscape (16:9)', width: 1920, height: 1080 }
    ]
  },

  presentation: {
    id: 'presentation',
    name: 'Präsentation',
    fields: {
      title: {
        label: 'Präsentationstitel',
        type: 'text',
        value: '',
        placeholder: 'Titel der Präsentation',
        maxLength: 60
      },
      subtitle: {
        label: 'Untertitel',
        type: 'text',
        value: '',
        placeholder: 'Anlass oder Datum',
        maxLength: 80
      },
      author: {
        label: 'Autor/Präsentator',
        type: 'text',
        value: '',
        placeholder: 'Name',
        maxLength: 50
      }
    },
    slides: [
      {
        id: 'title',
        name: 'Titelfolie',
        layout: 'title',
        fields: {
          title: { label: 'Titel', type: 'text', value: '' },
          subtitle: { label: 'Untertitel', type: 'text', value: '' }
        }
      },
      {
        id: 'content',
        name: 'Inhaltsfolie',
        layout: 'bullets',
        fields: {
          headline: { label: 'Überschrift', type: 'text', value: '' },
          bullets: { 
            label: 'Aufzählungspunkte', 
            type: 'array', 
            value: ['Erster Punkt', 'Zweiter Punkt', 'Dritter Punkt'] 
          }
        }
      },
      {
        id: 'closing',
        name: 'Abschlussfolie',
        layout: 'closing',
        fields: {
          headline: { label: 'Abschluss-Text', type: 'text', value: 'Vielen Dank!' },
          contact: { label: 'Kontakt', type: 'text', value: '' }
        }
      }
    ]
  },

  flyer: {
    id: 'flyer',
    name: 'Flyer',
    fields: {
      headline: {
        label: 'Headline',
        type: 'text',
        value: '',
        placeholder: 'Event oder Angebot',
        maxLength: 50
      },
      description: {
        label: 'Beschreibung',
        type: 'textarea',
        value: '',
        placeholder: 'Kurze, prägnante Beschreibung',
        maxLength: 200
      },
      cta: {
        label: 'Call-to-Action',
        type: 'text',
        value: 'Jetzt handeln!',
        placeholder: 'Handlungsaufforderung',
        maxLength: 30
      },
      details: {
        label: 'Details (Datum, Ort, etc.)',
        type: 'textarea',
        value: '',
        placeholder: 'Wann? Wo? Wie?',
        maxLength: 150
      }
    },
    formats: [
      { id: 'a4', name: 'DIN A4', width: 210, height: 297, unit: 'mm' },
      { id: 'a5', name: 'DIN A5', width: 148, height: 210, unit: 'mm' },
      { id: 'dl', name: 'DIN Lang', width: 99, height: 210, unit: 'mm' }
    ]
  },

  email: {
    id: 'email',
    name: 'Newsletter',
    fields: {
      subject: {
        label: 'Betreff',
        type: 'text',
        value: '',
        placeholder: 'Newsletter Betreff',
        maxLength: 80
      },
      preheader: {
        label: 'Preheader',
        type: 'text',
        value: '',
        placeholder: 'Vorschautext im Postfach',
        maxLength: 100
      },
      greeting: {
        label: 'Anrede',
        type: 'text',
        value: 'Hallo [Name],',
        placeholder: 'Begrüßung',
        maxLength: 50
      },
      body: {
        label: 'Inhalt',
        type: 'textarea',
        value: '',
        placeholder: 'Ihr Newsletter-Inhalt...',
        maxLength: 1000
      },
      cta: {
        label: 'Button-Text',
        type: 'text',
        value: 'Mehr lesen',
        placeholder: 'Call-to-Action',
        maxLength: 30
      },
      ctaUrl: {
        label: 'Button-URL',
        type: 'text',
        value: '',
        placeholder: 'https://...',
        maxLength: 200
      }
    }
  },

  businesscard: {
    id: 'businesscard',
    name: 'Visitenkarte',
    fields: {
      name: {
        label: 'Name',
        type: 'text',
        value: '',
        placeholder: 'Max Mustermann',
        maxLength: 40
      },
      title: {
        label: 'Position/Titel',
        type: 'text',
        value: '',
        placeholder: 'Senior Manager',
        maxLength: 50
      },
      phone: {
        label: 'Telefon',
        type: 'text',
        value: '',
        placeholder: '+49 123 456789',
        maxLength: 20
      },
      email: {
        label: 'E-Mail',
        type: 'text',
        value: '',
        placeholder: 'email@firma.de',
        maxLength: 50
      },
      website: {
        label: 'Website',
        type: 'text',
        value: '',
        placeholder: 'www.firma.de',
        maxLength: 50
      },
      address: {
        label: 'Adresse',
        type: 'textarea',
        value: '',
        placeholder: 'Straße, PLZ Ort',
        maxLength: 100
      }
    }
  }
};

/**
 * Generiert Content mit Brand-Defaults
 */
export function generateContentWithDefaults(assetType, brand) {
  const template = JSON.parse(JSON.stringify(defaultContent[assetType]));
  
  // Brand-spezifische Defaults einsetzen
  if (template.fields.headline && brand.voice.tagline) {
    template.fields.headline.value = brand.voice.tagline;
  }
  
  return template;
}

/**
 * Validiert Content gegen Template
 */
export function validateContent(content, template) {
  const errors = [];
  
  for (const [key, field] of Object.entries(template.fields)) {
    if (field.maxLength && content[key]?.length > field.maxLength) {
      errors.push(`${field.label} ist zu lang (max. ${field.maxLength} Zeichen)`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export default defaultContent;
