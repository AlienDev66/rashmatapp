import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import * as ImagePicker from "expo-image-picker";

const VIDEO_BUCKET = "videos";
const MAX_BYTES = 100 * 1024 * 1024; // 100MB

const ALLOWED = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

function extensionFor(uri: string, mimeType?: string | null) {
  const fromUri = uri.split(".").pop()?.toLowerCase().split("?")[0];
  if (fromUri && ["mp4", "mov", "webm", "m4v"].includes(fromUri)) return fromUri;
  if (mimeType === "video/webm") return "webm";
  if (mimeType === "video/quicktime") return "mov";
  return "mp4";
}

export async function pickVideo() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return {
      error: "studioScreens.photoPermission",
      uri: null as string | null,
      mimeType: null as string | null,
      fileName: null as string | null,
      fileSize: null as number | null,
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    quality: 1,
    videoMaxDuration: 60 * 30,
  });

  if (result.canceled || !result.assets[0]) {
    return { error: null, uri: null, mimeType: null, fileName: null, fileSize: null };
  }

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_BYTES) {
    return {
      error: "studioScreens.videoTooLarge",
      uri: null,
      mimeType: null,
      fileName: null,
      fileSize: null,
    };
  }

  if (asset.mimeType && !ALLOWED.has(asset.mimeType) && !asset.mimeType.startsWith("video/")) {
    return {
      error: "studioScreens.videoType",
      uri: null,
      mimeType: null,
      fileName: null,
      fileSize: null,
    };
  }

  return {
    error: null,
    uri: asset.uri,
    mimeType: asset.mimeType ?? null,
    fileName: asset.fileName ?? "clip",
    fileSize: asset.fileSize ?? null,
  };
}

/** Path: {userId}/clips/{timestamp}-{safeName}.ext */
export async function uploadVideoToStorage(
  userId: string,
  localUri: string,
  opts?: { mimeType?: string | null; fileName?: string | null },
) {
  if (!isSupabaseConfigured) {
    return { error: "studioScreens.supabaseMissing", url: null as string | null };
  }

  const mimeType = opts?.mimeType ?? null;
  const ext = extensionFor(localUri, mimeType);
  const safe = (opts?.fileName ?? "clip")
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const path = `${userId}/clips/${Date.now().toString(36)}-${safe || "clip"}.${ext}`;
  const contentType =
    mimeType && ALLOWED.has(mimeType) ? mimeType : "video/mp4";

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(path, arrayBuffer, { contentType, upsert: false });

  if (uploadError) {
    return { error: uploadError.message, url: null };
  }

  const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path);
  return { error: null, url: data.publicUrl };
}
