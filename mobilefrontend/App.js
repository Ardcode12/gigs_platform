import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Strictly Separated App Navigators
import CustomerAppNavigator from './src/customer/navigation/CustomerAppNavigator';
import WorkerAppNavigator from './src/worker/navigation/WorkerAppNavigator';

export default function App() {
  // 'customer' or 'worker'
  const [appMode, setAppMode] = useState('customer');

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={appMode === 'customer' ? 'dark-content' : 'light-content'}
        backgroundColor={appMode === 'customer' ? '#FFFFFF' : '#1B6EF5'}
      />

      <View style={styles.container}>
        {/* Render Customer or Worker app strictly independently */}
        {appMode === 'customer' ? <CustomerAppNavigator /> : <WorkerAppNavigator />}

        {/* Global Floating App Switcher to jump between Customer & Worker */}
        <View style={styles.floatingSwitcher}>
          <TouchableOpacity
            style={[styles.switchPill, appMode === 'customer' && styles.switchPillActive]}
            onPress={() => setAppMode('customer')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="account"
              size={14}
              color={appMode === 'customer' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.switchText, appMode === 'customer' && styles.switchTextActive]}>
              Customer App
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchPill, appMode === 'worker' && styles.switchPillActiveWorker]}
            onPress={() => setAppMode('worker')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="tools"
              size={14}
              color={appMode === 'worker' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.switchText, appMode === 'worker' && styles.switchTextActive]}>
              Worker App
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  floatingSwitcher: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 38,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 999,
    padding: 3,
    zIndex: 99999,
    elevation: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },
  switchPillActive: {
    backgroundColor: '#1B6EF5',
  },
  switchPillActiveWorker: {
    backgroundColor: '#059669',
  },
  switchText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
