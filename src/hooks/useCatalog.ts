import { fetchCatalog, type CatalogSnapshot } from "@/src/data/catalog";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";
import { useCallback, useEffect, useState } from "react";

type State = {
  data: CatalogSnapshot | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refreshing: boolean;
};

export function useCatalog() {
  const { online } = useNetworkStatus();
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
    fromCache: false,
    refreshing: false,
  });

  const load = useCallback(async (isRefresh = false) => {
    setState((s) => ({
      ...s,
      loading: !isRefresh && !s.data,
      refreshing: isRefresh,
      error: null,
    }));
    try {
      const data = await fetchCatalog();
      setState({
        data,
        loading: false,
        error: null,
        fromCache: !online,
        refreshing: false,
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        refreshing: false,
        error: e instanceof Error ? e.message : "Failed to load catalog",
      }));
    }
  }, [online]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...state,
    online,
    creators: state.data?.creators ?? [],
    programs: state.data?.programs ?? [],
    sessions: state.data?.sessions ?? [],
    refresh: () => load(true),
  };
}
