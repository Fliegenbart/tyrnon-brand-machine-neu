// ============================================
// CAMPAIGNS - Multi-Channel Marketing Kampagnen
// ============================================

import { generateCampaignTexts } from './ai.js';

/**
 * Kampagnen-Template mit allen Asset-Typen
 */
export const campaignAssets = [
  { 
    id: 'social', 
    name: 'Social Media Post', 
    icon: '📱',
    description: 'LinkedIn, Instagram, Facebook',
    required: true
  },
  { 
    id: 'email', 
    name: 'Newsletter', 
    icon: '✉️',
    description: 'E-Mail Kampagne',
    required: true
  },
  { 
    id: 'website', 
    name: 'Website Banner', 
    icon: '🌐',
    description: 'Hero Section, Landing Page',
    required: false
  },
  { 
    id: 'flyer', 
    name: 'Flyer / Print', 
    icon: '📄',
    description: 'A4, A5, DIN Lang',
    required: false
  },
  { 
    id: 'presentation', 
    name: 'Präsentation', 
    icon: '📊',
    description: 'Pitch Deck Slides',
    required: false
  }
];

/**
 * Erstellt eine neue Kampagne
 */
export function createCampaign(brand, data) {
  return {
    id: Date.now().toString(),
    brandId: brand.id,
    name: data.name || 'Neue Kampagne',
    topic: data.topic || '',
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    status: 'draft', // draft, active, completed, archived
    assets: campaignAssets.map(asset => ({
      ...asset,
      enabled: asset.required,
      content: null,
      generatedText: null,
      exported: false
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Generiert alle Texte für eine Kampagne mit AI
 */
export async function generateCampaignContent(campaign, brand, apiKey = null) {
  const texts = await generateCampaignTexts(brand, campaign.topic, apiKey);
  
  // Texte den Assets zuordnen
  const updatedAssets = campaign.assets.map(asset => {
    if (asset.enabled && texts[asset.id]) {
      return {
        ...asset,
        generatedText: texts[asset.id],
        content: {
          fields: {
            headline: { value: extractHeadline(texts[asset.id]) },
            body: { value: texts[asset.id] }
          }
        }
      };
    }
    return asset;
  });

  return {
    ...campaign,
    assets: updatedAssets,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Extrahiert die erste Zeile als Headline
 */
function extractHeadline(text) {
  if (!text) return '';
  const lines = text.split('\n').filter(l => l.trim());
  const firstLine = lines[0] || '';
  // Nummerierung entfernen falls vorhanden
  return firstLine.replace(/^\d+\.\s*/, '').substring(0, 80);
}

/**
 * Kampagnen-Status Management
 */
export const campaignStatuses = {
  draft: { label: 'Entwurf', color: '#6b7280', icon: '📝' },
  active: { label: 'Aktiv', color: '#22c55e', icon: '🚀' },
  completed: { label: 'Abgeschlossen', color: '#3b82f6', icon: '✅' },
  archived: { label: 'Archiviert', color: '#9ca3af', icon: '📦' }
};

/**
 * Berechnet Kampagnen-Fortschritt
 */
export function getCampaignProgress(campaign) {
  const enabledAssets = campaign.assets.filter(a => a.enabled);
  const completedAssets = enabledAssets.filter(a => a.content && a.exported);
  const generatedAssets = enabledAssets.filter(a => a.generatedText);
  
  return {
    total: enabledAssets.length,
    generated: generatedAssets.length,
    completed: completedAssets.length,
    percentage: enabledAssets.length > 0 
      ? Math.round((completedAssets.length / enabledAssets.length) * 100)
      : 0
  };
}

/**
 * Kampagnen-Storage
 */
export class CampaignStore {
  constructor(storageKey = 'brand_engine_campaigns') {
    this.storageKey = storageKey;
    this.campaigns = this.load();
  }
  
  load() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : [];
  }
  
  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.campaigns));
  }
  
  create(brand, data) {
    const campaign = createCampaign(brand, data);
    this.campaigns.unshift(campaign);
    this.save();
    return campaign;
  }
  
  update(id, updates) {
    this.campaigns = this.campaigns.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    this.save();
    return this.get(id);
  }
  
  delete(id) {
    this.campaigns = this.campaigns.filter(c => c.id !== id);
    this.save();
  }
  
  get(id) {
    return this.campaigns.find(c => c.id === id);
  }
  
  getByBrand(brandId) {
    return this.campaigns.filter(c => c.brandId === brandId);
  }
  
  getAll() {
    return this.campaigns;
  }
  
  getActive() {
    return this.campaigns.filter(c => c.status === 'active');
  }
  
  getRecent(limit = 5) {
    return [...this.campaigns]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit);
  }
}

/**
 * Exportiert alle Assets einer Kampagne
 */
export async function exportCampaign(campaign, brand, exportFn) {
  const results = [];
  
  for (const asset of campaign.assets) {
    if (asset.enabled && asset.content) {
      try {
        await exportFn(brand, asset.content, getExportFormat(asset.id));
        results.push({ asset: asset.id, success: true });
      } catch (error) {
        results.push({ asset: asset.id, success: false, error: error.message });
      }
    }
  }
  
  return results;
}

/**
 * Mappt Asset-Typ auf Export-Format
 */
function getExportFormat(assetId) {
  const mapping = {
    social: 'html-hero',
    email: 'html-email',
    website: 'html-hero',
    flyer: 'pdf-flyer',
    presentation: 'pptx'
  };
  return mapping[assetId] || 'html-hero';
}

/**
 * Kampagnen-Vorlagen
 */
export const campaignTemplates = [
  {
    id: 'product-launch',
    name: 'Produkt-Launch',
    icon: '🚀',
    description: 'Neues Produkt oder Service einführen',
    suggestedAssets: ['social', 'email', 'website', 'presentation'],
    topicHint: 'Was ist das Produkt und was macht es besonders?'
  },
  {
    id: 'event',
    name: 'Event / Webinar',
    icon: '📅',
    description: 'Veranstaltung bewerben',
    suggestedAssets: ['social', 'email', 'flyer'],
    topicHint: 'Was ist das Event, wann und wo findet es statt?'
  },
  {
    id: 'awareness',
    name: 'Awareness / Thought Leadership',
    icon: '💡',
    description: 'Expertise zeigen, Reichweite aufbauen',
    suggestedAssets: ['social', 'email', 'presentation'],
    topicHint: 'Welches Thema oder welche Expertise soll gezeigt werden?'
  },
  {
    id: 'promotion',
    name: 'Aktion / Rabatt',
    icon: '🏷️',
    description: 'Sonderangebot oder Aktion',
    suggestedAssets: ['social', 'email', 'flyer', 'website'],
    topicHint: 'Was ist das Angebot und wie lange gilt es?'
  },
  {
    id: 'recruiting',
    name: 'Recruiting / Employer Branding',
    icon: '👥',
    description: 'Stellen ausschreiben, Arbeitgebermarke stärken',
    suggestedAssets: ['social', 'website'],
    topicHint: 'Welche Position oder was macht euch als Arbeitgeber aus?'
  }
];

export default {
  createCampaign,
  generateCampaignContent,
  getCampaignProgress,
  CampaignStore,
  campaignAssets,
  campaignStatuses,
  campaignTemplates,
  exportCampaign
};
