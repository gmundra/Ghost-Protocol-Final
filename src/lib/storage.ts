import { supabase } from "@/integrations/supabase/client";

const BUCKET = "ghost-media";
const HERO_BUCKET = "hero-media";

export async function uploadToMedia(
  file: Blob | File,
  folder = "library",
  filename?: string,
  bucket: string = BUCKET,
): Promise<string> {
  const ext = (filename ?? (file as File).name ?? "file.bin").split(".").pop() ?? "bin";
  const name = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(name, file, {
    contentType: (file as File).type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return name; // store path; sign on read
}

export async function signedUrl(
  path: string | null | undefined,
  expires = 60 * 60 * 24 * 7,
  bucket: string = BUCKET,
): Promise<string | null> {
  if (!path) return null;
  // already a full URL?
  if (/^https?:\/\//.test(path)) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expires);
  return data?.signedUrl ?? null;
}

export async function listMedia(folder = "", bucket: string = BUCKET) {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  return data ?? [];
}

export async function removeMedia(path: string, bucket: string = BUCKET) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const r = await fetch(dataUrl);
  return await r.blob();
}

export { BUCKET as MEDIA_BUCKET, HERO_BUCKET };
