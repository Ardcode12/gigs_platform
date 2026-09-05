/**
 * Device location, and pushing it to the server.
 *
 * The server needs a position to compute distance and ETA for every job, so the
 * fix is reported once per session (and on demand) rather than streamed.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { updateLocation } from '../api/worker';

export default function useLocation({ reportToServer = true } = {}) {
  const [coords, setCoords] = useState(null);
  const [permission, setPermission] = useState('undetermined');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const request = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mountedRef.current) return null;
      setPermission(status);

      if (status !== 'granted') {
        setError(new Error('Location permission is needed to show how far away a job is.'));
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!mountedRef.current) return null;

      const next = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(next);

      if (reportToServer) {
        // A failed report only costs distance/ETA accuracy, so it stays quiet.
        updateLocation(next.latitude, next.longitude).catch(() => {});
      }
      return next;
    } catch (caught) {
      if (mountedRef.current) setError(caught);
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [reportToServer]);

  return { coords, permission, loading, error, request };
}
