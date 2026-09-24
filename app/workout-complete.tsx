import { WorkoutStoryCard } from "@/src/components/session/WorkoutStoryCard";
import { Button } from "@/src/components/ui/Button";
import { QueryGate } from "@/src/components/ui/QueryGate";
import { fetchSetHistory } from "@/src/data/progress";
import { useWorkoutSession } from "@/src/hooks/useResource";
import { shareWorkoutStory } from "@/src/lib/shareStory";
import { colors, fonts, radii, spacing } from "@/src/theme";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Share2 } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@/src/i18n";

function formatStoryDate(monthsShort: string, d = new Date()) {
  const months = monthsShort.split(",");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function WorkoutCompleteScreen() {
  const t = useT();
  const { id, xp } = useLocalSearchParams<{ id?: string; xp?: string }>();
  const { data: session, loading, error, reload } = useWorkoutSession(id);
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [setsDone, setSetsDone] = useState(0);
  const [sharing, setSharing] = useState(false);
  const xpShown = Number(xp) || 0;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const [displayXp, setDisplayXp] = useState(0);
  const storyRef = useRef<View>(null);
  const dateLabel = useMemo(
    () => formatStoryDate(t("workoutDone.monthsShort")),
    [t],
  );

  const storyWidth = Math.min(280, screenW - 72);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    if (!session) return;
    void fetchSetHistory(session.id).then((rows) => setSetsDone(rows.length));
  }, [session]);

  useEffect(() => {
    if (!xpShown) return;
    xpAnim.setValue(0);
    const idAnim = xpAnim.addListener(({ value }) => {
      setDisplayXp(Math.round(value));
    });
    Animated.timing(xpAnim, {
      toValue: xpShown,
      duration: 1100,
      useNativeDriver: false,
    }).start();
    return () => {
      xpAnim.removeListener(idAnim);
    };
  }, [xpShown, xpAnim]);

  const setsLabel = setsDone || session?.exerciseCount || session?.exercises.length || 0;

  const onShareStory = async () => {
    if (!session || sharing) return;
    setSharing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await new Promise((r) => setTimeout(r, 120));
      await shareWorkoutStory({
        viewRef: storyRef,
        fileName: `rashmat-${session.id}`,
      });
    } catch (e) {
      Alert.alert(
        t("workoutDone.shareFailTitle"),
        e instanceof Error ? e.message : t("workoutDone.shareFailBody"),
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.root}>
      <QueryGate
        loading={loading}
        error={error}
        empty={!id || !session}
        emptyTone="training"
        emptyTitle={t("workoutDone.notFound")}
        emptyMessage={t("workoutDone.notFoundBody")}
        emptyActionLabel={t("workoutDone.backHome")}
        emptyOnAction={() => router.replace("/(tabs)")}
        onRetry={reload}
      >
        {session ? (
          <>
            <Image
              source={{ uri: session.coverUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              blurRadius={18}
            />
            <LinearGradient
              colors={["rgba(20,17,17,0.55)", "rgba(20,17,17,0.92)", "#141111"]}
              locations={[0, 0.4, 0.82]}
              style={StyleSheet.absoluteFill}
            />

            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={styles.kicker}>{t("workoutDone.kicker")}</Text>
                <Text style={styles.title}>{t("workoutDone.title")}</Text>
                <Text style={styles.sub} numberOfLines={2}>
                  {session.title}
                </Text>
              </View>

              {/* Phone-frame preview */}
              <View style={styles.phone}>
                <View style={styles.phoneNotch} />
                <WorkoutStoryCard
                  ref={storyRef}
                  width={storyWidth}
                  stats={{
                    title: session.title,
                    coverUrl: session.coverUrl,
                    xp: displayXp || xpShown,
                    minutes: session.minutes,
                    sets: setsLabel,
                    drills: session.exercises.length,
                    dateLabel,
                  }}
                />
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.shareBtn, sharing && { opacity: 0.72 }]}
                  onPress={() => void onShareStory()}
                  disabled={sharing}
                >
                  {sharing ? (
                    <ActivityIndicator color={colors.black} />
                  ) : (
                    <Share2 color={colors.black} size={20} />
                  )}
                  <Text style={styles.shareBtnText}>
                    {sharing ? t("workoutDone.preparing") : t("workoutDone.addToStory")}
                  </Text>
                </Pressable>

                <Button
                  label={t("workoutDone.backHome")}
                  variant="surface"
                  onPress={() => router.replace("/(tabs)")}
                />
                {session.programId ? (
                  <Pressable
                    onPress={() =>
                      router.replace({
                        pathname: "/program/[id]",
                        params: { id: session.programId },
                      })
                    }
                    style={styles.linkBtn}
                  >
                    <Text style={styles.linkBtnText}>{t("workoutDone.viewProgram")}</Text>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>
          </>
        ) : null}
      </QueryGate>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  header: {
    alignSelf: "stretch",
    marginBottom: 22,
  },
  kicker: {
    color: colors.accent,
    fontFamily: fonts.alumniScSemiBoldItalic,
    fontSize: 13,
    letterSpacing: 2.2,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.alumniBoldItalic,
    fontSize: 40,
    lineHeight: 42,
    marginTop: 8,
  },
  sub: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: fonts.poppinsMedium,
    fontSize: 14,
    marginTop: 8,
  },
  phone: {
    borderRadius: 28,
    padding: 8,
    paddingTop: 14,
    backgroundColor: "#0A0909",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  phoneNotch: {
    width: 72,
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 10,
  },
  actions: {
    width: "100%",
    marginTop: 26,
    gap: 10,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.accent,
    paddingVertical: 17,
    borderRadius: radii.lg,
  },
  shareBtnText: {
    color: colors.black,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 15,
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkBtnText: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsMedium,
    fontSize: 14,
  },
});
