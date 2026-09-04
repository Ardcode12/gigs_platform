import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { NEW_JOB_REQUEST } from '../data/mockData';

const NewJobRequestScreen = ({ navigation }) => {
  const job = NEW_JOB_REQUEST;

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(
          <MaterialCommunityIcons key={i} name="star" size={16} color="#FBBF24" />
        );
      } else if (i === full && half) {
        stars.push(
          <MaterialCommunityIcons key={i} name="star-half-full" size={16} color="#FBBF24" />
        );
      } else {
        stars.push(
          <MaterialCommunityIcons key={i} name="star-outline" size={16} color="#D1D5DB" />
        );
      }
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Job Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Type Badge */}
        <View style={styles.serviceTypeRow}>
          <View style={styles.serviceIconWrap}>
            <MaterialCommunityIcons name={job.serviceIcon} size={28} color={COLORS.primary} />
          </View>
          <View style={{ marginLeft: SPACING.md }}>
            <Text style={styles.serviceType}>{job.serviceType}</Text>
            <Text style={styles.requestTime}>Requested {job.requestedAt}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="account" size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionLabelText}>Customer</Text>
          </View>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {job.customer.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.customerName}>{job.customer.name}</Text>
              <View style={styles.ratingRow}>
                {renderStars(job.customer.rating)}
                <Text style={styles.ratingText}>{job.customer.rating}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Location */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionLabelText}>Service Location</Text>
          </View>
          <Text style={styles.locationAddress}>{job.location.address}</Text>
          <Text style={styles.locationLandmark}>{job.location.landmark}</Text>

          {/* Map Preview Placeholder */}
          <View style={styles.mapPreview}>
            <View style={styles.mapPlaceholder}>
              <MaterialCommunityIcons name="map" size={40} color={COLORS.primary} />
              <Text style={styles.mapText}>Map Preview</Text>
            </View>
          </View>

          <View style={styles.distanceRow}>
            <View style={styles.distanceItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={20} color={COLORS.primary} />
              <Text style={styles.distanceValue}>{job.location.distance}</Text>
              <Text style={styles.distanceLabel}>Distance</Text>
            </View>
            <View style={styles.distanceDivider} />
            <View style={styles.distanceItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
              <Text style={styles.distanceValue}>{job.location.estimatedTime}</Text>
              <Text style={styles.distanceLabel}>Est. Time</Text>
            </View>
          </View>
        </Card>

        {/* Required Services */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="wrench" size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionLabelText}>Required Services</Text>
          </View>
          {job.services.map((service, index) => (
            <View key={index} style={styles.serviceRow}>
              <View style={styles.serviceDot} />
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>₹{service.price}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Base Estimated Amount</Text>
            <Text style={styles.totalValue}>₹{job.baseAmount}</Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <Card style={styles.card}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Chat')}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <MaterialCommunityIcons name="chat-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <View style={[styles.actionIconWrap, { backgroundColor: COLORS.successLight }]}>
                <MaterialCommunityIcons name="phone-outline" size={22} color={COLORS.success} />
              </View>
              <Text style={styles.actionLabel}>Request{'\n'}Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('RequestExtraAmount')}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: COLORS.warningLight }]}>
                <MaterialCommunityIcons name="cash-plus" size={22} color="#B45309" />
              </View>
              <Text style={styles.actionLabel}>Extra{'\n'}Amount</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.rejectBtn]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={22} color={COLORS.danger} />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.acceptBtn]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="check" size={22} color={COLORS.white} />
          <Text style={styles.acceptText}>Accept Job</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.xl,
  },
  serviceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  serviceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceType: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  requestTime: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionLabelText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  customerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: 6,
  },
  locationAddress: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  locationLandmark: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  mapPreview: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  mapText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.sm,
  },
  distanceRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  distanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  distanceDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  distanceValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  distanceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  serviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  serviceName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  servicePrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  totalLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: SPACING.xl,
    paddingBottom: 34,
    backgroundColor: COLORS.white,
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    minHeight: 56,
  },
  rejectBtn: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  acceptBtn: {
    backgroundColor: COLORS.success,
    flex: 1.5,
  },
  rejectText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
    marginLeft: SPACING.sm,
  },
  acceptText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
});

export default NewJobRequestScreen;
