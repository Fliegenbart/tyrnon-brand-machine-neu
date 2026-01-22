import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using offline mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isOnlineMode = () => !!supabase;

// Generate anonymous user ID for presence tracking
export const getOrCreateUserId = () => {
  let userId = localStorage.getItem('brand_engine_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('brand_engine_user_id', userId);
  }
  return userId;
};

// Generate random avatar color based on user ID
export const getUserColor = (userId) => {
  const colors = ['#5e5ce6', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8'];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Generate random animal name for anonymous users
export const getUserName = (userId) => {
  const animals = ['Fuchs', 'Eule', 'Bär', 'Wolf', 'Adler', 'Hase', 'Reh', 'Dachs', 'Igel', 'Otter'];
  const adjectives = ['Clever', 'Schnell', 'Mutig', 'Sanft', 'Weise', 'Flink', 'Still', 'Wach'];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `${adjectives[hash % adjectives.length]}er ${animals[(hash * 7) % animals.length]}`;
};
