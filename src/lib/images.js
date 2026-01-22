// ============================================
// IMAGE LIBRARY - Unsplash Integration
// ============================================

const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // User muss eigenen Key eintragen

/**
 * Sucht Bilder auf Unsplash
 */
export async function searchUnsplash(query, options = {}) {
  const { page = 1, perPage = 12, orientation = 'landscape' } = options;
  
  // Wenn kein API-Key, Demo-Bilder zurückgeben
  if (!options.apiKey && UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
    return getDemoImages(query);
  }
  
  const apiKey = options.apiKey || UNSPLASH_ACCESS_KEY;
  
  const params = new URLSearchParams({
    query,
    page: page.toString(),
    per_page: perPage.toString(),
    orientation
  });

  const response = await fetch(
    `https://api.unsplash.com/search/photos?${params}`,
    {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Unsplash-Suche fehlgeschlagen');
  }

  const data = await response.json();
  
  return {
    results: data.results.map(formatUnsplashImage),
    total: data.total,
    totalPages: data.total_pages
  };
}

/**
 * Formatiert Unsplash-Ergebnis in einheitliches Format
 */
function formatUnsplashImage(img) {
  return {
    id: img.id,
    source: 'unsplash',
    urls: {
      thumb: img.urls.thumb,
      small: img.urls.small,
      regular: img.urls.regular,
      full: img.urls.full
    },
    alt: img.alt_description || img.description || 'Unsplash Bild',
    author: {
      name: img.user.name,
      username: img.user.username,
      link: img.user.links.html
    },
    downloadLink: img.links.download_location,
    color: img.color,
    width: img.width,
    height: img.height
  };
}

/**
 * Demo-Bilder für Vorschau ohne API-Key
 */
function getDemoImages(query) {
  // Placeholder-Bilder von Unsplash Source (kein API-Key nötig)
  const categories = {
    business: ['office', 'meeting', 'laptop', 'teamwork'],
    nature: ['forest', 'mountain', 'ocean', 'sunset'],
    technology: ['computer', 'code', 'server', 'robot'],
    people: ['portrait', 'team', 'handshake', 'presentation'],
    abstract: ['pattern', 'gradient', 'minimal', 'geometric']
  };
  
  // Passende Kategorie finden oder default
  let keywords = categories.business;
  for (const [cat, words] of Object.entries(categories)) {
    if (query.toLowerCase().includes(cat) || words.some(w => query.toLowerCase().includes(w))) {
      keywords = words;
      break;
    }
  }
  
  return {
    results: keywords.map((keyword, i) => ({
      id: `demo-${i}`,
      source: 'unsplash-demo',
      urls: {
        thumb: `https://source.unsplash.com/200x150/?${keyword}`,
        small: `https://source.unsplash.com/400x300/?${keyword}`,
        regular: `https://source.unsplash.com/800x600/?${keyword}`,
        full: `https://source.unsplash.com/1600x1200/?${keyword}`
      },
      alt: `${keyword} Bild`,
      author: {
        name: 'Unsplash',
        username: 'unsplash',
        link: 'https://unsplash.com'
      },
      color: '#cccccc',
      width: 800,
      height: 600
    })),
    total: keywords.length,
    totalPages: 1,
    isDemo: true
  };
}

/**
 * Lädt ein Bild und konvertiert es zu Base64
 */
export async function imageToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Verwaltet die lokale Bild-Bibliothek (hochgeladene Bilder)
 */
export class ImageLibrary {
  constructor(storageKey = 'brand_engine_images') {
    this.storageKey = storageKey;
    this.images = this.load();
  }
  
  load() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : [];
  }
  
  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.images));
  }
  
  add(image) {
    const newImage = {
      id: Date.now().toString(),
      source: 'upload',
      ...image,
      addedAt: new Date().toISOString()
    };
    this.images.unshift(newImage);
    this.save();
    return newImage;
  }
  
  remove(id) {
    this.images = this.images.filter(img => img.id !== id);
    this.save();
  }
  
  getAll() {
    return this.images;
  }
  
  getByBrand(brandId) {
    return this.images.filter(img => img.brandId === brandId);
  }
  
  search(query) {
    const q = query.toLowerCase();
    return this.images.filter(img => 
      img.alt?.toLowerCase().includes(q) ||
      img.tags?.some(t => t.toLowerCase().includes(q))
    );
  }
}

/**
 * Kategorien für Quick-Search
 */
export const imageCategories = [
  { id: 'business', name: 'Business', query: 'business office professional' },
  { id: 'technology', name: 'Technologie', query: 'technology digital innovation' },
  { id: 'nature', name: 'Natur', query: 'nature landscape green' },
  { id: 'people', name: 'Menschen', query: 'people team collaboration' },
  { id: 'abstract', name: 'Abstrakt', query: 'abstract minimal pattern' },
  { id: 'city', name: 'Stadt', query: 'city urban architecture' },
  { id: 'energy', name: 'Energie', query: 'energy solar wind renewable' },
  { id: 'mobility', name: 'Mobilität', query: 'mobility transport electric car' }
];

/**
 * Generiert passende Bildvorschläge basierend auf Brand/Content
 */
export function suggestImageQueries(brand, content) {
  const suggestions = [];
  
  // Aus Tagline Keywords extrahieren
  if (brand.voice.tagline) {
    suggestions.push(brand.voice.tagline.split(' ').slice(0, 2).join(' '));
  }
  
  // Aus Do's Keywords
  if (brand.voice.dos) {
    const dos = brand.voice.dos.split(',').map(s => s.trim()).slice(0, 2);
    suggestions.push(...dos);
  }
  
  // Aus Content
  if (content?.fields?.headline?.value) {
    suggestions.push(content.fields.headline.value.split(' ').slice(0, 3).join(' '));
  }
  
  // Branchen-Keywords basierend auf Brand-Name
  const brandLower = brand.name.toLowerCase();
  if (brandLower.includes('energie') || brandLower.includes('energy')) {
    suggestions.push('renewable energy', 'solar power');
  }
  if (brandLower.includes('tech') || brandLower.includes('digital')) {
    suggestions.push('technology innovation', 'digital transformation');
  }
  
  return [...new Set(suggestions)].slice(0, 5);
}

export default { 
  searchUnsplash, 
  imageToBase64, 
  ImageLibrary, 
  imageCategories,
  suggestImageQueries
};
