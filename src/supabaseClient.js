import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL or Anon Key is missing. Please check your configuration." +
    "\nMake sure you've replaced 'YOUR_SUPABASE_URL' and 'YOUR_SUPABASE_ANON_KEY' in src/supabaseClient.js"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
