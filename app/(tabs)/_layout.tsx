import { TabBar } from "@/src/components/navigation/TabBar";
import { useT } from "@/src/i18n";
import { colors } from "@/src/theme";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="creators" options={{ title: t("tabs.creators") }} />
      <Tabs.Screen name="programs" options={{ title: t("tabs.programs") }} />
      <Tabs.Screen name="more" options={{ title: t("tabs.profile") }} />
    </Tabs>
  );
}
