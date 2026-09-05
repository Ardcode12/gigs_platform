import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const CustomerProfileScreen = () => {
  const navigation = useNavigation();
  const { customer, signOut } = useAuth();
  const [pushNotif, setPushNotif] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const displayName = customer?.name || 'Customer';
  const displayPhone = customer?.phone || 'No phone number';
  const displayEmail = customer?.email || 'No email provided';
  const displayCity = customer?.city || 'Noida';
  const memberId = customer?.id ? `WM-CUST-${String(customer.id).padStart(4, '0')}` : 'WM-CUST-0001';
  const savedAddresses = customer?.saved_addresses || [];

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of WORKMAT?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Profile & Settings</Text>
        <TouchableOpacity
          style={styles.notifIcon}
          onPress={() => navigation.navigate('Notifications')}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Customer Identity Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.customerName}>{displayName}</Text>
              <Text style={styles.memberIdBadge}>{memberId}</Text>
              <Text style={styles.memberSince}>City: {displayCity}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Contact Details: Mobile & Email */}
          <View style={styles.contactDetailsList}>
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="phone-outline" size={18} color={COLORS.primary} />
              <Text style={styles.contactText}>{displayPhone}</Text>
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedTagText}>VERIFIED</Text>
              </View>
            </View>

            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="email-outline" size={18} color={COLORS.primary} />
              <Text style={styles.contactText}>{displayEmail}</Text>
            </View>
          </View>
        </View>

        {/* 1. Saved Addresses */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconTitleWrap}>
              <MaterialCommunityIcons name="map-marker-multiple-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Saved Addresses</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Add Address', 'Address feature')}>
              <Text style={styles.addLink}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {savedAddresses.length === 0 ? (
            <Text style={styles.emptyAddressText}>No saved addresses yet.</Text>
          ) : (
            savedAddresses.map((addr, idx) => (
              <View key={addr.id || idx} style={styles.addressItem}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressTypeBadge}>
                    <Text style={styles.addressTypeText}>{addr.title || addr.type || 'Address'}</Text>
                  </View>
                </View>
                <Text style={styles.addressString}>{addr.address}</Text>
              </View>
            ))
          )}
        </View>

        {/* 2. Payment Methods */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconTitleWrap}>
              <MaterialCommunityIcons name="credit-card-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Payment Methods</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Payment')}>
              <Text style={styles.addLink}>Manage</Text>
            </TouchableOpacity>
          </View>

          {[
            { id: 'pm_1', type: 'UPI AutoPay / GPay', detail: 'Linked to Mobile / UPI', icon: 'cellphone-nfc', isDefault: true },
            { id: 'pm_2', type: 'Credit / Debit Card', detail: '•••• •••• •••• 4021', icon: 'credit-card', isDefault: false },
            { id: 'pm_3', type: 'Cash on Completion', detail: 'Direct payout to technician', icon: 'cash', isDefault: false },
          ].map((pm) => (
            <View key={pm.id} style={styles.paymentMethodRow}>
              <MaterialCommunityIcons name={pm.icon} size={20} color={COLORS.textSecondary} />
              <View style={styles.pmInfo}>
                <Text style={styles.pmType}>{pm.type}</Text>
                <Text style={styles.pmDetail}>{pm.detail}</Text>
              </View>
              {pm.isDefault && (
                <View style={styles.primaryPill}>
                  <Text style={styles.primaryPillText}>Primary</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 3. Language Selection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconTitleWrap}>
              <MaterialCommunityIcons name="translate" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Language Preference</Text>
            </View>
          </View>

          <View style={styles.languagePillsRow}>
            {['English', 'हिंदी (Hindi)', 'ಕನ್ನಡ (Kannada)', 'தமிழ் (Tamil)'].map((lang) => {
              const isSelected = selectedLanguage.includes(lang.split(' ')[0]);
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langPill, isSelected && styles.langPillActive]}
                  onPress={() => setSelectedLanguage(lang)}
                >
                  <Text style={[styles.langText, isSelected && styles.langTextActive]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Notifications Toggle */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.iconTitleWrap}>
              <MaterialCommunityIcons name="bell-ring-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
            <Switch
              value={pushNotif}
              onValueChange={setPushNotif}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={pushNotif ? COLORS.primary : COLORS.textTertiary}
            />
          </View>
          <Text style={styles.settingDesc}>
            Receive live alerts on worker arrival, price adjustments, and booking receipts.
          </Text>

          <TouchableOpacity
            style={styles.subSettingsLink}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.subSettingsLinkText}>View all recent notifications</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* 5. Help & Support */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => Alert.alert('Help & Support', 'Cooperative Helpline: 1800-425-WORKMAT')}
          >
            <View style={styles.iconTitleWrap}>
              <MaterialCommunityIcons name="lifebuoy" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Help & Cooperative Support</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => Alert.alert('Cooperative Charter', 'WORKMAT operates on standard cooperative laws ensuring 100% fair payout to verified technicians.')}
          >
            <View style={styles.iconTitleWrap}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Cooperative Charter & Safety Terms</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    marginRight: SPACING.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  emptyAddressText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  profileMeta: {
    flex: 1,
  },
  customerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  memberIdBadge: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginVertical: 3,
  },
  memberSince: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  contactDetailsList: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  contactText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
    flex: 1,
  },
  verifiedTag: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textSuccess,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  addLink: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  addressItem: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressTypeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  addressTypeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  defaultLabel: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.success,
  },
  addressString: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  pmInfo: {
    flex: 1,
  },
  pmType: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  pmDetail: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  primaryPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  primaryPillText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  languagePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  langPill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  langText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  langTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  settingDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  subSettingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  subSettingsLinkText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.2,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    gap: 6,
    marginVertical: SPACING.lg,
  },
  logoutText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
  },
});

export default CustomerProfileScreen;
