import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './tipos';

/** Cliente de Supabase del proyecto, con los tipos de la base. */
export type Cliente = SupabaseClient<Database>;
