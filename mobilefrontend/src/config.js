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
 * Set your machine's local Wi-Fi / Hotspot IP here if auto-detection falls back.
 * (e.g. '192.168.137.1' or your current LAN IP from `ipconfig`)
 */
export const MANUAL_DEV_IP = '10.169.114.187';

const getDevServerHost = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }

  // Expo Constants hostUri (e.g. "192.168.137.1:8081")
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

  return MANUAL_DEV_IP;
};

export const API_HOST = getDevServerHost();
export const API_PORT = 8000;

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
export const WS_URL = `ws://${API_HOST}:${API_PORT}/api/ws`;
export const WS_CUSTOMER_URL = `ws://${API_HOST}:${API_PORT}/api/ws/customer`;

/** Rough city driving speed, used only for the "N min away" fallback label. */
export const AVG_SPEED_KMPH = 22;
