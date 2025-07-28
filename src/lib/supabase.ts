import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For development, we'll use a fallback to prevent errors
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

// Check if the environment variables are set to placeholder values or are invalid
const isValidUrl = (url: string | undefined): boolean => {
  if (!url || url === 'your_supabase_url_here') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidKey = (key: string | undefined): boolean => {
  return !(!key || key === 'your_supabase_anon_key_here');
};

// Use fallback values if the environment variables are invalid or placeholder values
const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl : defaultUrl;
const finalKey = isValidKey(supabaseAnonKey) ? supabaseAnonKey : defaultKey;

export const supabase = createClient(
  finalUrl,
  finalKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const configured = isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey);
  console.log('Supabase configured:', configured, 'URL valid:', isValidUrl(supabaseUrl), 'Key valid:', isValidKey(supabaseAnonKey));
  return configured;
  return isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey);
};