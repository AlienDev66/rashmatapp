import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "@/src/theme";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { EmptyState, type EmptyTone } from "@/src/components/ui/EmptyState";
import type { ReactNode } from "react";

type Props = {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyTone?: EmptyTone;
  emptyActionLabel?: string;
  emptyOnAction?: () => void;
  emptySecondaryLabel?: string;
  emptyOnSecondary?: () => void;
  onRetry?: () => void;
  offline?: boolean;
  children: ReactNode;
};

export function QueryGate({
  loading,
  error,
  empty,
  emptyTitle = "Nothing here yet",
  emptyMessage,
  emptyTone = "default",
  emptyActionLabel,
  emptyOnAction,
  emptySecondaryLabel,
  emptyOnSecondary,
  onRetry,
  offline,
  children,
}: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <ErrorState
        offline={offline}
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (empty) {
    return (
      <EmptyState
        tone={emptyTone}
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={emptyOnAction}
        secondaryLabel={emptySecondaryLabel}
        onSecondary={emptyOnSecondary}
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
});
