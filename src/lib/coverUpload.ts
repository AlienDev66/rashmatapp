import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import * as ImagePicker from "expo-image-picker";

const COVER_BUCKET = "covers";
const MAX_BYTES = 5 * 1024 * 1024;

function resolveContentType(uri: string, mimeType?: string | null) {
  if (mimeType === "image/png" || mimeType === "image/webp" || mimeType === "image/jpeg") {
    return mimeType;
  }
  const ext = (uri.split(".").pop() ?? "jpg").toLowerCase().split("?")[0];
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function extensionFor(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

export async function pickProgramCover() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return { error: "studioScreens.photoPermission", uri: null as string | null, mimeType: null as string | null };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    return { error: null, uri: null, mimeType: null };
  }

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_BYTES) {
    return { error: "studioScreens.coverTooLarge", uri: null, mimeType: null };
  }

  return {
    error: null,
    uri: asset.uri,
    mimeType: asset.mimeType ?? null,
  };
}

/** Path: {userId}/programs/{programId}.{ext} */
export async function uploadProgramCover(
  userId: string,
  programId: string,
  localUri: string,
  mimeType?: string | null,
) {
  if (!isSupabaseConfigured) {
    return { error: "studioScreens.supabaseMissing", url: null as string | null };
  }

  const contentType = resolveContentType(localUri, mimeType);
  const path = `${userId}/programs/${programId}.${extensionFor(contentType)}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, arrayBuffer, { contentType, upsert: true });

  if (uploadError) {
    return { error: uploadError.message, url: null };
  }

  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  return { error: null, url: `${data.publicUrl}?t=${Date.now()}` };
}
