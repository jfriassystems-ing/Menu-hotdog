import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { CONFIG } from './config.js';

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
  throw new Error('[supabase-client] Faltan credenciales en config.js');
}

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
