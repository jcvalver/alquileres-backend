import path from "path";
import { getSupabaseAdmin, getSupabaseBucket } from "../config/storage";

export type UploadedObject = {
  /** Object key (path inside bucket) */
  key: string;
  /** Public URL (if bucket is public). */
  publicUrl: string;
};

function getPublicUrl(bucket: string, key: string): string {
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
}

export async function uploadImageToSupabase(params: {
  filePath: string;
  folder: "comprobantes" | "recibos";
  originalName: string;
}): Promise<UploadedObject> {
  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseBucket();

  const ext = path.extname(params.originalName) || ".bin";
  const key = `${params.folder}/${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;

  // Read file data from disk (multer diskStorage). This keeps current flow minimal.
  const fs = await import("fs/promises");
  const body = await fs.readFile(params.filePath);

  const { error } = await supabase.storage.from(bucket).upload(key, body, {
    upsert: true,
    contentType: "application/octet-stream",
  });

  if (error) {
    throw new Error(`Error subiendo archivo a Supabase Storage: ${error.message}`);
  }

  const publicUrl = getPublicUrl(bucket, key);
  return { key, publicUrl };
}

export async function deleteFromSupabaseByPublicUrl(publicUrl: string): Promise<void> {
  // We store URLs; to delete we need the object key. We'll parse it when possible.
  // Expected URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<key>
  const marker = "/storage/v1/object/public/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const rest = publicUrl.substring(idx + marker.length);
  const slash = rest.indexOf("/");
  if (slash === -1) return;

  const bucket = rest.substring(0, slash);
  const key = rest.substring(slash + 1);

  const supabase = getSupabaseAdmin();
  await supabase.storage.from(bucket).remove([key]);
}
