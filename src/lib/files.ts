import { supabase } from "@/integrations/supabase/client";

export async function getUploadToken(filename: string, mime: string, size: number) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Not authenticated");
  }

  const res = await supabase.functions.invoke('storage-upload-url', {
    body: { filename, mime, size }
  });

  if (res.error) {
    throw new Error(res.error.message || "Failed to get upload token");
  }

  return res.data as { path: string; token: string; signedUrl: string };
}

export async function uploadWithToken(path: string, token: string, file: File) {
  return supabase.storage
    .from("user-files")
    .uploadToSignedUrl(path, token, file);
}

export async function listUserFiles(userId: string) {
  return supabase.storage
    .from("user-files")
    .list(userId, { 
      limit: 100, 
      sortBy: { column: "created_at", order: "desc" }
    });
}

export async function createDownloadUrl(path: string, expiresIn: number = 60) {
  return supabase.storage
    .from("user-files")
    .createSignedUrl(path, expiresIn);
}

export async function deleteFile(path: string) {
  return supabase.storage
    .from("user-files")
    .remove([path]);
}