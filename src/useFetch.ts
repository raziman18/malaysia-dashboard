import { useEffect, useState } from "react";

export interface FetchState<T> {
  data?: T;
  error?: string;
  // When the data last loaded successfully.
  checkedAt?: Date;
}

const tenMinutes = 10 * 60_000;

// Loads data and reloads it on an interval. Pass null to skip loading. A failed reload keeps the last good data.
export function useFetch<T>(load: (() => Promise<T>) | null, refreshMs = tenMinutes): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({});

  useEffect(() => {
    if (!load) return;
    let active = true;
    setState({});
    const run = () =>
      load().then(
        (data) => active && setState({ data, checkedAt: new Date() }),
        (error: Error) => active && setState((previous) => ({ ...previous, error: error.message })),
      );
    run();
    const timer = setInterval(run, refreshMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [load, refreshMs]);

  return state;
}
