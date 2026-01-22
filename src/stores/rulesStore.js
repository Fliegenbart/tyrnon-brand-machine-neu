// ============================================
// RULES STORE - Store and manage learned brand rules
// With Supabase sync for team collaboration
// ============================================
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Local storage helpers
const getLocalRules = () => {
  try {
    return JSON.parse(localStorage.getItem('brand_rules') || '{}');
  } catch {
    return {};
  }
};

const saveLocalRules = (rules) => {
  try {
    // Only save rules without large data
    const cleanRules = {};
    for (const [brandId, brandRules] of Object.entries(rules)) {
      cleanRules[brandId] = brandRules.map(rule => ({
        ...rule,
        // Remove any large base64 data from sources
        sources: rule.sources?.map(s => ({ file: s.file, location: s.location })) || []
      }));
    }
    localStorage.setItem('brand_rules', JSON.stringify(cleanRules));
  } catch (e) {
    console.warn('Could not save rules to localStorage:', e);
  }
};

const getLocalStatus = () => {
  try {
    return JSON.parse(localStorage.getItem('brand_rules_status') || '{}');
  } catch {
    return {};
  }
};

const saveLocalStatus = (status) => {
  localStorage.setItem('brand_rules_status', JSON.stringify(status));
};

export const useRulesStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    rules: {},           // brandId -> Rule[]
    analysisStatus: {},  // brandId -> 'none' | 'analyzing' | 'review' | 'complete'
    extractedAssets: {}, // brandId -> { logos: [], images: [] } - NOT persisted
    isLoading: false,
    isOnline: !!supabase,

    // Initialize - load from Supabase or localStorage
    initialize: async () => {
      set({ isLoading: true });

      if (supabase) {
        try {
          const { data: rulesData, error } = await supabase
            .from('brand_rules')
            .select('*');

          if (error) throw error;

          // Transform array to object by brand_id
          const rulesMap = {};
          const statusMap = {};

          rulesData?.forEach(row => {
            if (!rulesMap[row.brand_id]) {
              rulesMap[row.brand_id] = [];
            }
            rulesMap[row.brand_id].push(row.rules_data);
            statusMap[row.brand_id] = row.status || 'complete';
          });

          // Flatten rules arrays (each row might have multiple rules)
          for (const brandId of Object.keys(rulesMap)) {
            rulesMap[brandId] = rulesMap[brandId].flat();
          }

          set({
            rules: rulesMap,
            analysisStatus: statusMap,
            isLoading: false,
            isOnline: true
          });

          // Setup realtime sync
          get().setupRealtimeSync();
        } catch (error) {
          console.error('Supabase rules error, using localStorage:', error);
          set({
            rules: getLocalRules(),
            analysisStatus: getLocalStatus(),
            isLoading: false,
            isOnline: false
          });
        }
      } else {
        set({
          rules: getLocalRules(),
          analysisStatus: getLocalStatus(),
          isLoading: false,
          isOnline: false
        });
      }
    },

    // Realtime sync for team collaboration
    setupRealtimeSync: () => {
      if (!supabase) return;

      supabase
        .channel('rules-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'brand_rules' },
          (payload) => {
            const { rules, analysisStatus } = get();

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const brandId = payload.new.brand_id;
              const newRules = payload.new.rules_data || [];

              set({
                rules: { ...rules, [brandId]: newRules },
                analysisStatus: { ...analysisStatus, [brandId]: payload.new.status || 'complete' }
              });
            } else if (payload.eventType === 'DELETE') {
              const brandId = payload.old.brand_id;
              const { [brandId]: _, ...restRules } = rules;
              const { [brandId]: __, ...restStatus } = analysisStatus;

              set({
                rules: restRules,
                analysisStatus: restStatus
              });
            }
          }
        )
        .subscribe();
    },

    // Set rules for a brand (with Supabase sync)
    setRulesForBrand: async (brandId, rules) => {
      const { isOnline, analysisStatus } = get();

      // Update local state immediately
      set(state => ({
        rules: { ...state.rules, [brandId]: rules },
        analysisStatus: { ...state.analysisStatus, [brandId]: 'review' }
      }));

      // Save to localStorage as backup
      saveLocalRules(get().rules);
      saveLocalStatus(get().analysisStatus);

      // Sync to Supabase
      if (isOnline && supabase) {
        try {
          await supabase.from('brand_rules').upsert({
            brand_id: brandId,
            rules_data: rules,
            status: 'review',
            updated_at: new Date().toISOString()
          }, { onConflict: 'brand_id' });
        } catch (error) {
          console.error('Failed to sync rules to Supabase:', error);
        }
      }
    },

    // Store extracted assets temporarily (with optional Supabase Storage)
    setExtractedAssets: async (brandId, assets) => {
      // Store in memory (not persisted to localStorage)
      set(state => ({
        extractedAssets: { ...state.extractedAssets, [brandId]: assets }
      }));

      // Optionally upload logos to Supabase Storage
      if (supabase && assets?.logos?.length > 0) {
        try {
          const uploadedLogos = [];

          for (const logo of assets.logos.slice(0, 5)) { // Max 5 logos
            if (logo.data && logo.data.startsWith('data:')) {
              // Convert base64 to blob
              const base64Data = logo.data.split(',')[1];
              const mimeType = logo.data.split(';')[0].split(':')[1];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mimeType });

              // Upload to Supabase Storage
              const fileName = `${brandId}/${Date.now()}-${logo.name || 'logo.png'}`;
              const { data, error } = await supabase.storage
                .from('brand-assets')
                .upload(fileName, blob, { contentType: mimeType });

              if (!error && data) {
                const { data: urlData } = supabase.storage
                  .from('brand-assets')
                  .getPublicUrl(fileName);

                uploadedLogos.push({
                  ...logo,
                  data: urlData.publicUrl, // Replace base64 with URL
                  storageKey: fileName
                });
              }
            }
          }

          if (uploadedLogos.length > 0) {
            set(state => ({
              extractedAssets: {
                ...state.extractedAssets,
                [brandId]: {
                  ...state.extractedAssets[brandId],
                  logos: uploadedLogos
                }
              }
            }));
          }
        } catch (error) {
          console.error('Failed to upload assets to storage:', error);
        }
      }
    },

    // Update analysis status
    setAnalysisStatus: async (brandId, status) => {
      const { isOnline } = get();

      set(state => ({
        analysisStatus: { ...state.analysisStatus, [brandId]: status }
      }));
      saveLocalStatus(get().analysisStatus);

      if (isOnline && supabase) {
        try {
          await supabase.from('brand_rules')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('brand_id', brandId);
        } catch (error) {
          console.error('Failed to update status in Supabase:', error);
        }
      }
    },

    // Get rules for a brand
    getRulesForBrand: (brandId) => {
      return get().rules[brandId] || [];
    },

    // Get rules for specific asset type
    getRulesForAssetType: (brandId, assetType) => {
      const brandRules = get().rules[brandId] || [];
      return brandRules.filter(r =>
        r.applicableTo?.includes(assetType) || r.applicableTo?.includes('all')
      );
    },

    // Get rules by category
    getRulesByCategory: (brandId, category) => {
      const brandRules = get().rules[brandId] || [];
      return brandRules.filter(r => r.category === category);
    },

    // Update a single rule
    updateRule: async (brandId, ruleId, updates) => {
      const { rules, isOnline } = get();
      const brandRules = rules[brandId] || [];
      const updatedRules = brandRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      );

      set(state => ({
        rules: { ...state.rules, [brandId]: updatedRules }
      }));
      saveLocalRules(get().rules);

      if (isOnline && supabase) {
        try {
          await supabase.from('brand_rules')
            .update({ rules_data: updatedRules, updated_at: new Date().toISOString() })
            .eq('brand_id', brandId);
        } catch (error) {
          console.error('Failed to update rule in Supabase:', error);
        }
      }
    },

    // Delete a rule
    deleteRule: async (brandId, ruleId) => {
      const { rules, isOnline } = get();
      const brandRules = rules[brandId] || [];
      const filteredRules = brandRules.filter(rule => rule.id !== ruleId);

      set(state => ({
        rules: { ...state.rules, [brandId]: filteredRules }
      }));
      saveLocalRules(get().rules);

      if (isOnline && supabase) {
        try {
          await supabase.from('brand_rules')
            .update({ rules_data: filteredRules, updated_at: new Date().toISOString() })
            .eq('brand_id', brandId);
        } catch (error) {
          console.error('Failed to delete rule in Supabase:', error);
        }
      }
    },

    // Confirm a rule (sets confidence to 1.0)
    confirmRule: async (brandId, ruleId) => {
      await get().updateRule(brandId, ruleId, { confidence: 1.0, confirmed: true });
    },

    // Confirm all rules
    confirmAllRules: async (brandId) => {
      const { rules, isOnline } = get();
      const brandRules = rules[brandId] || [];
      const updatedRules = brandRules.map(rule => ({
        ...rule,
        confidence: 1.0,
        confirmed: true
      }));

      set(state => ({
        rules: { ...state.rules, [brandId]: updatedRules },
        analysisStatus: { ...state.analysisStatus, [brandId]: 'complete' }
      }));
      saveLocalRules(get().rules);
      saveLocalStatus(get().analysisStatus);

      if (isOnline && supabase) {
        try {
          await supabase.from('brand_rules').upsert({
            brand_id: brandId,
            rules_data: updatedRules,
            status: 'complete',
            updated_at: new Date().toISOString()
          }, { onConflict: 'brand_id' });
        } catch (error) {
          console.error('Failed to confirm rules in Supabase:', error);
        }
      }
    },

    // Add a new rule manually
    addRule: async (brandId, rule) => {
      const { rules, isOnline } = get();
      const brandRules = rules[brandId] || [];
      const newRule = {
        ...rule,
        id: rule.id || 'rule-' + Math.random().toString(36).substring(2, 9),
        confirmed: true,
        confidence: 1.0
      };

      const updatedRules = [...brandRules, newRule];

      set(state => ({
        rules: { ...state.rules, [brandId]: updatedRules }
      }));
      saveLocalRules(get().rules);

      if (isOnline && supabase) {
        try {
          await supabase.from('brand_rules').upsert({
            brand_id: brandId,
            rules_data: updatedRules,
            status: 'complete',
            updated_at: new Date().toISOString()
          }, { onConflict: 'brand_id' });
        } catch (error) {
          console.error('Failed to add rule in Supabase:', error);
        }
      }
    },

    // Clear all rules for a brand
    clearRules: async (brandId) => {
      const { isOnline } = get();

      set(state => ({
        rules: { ...state.rules, [brandId]: [] },
        analysisStatus: { ...state.analysisStatus, [brandId]: 'none' },
        extractedAssets: { ...state.extractedAssets, [brandId]: null }
      }));
      saveLocalRules(get().rules);
      saveLocalStatus(get().analysisStatus);

      if (isOnline && supabase) {
        try {
          await supabase.from('brand_rules').delete().eq('brand_id', brandId);
        } catch (error) {
          console.error('Failed to clear rules in Supabase:', error);
        }
      }
    },

    // Export rules as JSON
    exportRules: (brandId) => {
      const brandRules = get().rules[brandId] || [];
      return JSON.stringify(brandRules, null, 2);
    },

    // Import rules from JSON
    importRules: async (brandId, json) => {
      try {
        const rules = JSON.parse(json);
        if (Array.isArray(rules)) {
          await get().setRulesForBrand(brandId, rules);
          await get().setAnalysisStatus(brandId, 'complete');
          return true;
        }
      } catch (e) {
        console.error('Failed to import rules:', e);
      }
      return false;
    },

    // Get analysis status
    getAnalysisStatus: (brandId) => {
      return get().analysisStatus[brandId] || 'none';
    },

    // Get extracted assets (from memory, not persisted)
    getExtractedAssets: (brandId) => {
      return get().extractedAssets[brandId] || { logos: [], images: [] };
    },

    // Check if brand has rules
    hasRules: (brandId) => {
      const brandRules = get().rules[brandId] || [];
      return brandRules.length > 0;
    },

    // Get rule summary for a brand
    getRuleSummary: (brandId) => {
      const brandRules = get().rules[brandId] || [];
      return {
        total: brandRules.length,
        confirmed: brandRules.filter(r => r.confirmed).length,
        byCategory: {
          color: brandRules.filter(r => r.category === 'color').length,
          typography: brandRules.filter(r => r.category === 'typography').length,
          spacing: brandRules.filter(r => r.category === 'spacing').length,
          component: brandRules.filter(r => r.category === 'component').length
        }
      };
    }
  }))
);

// Initialize on import
useRulesStore.getState().initialize();

export default useRulesStore;
