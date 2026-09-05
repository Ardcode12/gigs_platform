import React from 'react';
import { StatusBar, StyleSheet, View, Platform } from 'react-native';
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
import './src/utils/globalFonts';

/**
 * While the stored session is being read back, none of the navigator's groups
 * matches — so hold the splash until we know which one should mount.
 */
const Gate = () => {
  const { restoring } = useAuth();

  if (restoring) {
    return (
      <View style={styles.splash}>
        <LoadingState message="" />
      </View>
    );
  }

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

  // On web, CSS @import in globalFonts loads Poppins; don't stay stuck on blank screen
  if (!fontsLoaded && Platform.OS !== 'web') {
    return (
      <View style={styles.splash}>
        <LoadingState message="Loading..." />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider style={styles.flex}>
        <StatusBar barStyle="light-content" />
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  splash: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
