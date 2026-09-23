import { Redirect } from "expo-router";

/**
 * Profile lives on the More tab. Keep this route as a redirect so old links
 * don't stack a duplicate profile screen.
 */
export default function ProfileRedirect() {
  return <Redirect href="/(tabs)/more" />;
}
