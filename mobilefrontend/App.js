import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import LoadingState from './src/components/LoadingState';
import { COLORS } from './src/theme';
import { LanguageProvider, useLanguageState } from './src/i18n/LanguageContext';
import LanguageSelectScreen from './src/i18n/LanguageSelectScreen';
import './src/utils/globalFonts';

/**
 * While the stored session is being read back, none of the navigator's groups
 * matches — so hold the splash until we know which one should mount.
 */
const Gate = () => {
  const { restoring } = useAuth();
  const { restoring: languageRestoring, needsChoice } = useLanguageState();

  if (restoring || languageRestoring) {
    return (
      <View style={styles.splash}>
        <LoadingState message="" />
      </View>
    );
  }

  if (needsChoice) return <LanguageSelectScreen />;

  // The socket only opens for a signed-in worker, so wrapping both roles is safe.
  return (
    <SocketProvider>
      <RootNavigator />
    </SocketProvider>
  );
};

export default function App() {
  const [fontsLoaded] = Font.useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <LoadingState message="" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <LanguageProvider>
          <AuthProvider>
            <Gate />
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
