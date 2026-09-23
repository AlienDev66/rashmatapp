import { useEffect, useState } from "react";
import * as Network from "expo-network";

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
      } catch {
        if (mounted) setOnline(true);
      }
    };

    void check();
    const id = setInterval(check, 8000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return { online };
}
