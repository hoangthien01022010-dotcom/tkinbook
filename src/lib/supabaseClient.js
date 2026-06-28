// Re-export the Lovable-managed Supabase client so JSX code can import
// `@/lib/supabaseClient` without touching the auto-generated TS file.
import { supabase } from '@/integrations/supabase/client';
export { supabase };
export default supabase;
