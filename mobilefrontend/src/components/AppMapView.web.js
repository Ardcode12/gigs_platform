import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

export const PROVIDER_DEFAULT = 'default';

export const Marker = ({ coordinate, title, description, children }) => {
  if (children) return <View>{children}</View>;
  return (
    <View style={styles.markerContainer}>
      <MaterialCommunityIcons name="map-marker" size={32} color={COLORS.error} />
      {title ? <Text style={styles.markerTitle}>{title}</Text> : null}
    </View>
  );
};

export const Polyline = () => null;

const AppMapView = ({ style, initialRegion, region, children, mapRef }) => {
  const targetLat = region?.latitude || initialRegion?.latitude || 13.0827;
  const targetLng = region?.longitude || initialRegion?.longitude || 80.2707;

  return (
    <View style={[styles.container, style]}>
      {/* Background map grid illustration */}
      <View style={styles.gridOverlay}>
        <View style={styles.pinWrapper}>
          <MaterialCommunityIcons name="map-marker-radius" size={48} color={COLORS.primary} />
          <Text style={styles.mapLabel}>Map Preview</Text>
          <Text style={styles.coordsLabel}>
            {targetLat.toFixed(4)}, {targetLng.toFixed(4)}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    marginTop: 4,
  },
  coordsLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: 'white',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default AppMapView;
