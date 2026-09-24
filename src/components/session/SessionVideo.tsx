import { useT } from "@/src/i18n";
import { resolveVideoSource } from "@/src/lib/video";
import { getOfflineVideoUri } from "@/src/lib/offlineVideo";
import { colors, fonts } from "@/src/theme";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  cacheKey?: string;
  muxPlaybackId?: string | null;
  videoUrl?: string | null;
  playing?: boolean;
  playbackRate?: number;
  loop?: boolean;
  onEnded?: () => void;
  style?: StyleProp<ViewStyle>;
};

function toPlayerSource(src: string | number): VideoSource {
  if (typeof src === "number") return src;
  return { uri: src };
}

/**
 * Session drill player — bundled MP4 assets by default (always picture + audio).
 * Remount via parent `key={exercise.id}` when the drill changes.
 */
export function SessionVideo({
  cacheKey,
  muxPlaybackId,
  videoUrl,
  playing = true,
  playbackRate = 1,
  loop = true,
  onEnded,
  style,
}: Props) {
  const t = useT();
  const resolved = useMemo(
    () => resolveVideoSource({ muxPlaybackId, videoUrl, cacheKey }),
    [muxPlaybackId, videoUrl, cacheKey],
  );
  const initial = useMemo(() => toPlayerSource(resolved), [resolved]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const loadedOffline = useRef(false);

  const player = useVideoPlayer(initial, (p) => {
    p.loop = loop;
    p.playbackRate = playbackRate;
    p.staysActiveInBackground = false;
    if (playing) p.play();
  });

  // Optional: swap to offline file if cached
  useEffect(() => {
    if (!cacheKey || loadedOffline.current) return;
    let cancelled = false;
    void getOfflineVideoUri(cacheKey).then((local) => {
      if (cancelled || !local) return;
      loadedOffline.current = true;
      void player.replaceAsync({ uri: local }).then(() => {
        if (playing) player.play();
      });
    });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, player, playing]);

  useEffect(() => {
    player.loop = loop;
  }, [loop, player]);

  useEffect(() => {
    player.playbackRate = playbackRate;
  }, [playbackRate, player]);

  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [playing, player]);

  useEventListener(player, "playToEnd", () => {
    onEnded?.();
  });

  useEventListener(player, "statusChange", ({ status: s, error }) => {
    if (s === "error") {
      setStatus("error");
      setErrorMsg(error?.message ?? "Playback error");
    } else if (s === "readyToPlay") {
      setStatus("ready");
      if (playing) player.play();
    } else if (s === "loading") {
      setStatus("loading");
    }
  });

  return (
    <View style={[styles.wrap, style]} collapsable={false}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        playsInline
        {...(Platform.OS === "android" ? { surfaceType: "textureView" as const } : null)}
      />
      {status === "loading" ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : null}
      {status === "error" ? (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.errorTitle}>{t("video.unavailable")}</Text>
          <Text style={styles.errorBody}>{errorMsg ?? t("video.retryHint")}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 24,
    gap: 8,
  },
  errorTitle: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  errorBody: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    textAlign: "center",
  },
});
