import { resolveVideoUrl } from "@/src/lib/video";
import { getOfflineVideoUri } from "@/src/lib/offlineVideo";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

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

/**
 * Session exercise player — offline file → Mux HLS → direct URL.
 * Does not loop by default; fires onEnded when the clip finishes.
 */
export function SessionVideo({
  cacheKey,
  muxPlaybackId,
  videoUrl,
  playing = true,
  playbackRate = 1,
  loop = false,
  onEnded,
  style,
}: Props) {
  const [source, setSource] = useState(() =>
    resolveVideoUrl({ muxPlaybackId, videoUrl }),
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cacheKey) {
        const local = await getOfflineVideoUri(cacheKey);
        if (!cancelled && local) {
          setSource(local);
          return;
        }
      }
      if (!cancelled) {
        setSource(resolveVideoUrl({ muxPlaybackId, videoUrl }));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, muxPlaybackId, videoUrl]);

  const player = useVideoPlayer(source, (p) => {
    p.loop = loop;
    p.playbackRate = playbackRate;
    if (playing) p.play();
  });

  useEffect(() => {
    void player.replaceAsync(source);
  }, [source, player]);

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

  return (
    <View style={[StyleSheet.absoluteFill, styles.wrap, style]}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
        fullscreenOptions={{ enable: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
