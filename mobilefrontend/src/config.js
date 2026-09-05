/**
 * Runtime configuration.
 *
 * The phone runs the app, so `localhost` points at the phone — not at your laptop.
 * Put your machine's LAN IP here (the same address `expo start --host lan` prints)
 * and make sure uvicorn is started with `--host 0.0.0.0`.
 */

import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

/**
 * Automatically resolve the machine IP whether on Web, Android, or iOS:
 * 1. On Web: uses the browser's current hostname.
 * 2. On Mobile (Expo): extracts the Metro server host via expo-constants or NativeModules.
 * 3. Fallback: current active Wi-Fi LAN IP (10.228.79.187).
 */
const getDevServerHost = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }

  // Expo Constants hostUri (e.g. "10.228.79.187:8081")
  const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoGo?.debuggerHost || Constants?.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  // React Native scriptURL
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const address = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
    if (address && address !== 'localhost' && address !== '127.0.0.1') {
      return address;
    }
  }

  return '10.228.79.187';
};

export const API_HOST = getDevServerHost();
export const API_PORT = 8000;

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
export const WS_URL = `ws://${API_HOST}:${API_PORT}/api/ws`;

/** Rough city driving speed, used only for the "N min away" fallback label. */
export const AVG_SPEED_KMPH = 22;
