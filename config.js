const SUPABASE_URL = "URL_SUPABASE_KAMU";
const SUPABASE_ANON_KEY = "ANON_KEY_KAMU";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
