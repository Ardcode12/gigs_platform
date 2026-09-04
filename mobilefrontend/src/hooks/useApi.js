/**
 * `useApi(fetcher)` — the data-loading pattern every screen uses.
 *
 * Refetches when the screen regains focus, which is the safety net behind the
 * WebSocket: if a live event was missed while the socket was down, coming back
 * to the screen still shows current data.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { normalizeError } from '../api/client';

export default function useApi(fetcher, deps = [], { refetchOnFocus = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Avoids setting state after unmount, and lets a stale response be discarded.
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async ({ quiet = false } = {}) => {
    const requestId = ++requestIdRef.current;
    if (quiet) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await fetcherRef.current();
      if (!mountedRef.current || requestId !== requestIdRef.current) return undefined;
      setData(result);
      setError(null);
      return result;
    } catch (caught) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return undefined;
      setError(normalizeError(caught));
      return undefined;
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    run();
  }, deps);

  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      // The initial mount already fetched; don't do it twice.
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      if (refetchOnFocus) run({ quiet: true });
    }, [run, refetchOnFocus]),
  );

  return {
    data,
    loading,
    refreshing,
    error,
    /** Silent refetch — for pull-to-refresh and live events. */
    refetch: () => run({ quiet: true }),
    /** Visible reload — for a retry button after an error. */
    reload: () => run(),
    setData,
  };
}
