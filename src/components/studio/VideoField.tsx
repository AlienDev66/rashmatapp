import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/TextField";
import { useT } from "@/src/i18n";
import { pickVideo, uploadVideoToStorage } from "@/src/lib/videoUpload";
import { colors, fonts } from "@/src/theme";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export type VideoValue = {
  muxPlaybackId: string;
  videoUrl: string;
};

type Props = {
  userId: string;
  value: VideoValue;
  onChange: (next: VideoValue) => void;
  disabled?: boolean;
};

/**
 * Primary: upload MP4 to Supabase Storage.
 * Advanced: paste Mux ID or https URL.
 */
export function VideoField({ userId, value, onChange, disabled }: Props) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasVideo = Boolean(value.videoUrl || value.muxPlaybackId);
  const pasteValue = value.videoUrl || value.muxPlaybackId;

  const onUpload = async () => {
    setError(null);
    setInfo(null);
    const picked = await pickVideo();
    if (picked.error) {
      setError(t(picked.error));
      return;
    }
    if (!picked.uri) return;

    setBusy(true);
    const sizeMb = picked.fileSize ? (picked.fileSize / (1024 * 1024)).toFixed(1) : "?";
    setInfo(t("studioScreens.videoUploading", { size: sizeMb }));
    try {
      const { url, error: upErr } = await uploadVideoToStorage(userId, picked.uri, {
        mimeType: picked.mimeType,
        fileName: picked.fileName,
      });
      if (upErr || !url) {
        setError(upErr ? (upErr.startsWith("studioScreens.") ? t(upErr) : upErr) : t("studioScreens.uploadFailed"));
        setInfo(null);
        return;
      }
      onChange({ muxPlaybackId: "", videoUrl: url });
      setInfo(t("studioScreens.videoReady"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("studioScreens.uploadFailed"));
      setInfo(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Button
        label={
          busy
            ? "…"
            : hasVideo
              ? t("studioScreens.videoReplace")
              : t("studioScreens.videoUpload")
        }
        variant="surface"
        disabled={disabled || busy}
        onPress={() => void onUpload()}
      />
      {hasVideo ? (
        <Text style={styles.status} numberOfLines={1}>
          {value.videoUrl
            ? t("studioScreens.videoAttachedStorage")
            : t("studioScreens.videoAttachedMux")}
        </Text>
      ) : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text
        style={styles.advancedToggle}
        onPress={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? t("studioScreens.videoHideAdvanced") : t("studioScreens.videoAdvanced")}
      </Text>
      {showAdvanced ? (
        <TextField
          value={pasteValue}
          onChangeText={(raw) => {
            const v = raw.trim();
            if (/^https?:\/\//i.test(v)) {
              onChange({ muxPlaybackId: "", videoUrl: v });
            } else {
              onChange({ muxPlaybackId: v, videoUrl: "" });
            }
          }}
          placeholder={t("studioScreens.videoPastePlaceholder")}
          autoCapitalize="none"
          editable={!disabled && !busy}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  status: {
    color: colors.accent,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
  },
  info: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
  },
  advancedToggle: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
    marginTop: 2,
  },
});
