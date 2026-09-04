import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import { NEW_JOB_REQUEST } from '../data/workerMockData';

const NewJobRequestScreen = ({ navigation }) => {
  const job = NEW_JOB_REQUEST;

  const handleAccept = () => {
    Alert.alert(
      'Job Accepted! 🎉',
      `You have accepted the ${job.serviceType} job for ${job.customer.name}. Please head to the location.`,
      [
        {
          text: 'Go to Current Job',
          onPress: () => navigation.navigate('CurrentJob'),
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Job?',
      'Are you sure you want to pass on this request? It will be offered to another cooperative worker.',
      [
        { text: 'Keep Job', style: 'cancel' },
        { text: 'Yes, Reject', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Standardized Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Job Request</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Header Badge */}
        <View style={styles.serviceHeaderBanner}>
          <View style={styles.serviceIconWrap}>
            <MaterialCommunityIcons name={job.serviceIcon} size={28} color={COLORS.primary} />
          </View>
          <View style={styles.serviceHeaderInfo}>
            <Text style={styles.serviceType}>{job.serviceType}</Text>
            <Text style={styles.requestTime}>Requested {job.requestedAt}</Text>
          </View>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        </View>

        {/* Customer Information Card */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionLabel}>Customer Details</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {job.customer.name.split(' ').map((n) => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.customerMeta}>
              <Text style={styles.customerName}>{job.customer.name}</Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingText}>{job.customer.rating} (Verified Customer)</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Location & Map Card */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionLabel}>Service Location</Text>
          <Text style={styles.locationAddress}>{job.location.address}</Text>
          <Text style={styles.locationLandmark}>{job.location.landmark}</Text>

          {/* Clean Map Preview Section */}
          <View style={styles.mapPreview}>
            <MaterialCommunityIcons name="map-marker-radius" size={32} color={COLORS.primary} />
            <Text style={styles.mapPreviewText}>Destination Map View</Text>
          </View>

          <View style={styles.distanceMetricsRow}>
            <View style={styles.distanceMetricItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={20} color={COLORS.primary} />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.metricVal}>{job.location.distance}</Text>
                <Text style={styles.metricLbl}>Distance</Text>
              </View>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.distanceMetricItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.metricVal}>{job.location.estimatedTime}</Text>
                <Text style={styles.metricLbl}>Est. Travel</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Required Services Breakdown Card */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionLabel}>Required Services</Text>
          {job.services.map((service, index) => (
            <View key={index} style={styles.serviceItemRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>₹{service.price}</Text>
            </View>
          ))}

          <View style={styles.cardDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Base Amount</Text>
              <Text style={styles.totalSub}>Standard labor estimate</Text>
            </View>
            <Text style={styles.totalValue}>₹{job.baseAmount}</Text>
          </View>
        </Card>

        {/* Communication & Adjustments Action Card */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionLabel}>Quick In-App Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Chat')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.primary} />
              <Text style={styles.quickActionLabel}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => Alert.alert('Request Call', 'Call request sent to customer via masked phone service.')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="phone-shield" size={20} color={COLORS.success} />
              <Text style={styles.quickActionLabel}>Request Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('RequestExtraAmount')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cash-plus" size={20} color="#B45309" />
              <Text style={styles.quickActionLabel}>Extra Amount</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Standardized Bottom Actions: Same Green for Accept, Same Red for Reject */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={handleReject}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close-circle-outline" size={22} color={COLORS.danger} />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={handleAccept}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="check-bold" size={22} color={COLORS.white} />
          <Text style={styles.acceptBtnText}>Accept Job</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.md,
  },
  serviceHeaderBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceHeaderInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  serviceType: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  newBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: FONT_WEIGHT.extrabold,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  customerMeta: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  customerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  locationAddress: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  locationLandmark: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  mapPreview: {
    height: 110,
    borderRadius: RADIUS.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  mapPreviewText: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    marginTop: 4,
  },
  distanceMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  distanceMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  metricLbl: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  serviceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  serviceName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
  },
  servicePrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  totalSub: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  totalValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickActionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  rejectBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
  },
  acceptBtn: {
    flex: 1.8,
    minHeight: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...SHADOWS.md,
  },
  acceptBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default NewJobRequestScreen;
