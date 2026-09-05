import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';
import IconButton from '../../components/IconButton';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import useApi from '../../hooks/useApi';
import useLocation from '../../hooks/useLocation';
import { getJob } from '../../api/jobs';
import { formatDistance, formatEta } from '../../utils/format';
import { useT } from '../../i18n/LanguageContext';

/**
 * Spec #4 — where the job is, how far it is, and a hand-off to real turn-by-turn
 * navigation. We render the map and the numbers; Google/Apple Maps does the driving.
 */
const JobLocationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { jobId } = useRoute().params ?? {};
  const mapRef = useRef(null);
  const t = useT();

  useEffect(() => {
    // This screen is inside the stack inside the tab navigator.
    const tabNavigation = navigation.getParent()?.getParent();
    tabNavigation?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => tabNavigation?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  const job = useApi(useCallback(() => getJob(jobId), [jobId]), [jobId]);
  const { coords, request: requestLocation, loading: locating, error: locationError } = useLocation();

  // Ask on arrival: without a fix there is no distance, and no "you are here" pin.
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const detail = job.data;
  const target = detail?.location;

  // Once both pins are known, frame them together.
  useEffect(() => {
    if (!target || !coords || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      [
        { latitude: target.lat, longitude: target.lng },
        coords,
      ],
      { edgePadding: { top: 90, right: 70, bottom: 240, left: 70 }, animated: true },
    );
  }, [target, coords]);

  const openNavigation = () => {
    if (!target) return;
    const destination = `${target.lat},${target.lng}`;
    // The universal Google Maps URL opens the app when installed and the browser
    // when it isn't, on both platforms.
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    Linking.openURL(url).catch(() =>
      Alert.alert(t('worker.mapsError'), t('worker.mapUnavailable')),
    );
  };

  if (job.loading && !detail) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t('worker.jobLocation')} onBack={() => navigation.goBack()} />
        <LoadingState message={t('shared.locating')} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t('worker.jobLocation')} onBack={() => navigation.goBack()} />
        <EmptyState
          tone="error"
          title={t('worker.loadLocation')}
          message={job.error?.message}
          actionLabel={t('common.tryAgain')}
          onAction={job.reload}
        />
      </View>
    );
  }

  const distance = formatDistance(target.distance_km);
  const eta = formatEta(target.eta_min);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('worker.jobLocation')}
        subtitle={detail.service_type}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.mapWrap}>
        {Platform.OS === 'web' ? (
          // react-native-maps has no web renderer; the address and hand-off still work.
          <View style={styles.webFallback}>
            <MaterialCommunityIcons name="map-outline" size={40} color={COLORS.textTertiary} />
            <Text style={styles.webFallbackText}>
              {t('worker.webMapHint')}
            </Text>
          </View>
        ) : Platform.OS === 'android' ? (
          <View style={styles.androidMapFallback}>
            <MaterialCommunityIcons name="map-marker-radius" size={48} color={COLORS.primary} />
            <Text style={styles.androidMapTitle}>{t('worker.androidMapTitle')}</Text>
            <Text style={styles.androidMapAddress}>{target.address}</Text>
            <Text style={styles.androidMapHint}>
              {t('worker.androidMapHint')}
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: target.lat,
              longitude: target.lng,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            }}
            showsUserLocation={false}
          >
            <Marker
              coordinate={{ latitude: target.lat, longitude: target.lng }}
              title={detail.customer.name}
              description={target.address}
              pinColor={COLORS.danger}
            />

            {!!coords && (
              <>
                <Marker coordinate={coords} title={t('shared.you')} pinColor={COLORS.primary} />
                {/* A straight line, not a route — it shows direction, not the road. */}
                <Polyline
                  coordinates={[coords, { latitude: target.lat, longitude: target.lng }]}
                  strokeColor={COLORS.primary}
                  strokeWidth={3}
                  lineDashPattern={[6, 6]}
                />
              </>
            )}
          </MapView>
        )}

        {!coords && Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.locateBtn}
            onPress={requestLocation}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.primary} />
            <Text style={styles.locateText}>
               {locating ? t('shared.locating') : t('shared.showPosition')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.xxl) }]}>
        <View style={styles.addressRow}>
          <View style={styles.addressIcon}>
            <MaterialCommunityIcons name="map-marker" size={22} color={COLORS.danger} />
          </View>
          <View style={styles.addressBody}>
            <Text style={styles.customerName}>{detail.customer.name}</Text>
            <Text style={styles.address}>{target.address}</Text>
            {!!target.landmark && (
              <Text style={styles.landmark}>{t('worker.landmark', { landmark: target.landmark })}</Text>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{distance ?? '—'}</Text>
            <Text style={styles.statLabel}>{t('shared.distance')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{eta ?? '—'}</Text>
            <Text style={styles.statLabel}>{t('shared.approxTravel')}</Text>
          </View>
        </View>

        {!distance && (
          <Text style={styles.hint}>
            {locationError
              ? locationError.message
               : t('worker.shareLocationHint')}
          </Text>
        )}

        <IconButton
          label={t('shared.navigate')}
          icon="navigation-variant"
          onPress={openNavigation}
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapWrap: {
    flex: 1,
    backgroundColor: COLORS.borderLight,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  webFallbackText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  androidMapFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    backgroundColor: '#E8F0FE',
  },
  androidMapTitle: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  androidMapAddress: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  androidMapHint: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  locateBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.md,
  },
  locateText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    ...SHADOWS.lg,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBody: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  customerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  address: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 19,
  },
  landmark: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHT.medium,
  },
  hint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    marginTop: -SPACING.sm,
  },
});

export default JobLocationScreen;
