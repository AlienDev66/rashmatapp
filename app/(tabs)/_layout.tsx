import { TabBar } from "@/src/components/navigation/TabBar";
import { useT } from "@/src/i18n";
import { ASSESSMENT_HREF } from "@/src/lib/postAuthRoute";
import { useAuth } from "@/src/providers/AuthProvider";
import { colors } from "@/src/theme";
import { Redirect, Tabs } from "expo-router";

export default function TabsLayout() {
  const t = useT();
  const { session, profile, loading, configured } = useAuth();

  // Hard gate: incomplete onboarding cannot stay inside tabs.
  if (
    configured &&
    !loading &&
    session &&
    profile &&
    !profile.assessment_completed
  ) {
    return <Redirect href={ASSESSMENT_HREF} />;
  }

  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="creators" options={{ title: t("tabs.creators") }} />
      <Tabs.Screen name="programs" options={{ title: t("tabs.programs") }} />
      <Tabs.Screen name="more" options={{ title: t("tabs.profile") }} />
    </Tabs>
  );
}
