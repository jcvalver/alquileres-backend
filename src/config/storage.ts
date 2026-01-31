import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type StorageConfig = {
  provider: "local" | "supabase";
};

export const storageConfig: StorageConfig = {
  provider: (process.env.STORAGE_PROVIDER as StorageConfig["provider"]) || "local",
};

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos cuando STORAGE_PROVIDER=supabase"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function getSupabaseBucket(): string {
  return process.env.SUPABASE_BUCKET || "alquileres";
}
