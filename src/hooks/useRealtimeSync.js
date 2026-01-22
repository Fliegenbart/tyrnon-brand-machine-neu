import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isOnlineMode, getOrCreateUserId, getUserColor, getUserName } from '../lib/supabase.js';

const DEFAULT_BRAND = {
  id: '1',
  name: 'Demo Brand',
  colors: { primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b', background: '#ffffff', text: '#1f2937' },
  fonts: { heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif" },
  voice: { tone: 'professional', formality: 'sie', tagline: 'Innovation trifft Zuverlässigkeit', dos: 'nachhaltig, zukunftsorientiert', donts: 'billig, irgendwie' },
  logo: null
};

export function useRealtimeSync() {
  const [brands, setBrands] = useState([]);
  const [assetContent, setAssetContent] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(isOnlineMode());
  const [syncError, setSyncError] = useState(null);

  const userId = useRef(getOrCreateUserId());
  const userName = useRef(getUserName(userId.current));
  const userColor = useRef(getUserColor(userId.current));
  const presenceInterval = useRef(null);
  const subscriptionsRef = useRef([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    return () => {
      cleanupSubscriptions();
      if (presenceInterval.current) {
        clearInterval(presenceInterval.current);
      }
    };
  }, []);

  const cleanupSubscriptions = () => {
    subscriptionsRef.current.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    subscriptionsRef.current = [];
  };

  const loadInitialData = async () => {
    setIsLoading(true);

    if (!isOnlineMode()) {
      // Offline mode - use localStorage
      const savedBrands = localStorage.getItem('brand_engine_brands');
      const savedContent = localStorage.getItem('brand_engine_content');
      setBrands(savedBrands ? JSON.parse(savedBrands) : [DEFAULT_BRAND]);
      setAssetContent(savedContent ? JSON.parse(savedContent) : {});
      setIsLoading(false);
      return;
    }

    try {
      // Load brands from Supabase
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: true });

      if (brandsError) throw brandsError;

      // Load asset content
      const { data: contentData, error: contentError } = await supabase
        .from('asset_content')
        .select('*');

      if (contentError) throw contentError;

      // Transform content data to object format
      const contentObj = {};
      contentData?.forEach(item => {
        contentObj[item.id] = item.content;
      });

      setBrands(brandsData?.length ? brandsData : [DEFAULT_BRAND]);
      setAssetContent(contentObj);
      setIsOnline(true);
      setSyncError(null);

      // Setup real-time subscriptions
      setupRealtimeSubscriptions();

      // Setup presence tracking
      setupPresenceTracking();

    } catch (error) {
      console.error('Failed to load from Supabase:', error);
      setSyncError('Verbindung fehlgeschlagen. Offline-Modus aktiv.');
      setIsOnline(false);

      // Fallback to localStorage
      const savedBrands = localStorage.getItem('brand_engine_brands');
      const savedContent = localStorage.getItem('brand_engine_content');
      setBrands(savedBrands ? JSON.parse(savedBrands) : [DEFAULT_BRAND]);
      setAssetContent(savedContent ? JSON.parse(savedContent) : {});
    }

    setIsLoading(false);
  };

  const setupRealtimeSubscriptions = () => {
    cleanupSubscriptions();

    // Subscribe to brands changes
    const brandsSubscription = supabase
      .channel('brands-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, (payload) => {
        handleBrandChange(payload);
      })
      .subscribe();

    // Subscribe to asset content changes
    const contentSubscription = supabase
      .channel('content-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asset_content' }, (payload) => {
        handleContentChange(payload);
      })
      .subscribe();

    // Subscribe to presence changes
    const presenceSubscription = supabase
      .channel('presence-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, (payload) => {
        loadOnlineUsers();
      })
      .subscribe();

    subscriptionsRef.current = [brandsSubscription, contentSubscription, presenceSubscription];
  };

  const handleBrandChange = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setBrands(currentBrands => {
      switch (eventType) {
        case 'INSERT':
          // Only add if not already present
          if (!currentBrands.find(b => b.id === newRecord.id)) {
            return [...currentBrands, newRecord];
          }
          return currentBrands;
        case 'UPDATE':
          return currentBrands.map(b => b.id === newRecord.id ? newRecord : b);
        case 'DELETE':
          return currentBrands.filter(b => b.id !== oldRecord.id);
        default:
          return currentBrands;
      }
    });
  };

  const handleContentChange = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setAssetContent(currentContent => {
      const updated = { ...currentContent };
      switch (eventType) {
        case 'INSERT':
        case 'UPDATE':
          updated[newRecord.id] = newRecord.content;
          break;
        case 'DELETE':
          delete updated[oldRecord.id];
          break;
      }
      return updated;
    });
  };

  const setupPresenceTracking = async () => {
    // Update presence immediately
    await updatePresence();

    // Update presence every 30 seconds
    presenceInterval.current = setInterval(() => {
      updatePresence();
      loadOnlineUsers();
    }, 30000);

    // Load initial online users
    loadOnlineUsers();

    // Cleanup presence on page unload
    window.addEventListener('beforeunload', removePresence);
  };

  const updatePresence = async (activeBrandId = null, activeAsset = null) => {
    if (!isOnlineMode()) return;

    try {
      await supabase
        .from('presence')
        .upsert({
          user_id: userId.current,
          user_name: userName.current,
          user_color: userColor.current,
          active_brand_id: activeBrandId,
          active_asset: activeAsset,
          last_seen: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  };

  const removePresence = async () => {
    if (!isOnlineMode()) return;

    try {
      await supabase
        .from('presence')
        .delete()
        .eq('user_id', userId.current);
    } catch (error) {
      console.error('Failed to remove presence:', error);
    }
  };

  const loadOnlineUsers = async () => {
    if (!isOnlineMode()) return;

    try {
      // Get users active in last 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('presence')
        .select('*')
        .gt('last_seen', twoMinutesAgo);

      if (error) throw error;

      // Filter out current user from display, but show total count
      setOnlineUsers(data || []);
    } catch (error) {
      console.error('Failed to load online users:', error);
    }
  };

  // Update brand in Supabase
  const updateBrand = useCallback(async (updatedBrand) => {
    // Update local state immediately for responsiveness
    setBrands(currentBrands =>
      currentBrands.map(b => b.id === updatedBrand.id ? updatedBrand : b)
    );

    if (!isOnlineMode()) {
      // Offline mode - save to localStorage
      setBrands(currentBrands => {
        localStorage.setItem('brand_engine_brands', JSON.stringify(currentBrands));
        return currentBrands;
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('brands')
        .upsert({
          ...updatedBrand,
          updated_at: new Date().toISOString(),
          updated_by: userId.current
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update brand:', error);
      setSyncError('Speichern fehlgeschlagen');
    }
  }, []);

  // Create new brand
  const createBrand = useCallback(async (newBrand) => {
    // Update local state immediately
    setBrands(currentBrands => [...currentBrands, newBrand]);

    if (!isOnlineMode()) {
      setBrands(currentBrands => {
        localStorage.setItem('brand_engine_brands', JSON.stringify(currentBrands));
        return currentBrands;
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('brands')
        .insert({
          ...newBrand,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: userId.current
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to create brand:', error);
      setSyncError('Erstellen fehlgeschlagen');
    }
  }, []);

  // Delete brand
  const deleteBrand = useCallback(async (brandId) => {
    // Update local state immediately
    setBrands(currentBrands => currentBrands.filter(b => b.id !== brandId));

    if (!isOnlineMode()) {
      setBrands(currentBrands => {
        localStorage.setItem('brand_engine_brands', JSON.stringify(currentBrands));
        return currentBrands;
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete brand:', error);
      setSyncError('Löschen fehlgeschlagen');
    }
  }, []);

  // Update asset content
  const updateAssetContent = useCallback(async (brandId, assetType, content) => {
    const contentId = `${brandId}-${assetType}`;

    // Update local state immediately
    setAssetContent(current => {
      const updated = { ...current, [contentId]: content };
      if (!isOnlineMode()) {
        localStorage.setItem('brand_engine_content', JSON.stringify(updated));
      }
      return updated;
    });

    if (!isOnlineMode()) return;

    try {
      const { error } = await supabase
        .from('asset_content')
        .upsert({
          id: contentId,
          brand_id: brandId,
          asset_type: assetType,
          content: content,
          updated_at: new Date().toISOString(),
          updated_by: userId.current
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update content:', error);
    }
  }, []);

  // Track user activity
  const trackActivity = useCallback((brandId, assetType) => {
    updatePresence(brandId, assetType);
  }, []);

  return {
    brands,
    assetContent,
    onlineUsers,
    isLoading,
    isOnline,
    syncError,
    currentUser: {
      id: userId.current,
      name: userName.current,
      color: userColor.current
    },
    updateBrand,
    createBrand,
    deleteBrand,
    updateAssetContent,
    trackActivity,
    refreshData: loadInitialData
  };
}
