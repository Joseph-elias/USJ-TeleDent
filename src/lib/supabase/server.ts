import "server-only";

import { createClient } from "@supabase/supabase-js";

// Configuration only: this does not establish a user session or bypass RLS.
// Create lazily so the existing static pages build without database credentials.
export function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env.local before using Supabase.",
    );
  }

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
