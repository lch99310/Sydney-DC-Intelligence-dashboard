import { useEffect, useState } from "react";

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useJsonData<T>(path: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: T) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
