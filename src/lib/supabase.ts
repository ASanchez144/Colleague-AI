/**
 * Supabase client for Sebas.ai / Colleague-AI
 *
 * Usage:
 *   import { supabase } from '@/src/lib/supabase';
 *
 * Requires env vars (set in .env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * NOTE: This file is created as a foundation for the Supabase migration.
 * Firebase is still the active auth/DB layer — this client will be
 * connected to the app in a future phase.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. ' +
    'Supabase client will not work until configured.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
