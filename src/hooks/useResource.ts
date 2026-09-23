import { fetchCreator, fetchProgram, fetchSession } from "@/src/data/catalog";
import { useCallback, useEffect, useState } from "react";

export function useResource<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await loader();
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useProgram(id: string | undefined) {
  return useResource(() => fetchProgram(id ?? ""), [id]);
}

export function useCreator(id: string | undefined) {
  return useResource(() => fetchCreator(id ?? ""), [id]);
}

export function useWorkoutSession(id: string | undefined) {
  return useResource(() => {
    if (!id) return Promise.resolve(null);
    return fetchSession(id);
  }, [id]);
}
