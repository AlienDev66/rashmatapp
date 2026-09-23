import {
  CreatorsIcon,
  HomeIcon,
  MoreIcon,
  ProgramsIcon,
} from "@/src/components/icons";
import { colors } from "@/src/theme";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS = {
  index: HomeIcon,
  creators: CreatorsIcon,
  programs: ProgramsIcon,
  more: MoreIcon,
} as const;

/** Custom RASHMAT tab bar — accepts Expo Router tabBar props */
export function TabBar(props: any) {
  const { state, descriptors, navigation } = props;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route: { key: string; name: string; params?: object }, index: number) => {
        const focused = state.index === index;
        const Icon = ICONS[route.name as keyof typeof ICONS] ?? HomeIcon;
        const { options } = descriptors[route.key];
        const color = focused ? colors.accent : "#C4C4C4";

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={styles.item}
          >
            <Icon color={color} size={24} />
            {focused ? <View style={styles.indicator} /> : <View style={styles.spacer} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  indicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  spacer: { height: 3 },
});
