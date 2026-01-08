
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../../constants';

// Create a single instance of the Supabase client
// This prevents multiple instances from being created during re-renders
export const supabase = (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey)
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;
