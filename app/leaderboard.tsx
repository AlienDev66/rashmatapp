import { Avatar, Screen } from "@/src/components/ui/Screen";
import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import {
  fetchGlobalLeaderboard,
  fetchProgramLeaderboard,
  type LeaderboardEntry,
  type LeaderboardPeriod,
} from "@/src/data/leaderboard";
import { useCatalog } from "@/src/hooks/useCatalog";
import { useProgress } from "@/src/hooks/useProgress";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useT } from "@/src/i18n";

export default function LeaderboardScreen() {
  const t = useT();
  const { user, profile } = useAuth();
  const { enrollments } = useProgress();
  const { programs } = useCatalog();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all_time");
  const [scope, setScope] = useState<"global" | string>("global");
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const campOptions = useMemo(() => {
    return enrollments
      .map((e) => programs.find((p) => p.id === e.programId))
      .filter(Boolean)
      .slice(0, 6) as { id: string; title: string }[];
  }, [enrollments, programs]);

  const isGlobal = scope === "global";

  const load = useCallback(async () => {
    setLoading(true);
    const data = isGlobal
      ? await fetchGlobalLeaderboard(period)
      : await fetchProgramLeaderboard(scope);
    setRows(data);
    setLoading(false);
  }, [period, scope, isGlobal]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const you = useMemo(() => {
    if (!user) return null;
    const found = rows.find((r) => r.userId === user.id);
    if (found) return found;
    // Show local XP even if not yet on the board
    if ((profile?.xp ?? 0) > 0) {
      return {
        userId: user.id,
        fullName: profile?.full_name ?? t("board.you"),
        avatarUrl: profile?.avatar_url ?? null,
        xp: profile?.xp ?? 0,
        rank: 0,
      } satisfies LeaderboardEntry;
    }
    return null;
  }, [rows, user, profile, t]);

  const podium = rows.slice(0, 3);
  const listRows = rows.filter((r) => r.userId !== user?.id);

  const shortTitle = (title: string) => {
    if (title.length <= 18) return title;
    return `${title.slice(0, 16)}…`;
  };

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>{t("screens.leaderboard")}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isGlobal ? (
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, period === "all_time" && styles.tabOn]}
            onPress={() => setPeriod("all_time")}
          >
            <Text style={[styles.tabText, period === "all_time" && styles.tabTextOn]}>
              {t("board.allTime")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, period === "monthly" && styles.tabOn]}
            onPress={() => setPeriod("monthly")}
          >
            <Text style={[styles.tabText, period === "monthly" && styles.tabTextOn]}>
              {t("board.monthly")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.campHint}>{t("board.campHint")}</Text>
      )}

      {campOptions.length > 0 ? (
        <View style={styles.chipWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.campChips}
          >
            <Pressable
              style={[styles.chip, isGlobal && styles.chipOn]}
              onPress={() => setScope("global")}
            >
              <Text style={[styles.chipText, isGlobal && styles.chipTextOn]}>
                {t("board.global")}
              </Text>
            </Pressable>
            {campOptions.map((p) => {
              const on = scope === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => setScope(p.id)}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                    {shortTitle(p.title)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : rows.length === 0 ? (
        <EmptyState
          tone="default"
          title={t("board.noRankings")}
          message={t("board.noRankingsBody")}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {podium.length >= 2 ? (
            <View style={styles.podium}>
              <PodiumSlot entry={podium[1]} place={2} t={t} />
              <PodiumSlot entry={podium[0]} place={1} featured t={t} />
              <PodiumSlot entry={podium[2]} place={3} t={t} />
            </View>
          ) : podium[0] ? (
            <View style={styles.soloPodium}>
              <Avatar uri={podium[0].avatarUrl} name={podium[0].fullName} size={72} />
              <Text style={styles.place}>{t("board.firstPlace")}</Text>
              <Text style={styles.podiumName} numberOfLines={1}>
                {podium[0].userId === user?.id ? t("board.you") : podium[0].fullName}
              </Text>
              <Text style={styles.podiumXp}>
                {t("board.xpValue", { n: podium[0].xp.toLocaleString() })}
              </Text>
              {rows.length === 1 ? (
                <Text style={styles.soloHint}>{t("board.soloHint")}</Text>
              ) : null}
            </View>
          ) : null}

          {you ? (
            <View style={styles.youRow}>
              <Text style={styles.rankNum}>{you.rank > 0 ? you.rank : "—"}</Text>
              <Avatar uri={you.avatarUrl ?? profile?.avatar_url} name={you.fullName} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.youLabel}>{t("board.you")}</Text>
                <Text style={styles.youRank}>
                  {you.rank > 0
                    ? `${you.rank}${ordinal(you.rank, t)}`
                    : t("board.unranked")}
                </Text>
              </View>
              <Text style={styles.youXp}>
                {t("board.xpValue", { n: you.xp.toLocaleString() })}
              </Text>
            </View>
          ) : null}

          <Text style={styles.listLabel}>{t("board.rankings")}</Text>
          {listRows.length === 0 && you ? (
            <Text style={styles.emptyPeers}>{t("board.emptyPeers")}</Text>
          ) : null}
          {listRows.map((r) => (
            <View key={r.userId} style={styles.row}>
              <Text style={styles.rankNum}>{r.rank}</Text>
              <Avatar uri={r.avatarUrl} name={r.fullName} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{r.fullName}</Text>
                <Text style={styles.rowRank}>
                  {r.rank}
                  {ordinal(r.rank, t)}
                  {r.sessionsDone != null
                    ? ` · ${t("board.sessionsDone", { n: r.sessionsDone })}`
                    : ""}
                </Text>
              </View>
              <Text style={styles.rowXp}>
                {t("board.xpValue", { n: r.xp.toLocaleString() })}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

function PodiumSlot({
  entry,
  place,
  featured,
  t,
}: {
  entry?: LeaderboardEntry;
  place: 1 | 2 | 3;
  featured?: boolean;
  t: Translate;
}) {
  if (!entry) {
    return <View style={styles.podiumSlot} />;
  }
  return (
    <View style={[styles.podiumSlot, featured && styles.podiumFirst]}>
      <Avatar uri={entry.avatarUrl} name={entry.fullName} size={featured ? 68 : 52} />
      <View style={[styles.placePill, featured && styles.placePillFirst]}>
        <Text style={[styles.placePillText, featured && styles.placePillTextFirst]}>
          {place}
          {ordinal(place, t)}
        </Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.fullName}
      </Text>
      <Text style={styles.podiumXp}>
        {t("board.xpValue", { n: entry.xp.toLocaleString() })}
      </Text>
    </View>
  );
}

function ordinal(n: number, t: Translate) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return t("board.ordN");
  switch (n % 10) {
    case 1:
      return t("board.ord1");
    case 2:
      return t("board.ord2");
    case 3:
      return t("board.ord3");
    default:
      return t("board.ordN");
  }
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  tabOn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  tabText: { color: colors.textMuted, fontFamily: fonts.poppinsSemiBold, fontSize: 13 },
  tabTextOn: { color: colors.white },
  campHint: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginBottom: 10,
  },
  chipWrap: {
    height: 40,
    marginBottom: 8,
  },
  chipScroll: {
    flexGrow: 0,
  },
  campChips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 168,
  },
  chipOn: { backgroundColor: colors.accent },
  chipText: {
    color: colors.white,
    fontFamily: fonts.poppinsMedium,
    fontSize: 12,
  },
  chipTextOn: { color: colors.black },
  content: { paddingBottom: 40, gap: 8, paddingTop: 4 },
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
    minHeight: 140,
  },
  soloPodium: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    marginBottom: 4,
  },
  soloHint: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  podiumSlot: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    maxWidth: 120,
  },
  podiumFirst: { marginBottom: 10 },
  place: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
  },
  placePill: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  placePillFirst: { backgroundColor: colors.accent },
  placePillText: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
  },
  placePillTextFirst: { color: colors.black },
  podiumName: {
    color: colors.white,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 12,
    textAlign: "center",
    width: "100%",
  },
  podiumXp: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
  },
  youRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(241,188,3,0.35)",
    marginTop: 4,
  },
  youLabel: { color: colors.white, fontFamily: fonts.poppinsSemiBold },
  youRank: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12 },
  youXp: { color: colors.accent, fontFamily: fonts.poppinsSemiBold },
  listLabel: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 2,
  },
  emptyPeers: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginBottom: 8,
  },
  rankNum: {
    width: 28,
    color: colors.textMuted,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 14,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
  },
  rowName: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 14 },
  rowRank: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 12,
    marginTop: 2,
  },
  rowXp: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 13 },
});
