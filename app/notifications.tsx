import { BackButton } from "@/src/components/ui/BackButton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Screen } from "@/src/components/ui/Screen";
import { colors, fonts, radii, spacing } from "@/src/theme";
import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const NOTIFS = [
  {
    id: "1",
    title: "Session reminder",
    body: "Drill + Guard Pass starts in 30 minutes.",
    time: "2h ago",
    unread: true,
  },
  {
    id: "2",
    title: "New program drop",
    body: "Mica Galvão published ADCC Competition updates.",
    time: "Yesterday",
    unread: true,
  },
  {
    id: "3",
    title: "Streak saved",
    body: "You completed Day 2. Keep the 4-session pace.",
    time: "2d ago",
    unread: false,
  },
];

export default function NotificationsScreen() {
  const empty = NOTIFS.length === 0;

  return (
    <Screen>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {empty ? (
        <EmptyState
          tone="notifications"
          title="You're all caught up"
          message="Session reminders and creator drops will land here."
          actionLabel="Back to training  →"
          onAction={() => router.back()}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {NOTIFS.map((n) => (
            <Pressable key={n.id} style={[styles.card, n.unread && styles.cardUnread]}>
              <View style={styles.icon}>
                <Bell color={n.unread ? colors.accent : colors.textMuted} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                <Text style={styles.cardBody}>{n.body}</Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: { color: colors.white, fontFamily: fonts.poppinsBold, fontSize: 17 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: "rgba(245,197,24,0.35)",
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: colors.white, fontFamily: fonts.poppinsSemiBold, fontSize: 15 },
  cardBody: {
    color: colors.textMuted,
    fontFamily: fonts.poppinsRegular,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  time: {
    color: colors.textDim,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    marginTop: 8,
  },
});
