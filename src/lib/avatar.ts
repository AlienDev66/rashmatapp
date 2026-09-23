import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import * as ImagePicker from "expo-image-picker";

const AVATAR_BUCKET = "avatars";

type PickedImage = {
  error: string | null;
  uri: string | null;
  mimeType: string | null;
};

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

export async function pickProfileImage(): Promise<PickedImage> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return { error: "Photo library permission is required.", uri: null, mimeType: null };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    return { error: null, uri: null, mimeType: null };
  }

  const asset = result.assets[0];
  return {
    error: null,
    uri: asset.uri,
    mimeType: asset.mimeType ?? null,
  };
}

/** Upload avatar to Supabase Storage and return a cache-busted public URL. */
export async function uploadAvatar(
  userId: string,
  localUri: string,
  mimeType?: string | null,
) {
  if (!isSupabaseConfigured) {
    return { error: "Supabase not configured", url: null as string | null };
  }

  const contentType = resolveContentType(localUri, mimeType);
  const path = `${userId}/avatar.${extensionFor(contentType)}`;

  // React Native blobs often report `text/plain`, which Supabase Storage rejects.
  // Upload the raw bytes with an explicit contentType instead.
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, arrayBuffer, { contentType, upsert: true });

  if (uploadError) {
    return { error: uploadError.message, url: null as string | null };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  return { error: null, url };
}
