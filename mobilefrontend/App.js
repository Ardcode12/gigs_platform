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
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import LoadingState from './src/components/LoadingState';
import { COLORS } from './src/theme';
import './src/utils/globalFonts';

/**
 * While the stored token is being read back, none of the navigator's three
 * groups matches — so hold the splash until we know which one should mount.
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

  return (
    <SocketProvider>
      <AppNavigator />
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
  },
  splash: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

