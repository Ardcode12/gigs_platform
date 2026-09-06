import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiHost = () => {
  // Web
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname;
  }

  // Expo Go
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants?.manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];

    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  // Fallback - CHANGE THIS to your laptop IPv4
  return '10.71.25.35';
};

export const API_HOST = getApiHost();
export const API_PORT = 8002;

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
export const WS_URL = `ws://${API_HOST}:${API_PORT}/api/ws`;

export const AVG_SPEED_KMPH = 22;