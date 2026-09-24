import { Avatar } from "@/src/components/ui/Avatar";
import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { fetchMyCreatorFollowers, type FollowerRow } from "@/src/data/follows";
import { colors, fonts, radii } from "@/src/theme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

/** Creator Studio: who follows your creator profile. */
export default function StudioFollowersScreen() {
  const [rows, setRows] = useState<FollowerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        setLoading(true);
        const data = await fetchMyCreatorFollowers();
        if (!cancelled) {
          setRows(data);
          setLoading(false);
        }
      };
      void run();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Followers</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.sub}>
        Athletes following your creator profile — separate from students who unlocked a camp.
      </Text>

      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> : null}

      {!loading && rows.length === 0 ? (
        <EmptyState
          tone="creators"
          title="No followers yet"
          message="Share your programs — followers appear when athletes tap Follow on your profile."
          actionLabel="My programs  →"
          onAction={() => router.push("/studio")}
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={{ paddingBottom: 40, gap: 10 }}
          ListHeaderComponent={
            !loading ? (
              <Text style={styles.count}>{rows.length} follower{rows.length === 1 ? "" : "s"}</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar uri={item.avatarUrl ?? undefined} name={item.fullName} size={44} ring />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.meta}>
                  Since {new Date(item.followedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  sub: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginBottom: 16,
  },
  count: {
    color: colors.accent,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
  },
  name: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 15 },
  meta: { color: colors.textMuted, fontFamily: fonts.poppinsRegular, fontSize: 12, marginTop: 2 },
});
