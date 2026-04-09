import { createClient } from '@supabase/supabase-js';

// J'ai extrait l'identifiant de ton projet (tgmzrhldehltqsloylqs) pour créer l'URL correcte
const supabaseUrl = 'https://tgmzrhldehltqsloylqs.supabase.co';

const supabaseAnonKey = 'sb_publishable_LURLrl4BHKhrC-sWyf2SPw_p45JMMgS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
