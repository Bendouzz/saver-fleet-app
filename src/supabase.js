import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tgmzrhldehltqsloylqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LURLrl4BHKhrC-sWyf2SPw_p45JMMgS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);