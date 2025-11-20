import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Registration {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  event_api_id: string;
  status: 'pending' | 'code_sent' | 'signed_in' | 'completed' | 'failed';
  verification_code: string | null;
  luma_response: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
