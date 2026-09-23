import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";
import { captureRef } from "react-native-view-shot";
import type { RefObject } from "react";
import type { View } from "react-native";

/**
 * Capture a story card view and share it — prefers Instagram Stories when possible
 * (Android intent), otherwise the system share sheet (iOS / fallback) where
 * Instagram Stories appears for images.
 */
export async function shareWorkoutStory(opts: {
  viewRef: RefObject<View | null>;
  fileName?: string;
}) {
  const node = opts.viewRef.current;
  if (!node) throw new Error("Story card not ready");

  const uri = await captureRef(node, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    // Story resolution
    width: 1080,
    height: 1920,
  });

  const dest =
    `${FileSystem.cacheDirectory ?? ""}${opts.fileName ?? "rashmat-story"}-${Date.now()}.png`;
  await FileSystem.copyAsync({ from: uri, to: dest });

  if (Platform.OS === "android") {
    try {
      const contentUri = await FileSystem.getContentUriAsync(dest);
      await IntentLauncher.startActivityAsync("com.instagram.share.ADD_TO_STORY", {
        type: "image/png",
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        extra: {
          interactive_asset_uri: contentUri,
          "source_application": "com.rashmat.app",
        },
      });
      return { method: "instagram-stories" as const };
    } catch {
      // Instagram missing or intent failed — fall through to share sheet
    }
  }

  // iOS + Android fallback: share sheet (Instagram Stories shows for images)
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("Sharing is not available on this device");

  // Try opening Instagram Stories camera if installed (user pastes / picks from share)
  const igStories = await Linking.canOpenURL("instagram-stories://share");
  if (Platform.OS === "ios" && igStories) {
    // Share sheet still gives the cleanest path without a Facebook App ID
    await Sharing.shareAsync(dest, {
      mimeType: "image/png",
      UTI: "public.png",
      dialogTitle: "Add to Instagram Story",
    });
    return { method: "share-sheet" as const };
  }

  await Sharing.shareAsync(dest, {
    mimeType: "image/png",
    UTI: "public.png",
    dialogTitle: "Share workout",
  });
  return { method: "share-sheet" as const };
}
