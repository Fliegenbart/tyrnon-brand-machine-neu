import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const getLocalBrands = () => {
  try {
    return JSON.parse(localStorage.getItem('brand_engine_brands') || '[]');
  } catch {
    return [];
  }
};

const saveLocalBrands = (brands) => {
  localStorage.setItem('brand_engine_brands', JSON.stringify(brands));
};

const getLocalContent = () => {
  try {
    return JSON.parse(localStorage.getItem('brand_engine_content') || '{}');
  } catch {
    return {};
  }
};

const saveLocalContent = (content) => {
  localStorage.setItem('brand_engine_content', JSON.stringify(content));
};

// Default brand template
const createDefaultBrand = (name = 'Neue Marke') => ({
  id: Date.now().toString(),
  name,
  colors: {
    primary: '#0071e3',
    secondary: '#1d1d1f',
    accent: '#ff9500',
    background: '#ffffff',
    text: '#1d1d1f',
    palette: [] // Additional brand colors
  },
  fonts: {
    heading: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
    additional: [] // Additional fonts { name, usage, description }
  },
  voice: {
    tone: 'professional',
    formality: 'sie',
    tagline: '',
    dos: '',
    donts: ''
  },
  logo: null,
  logos: [], // Additional logos { dataUrl, name, description }
  toneOfVoice: null // AI-extracted tone of voice data
});

export const useBrandStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    brands: [],
    activeBrandId: null,
    assetContent: {},
    isLoading: true,
    isOnline: !!supabase,
    currentUser: null,
    onlineUsers: [],

    // Computed
    getActiveBrand: () => {
      const { brands, activeBrandId } = get();
      return brands.find(b => b.id === activeBrandId) || brands[0] || null;
    },

    getBrandById: (id) => {
      return get().brands.find(b => b.id === id) || null;
    },

    // Actions
    initialize: async () => {
      set({ isLoading: true });

      if (supabase) {
        try {
          const { data: brands } = await supabase.from('brands').select('*');
          const { data: content } = await supabase.from('asset_content').select('*');

          const contentMap = {};
          content?.forEach(c => {
            contentMap[c.id] = c.content;
          });

          set({
            brands: brands || [],
            assetContent: contentMap,
            isLoading: false,
            isOnline: true
          });

          // Setup realtime subscriptions
          get().setupRealtimeSync();
        } catch (error) {
          console.error('Supabase error, falling back to localStorage:', error);
          set({
            brands: getLocalBrands(),
            assetContent: getLocalContent(),
            isLoading: false,
            isOnline: false
          });
        }
      } else {
        set({
          brands: getLocalBrands(),
          assetContent: getLocalContent(),
          isLoading: false,
          isOnline: false
        });
      }
    },

    setupRealtimeSync: () => {
      if (!supabase) return;

      supabase
        .channel('brands-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, (payload) => {
          const { brands } = get();
          if (payload.eventType === 'INSERT') {
            set({ brands: [...brands, payload.new] });
          } else if (payload.eventType === 'UPDATE') {
            set({ brands: brands.map(b => b.id === payload.new.id ? payload.new : b) });
          } else if (payload.eventType === 'DELETE') {
            set({ brands: brands.filter(b => b.id !== payload.old.id) });
          }
        })
        .subscribe();
    },

    setActiveBrand: (brandId) => {
      set({ activeBrandId: brandId });
    },

    createBrand: async (name) => {
      const newBrand = createDefaultBrand(name);
      const { brands, isOnline } = get();

      if (isOnline && supabase) {
        await supabase.from('brands').insert(newBrand);
      }

      const updated = [...brands, newBrand];
      set({ brands: updated, activeBrandId: newBrand.id });
      saveLocalBrands(updated);

      return newBrand;
    },

    updateBrand: async (brandId, updates) => {
      const { brands, isOnline } = get();
      const updated = brands.map(b =>
        b.id === brandId ? { ...b, ...updates } : b
      );

      set({ brands: updated });
      saveLocalBrands(updated);

      if (isOnline && supabase) {
        await supabase.from('brands').update(updates).eq('id', brandId);
      }
    },

    deleteBrand: async (brandId) => {
      const { brands, activeBrandId, isOnline } = get();
      const updated = brands.filter(b => b.id !== brandId);

      set({
        brands: updated,
        activeBrandId: activeBrandId === brandId ? updated[0]?.id : activeBrandId
      });
      saveLocalBrands(updated);

      if (isOnline && supabase) {
        await supabase.from('brands').delete().eq('id', brandId);
      }
    },

    getAssetContent: (brandId, assetType) => {
      const key = `${brandId}-${assetType}`;
      return get().assetContent[key] || null;
    },

    updateAssetContent: async (brandId, assetType, content) => {
      const { assetContent, isOnline } = get();
      const key = `${brandId}-${assetType}`;

      const updated = { ...assetContent, [key]: content };
      set({ assetContent: updated });
      saveLocalContent(updated);

      if (isOnline && supabase) {
        await supabase.from('asset_content').upsert({
          id: key,
          brand_id: brandId,
          asset_type: assetType,
          content,
          updated_at: new Date().toISOString()
        });
      }
    }
  }))
);

// Initialize on import
useBrandStore.getState().initialize();
