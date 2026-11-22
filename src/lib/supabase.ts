import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://asfqnajgfkgllpwjzjoc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_-qY1ouJ01LGc4aT4s-rK9w_YAOpXYxB';

export const supabase = createClient(supabaseUrl, supabaseKey);
