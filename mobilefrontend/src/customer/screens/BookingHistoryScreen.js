import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { BOOKING_HISTORY_SAMPLE } from '../data/customerMockData';

const BookingHistoryScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const [activeTab, setActiveTab] = useState('completed'); // 'completed' | 'cancelled'
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const completedList = BOOKING_HISTORY_SAMPLE.completed;
  const cancelledList = BOOKING_HISTORY_SAMPLE.cancelled;

  const handleBookAgain = (booking) => {
    Alert.alert(
       t('booking.rebookTitle'), t('booking.rebookBody', { service: booking.serviceType }),
      [
        {
           text: t('common.proceed'),
          onPress: () => navigation.navigate('SearchService', { category: booking.serviceType }),
        },
         { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
         <Text style={styles.headerTitle}>{t('booking.title')}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'completed' && styles.tabButtonTextActive]}>
             {t('booking.tabCompleted', { count: completedList.length })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'cancelled' && styles.tabButtonActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'cancelled' && styles.tabButtonTextActive]}>
             {t('booking.tabCancelled', { count: cancelledList.length })}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'completed' ? (
          completedList.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.statusRow}>
                    <View style={styles.completedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={12} color={COLORS.success} />
                       <Text style={styles.completedBadgeText}>{t('booking.badgeCompleted')}</Text>
                    </View>
                    <Text style={styles.bookingIdText}>#{item.bookingId}</Text>
                  </View>
                  <Text style={styles.serviceTitle}>{item.serviceType}</Text>
                </View>

                <Text style={styles.priceTag}>₹{item.amount}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
                 <Text style={styles.metaText}>{t('booking.technician', { name: item.workerName })}</Text>
              </View>

              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{item.date}</Text>
              </View>

              {/* Items Breakdown List */}
              <View style={styles.itemsBox}>
                {item.items.map((subItem, idx) => (
                  <View key={idx} style={styles.subItemRow}>
                    <Text style={styles.subItemBullet}>•</Text>
                    <Text style={styles.subItemText}>{subItem}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Action Buttons: View Invoice & Book Again */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.invoiceBtn}
                  onPress={() => setSelectedInvoice(item)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="receipt" size={16} color={COLORS.primary} />
                   <Text style={styles.invoiceBtnText}>{t('booking.viewInvoice')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bookAgainBtn}
                  onPress={() => handleBookAgain(item)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="repeat" size={16} color={COLORS.white} />
                   <Text style={styles.bookAgainBtnText}>{t('booking.bookAgain')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          cancelledList.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.statusRow}>
                    <View style={styles.cancelledBadge}>
                      <MaterialCommunityIcons name="close-circle" size={12} color={COLORS.danger} />
                       <Text style={styles.cancelledBadgeText}>{t('booking.badgeCancelled')}</Text>
                    </View>
                    <Text style={styles.bookingIdText}>#{item.bookingId}</Text>
                  </View>
                  <Text style={styles.serviceTitle}>{item.serviceType}</Text>
                </View>

                <Text style={[styles.priceTag, { color: COLORS.textTertiary }]}>₹{item.amount}</Text>
              </View>

              <View style={styles.divider} />

               <Text style={styles.cancelReasonText}>{t('common.reason', { reason: item.reason })}</Text>
              <View style={styles.refundPill}>
                <MaterialCommunityIcons name="cash-refund" size={14} color={COLORS.success} />
                <Text style={styles.refundText}>{item.refundStatus}</Text>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.rebookCancelledBtn}
                onPress={() => handleBookAgain(item)}
              >
                 <Text style={styles.rebookCancelledText}>{t('booking.bookThisNow')}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <Modal visible={!!selectedInvoice} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                 <Text style={styles.modalHeaderTitle}>{t('invoice.heading')}</Text>
                <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

               <Text style={styles.invoiceNumberText}>{t('invoice.number', { number: selectedInvoice.invoiceNumber })}</Text>
              <Text style={styles.invoiceDateText}>{selectedInvoice.date}</Text>

              <View style={styles.divider} />

               <Text style={styles.invoiceSectionTitle}>{t('invoice.serviceProvided')}</Text>
              <Text style={styles.invoiceServiceType}>{selectedInvoice.serviceType}</Text>
               <Text style={styles.invoiceWorker}>{t('booking.technician', { name: selectedInvoice.workerName })}</Text>

              <View style={styles.divider} />

               <Text style={styles.invoiceSectionTitle}>{t('invoice.tasksCompleted')}</Text>
              {selectedInvoice.items.map((it, i) => (
                <View key={i} style={styles.invoiceItemRow}>
                  <MaterialCommunityIcons name="check" size={14} color={COLORS.success} />
                  <Text style={styles.invoiceItemText}>{it}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.invoiceTotalRow}>
                 <Text style={styles.invoiceTotalLabel}>{t('invoice.paidInFull')}</Text>
                <Text style={styles.invoiceTotalVal}>₹{selectedInvoice.amount}</Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedInvoice(null)}
              >
                 <Text style={styles.modalCloseBtnText}>{t('invoice.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textSuccess,
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  cancelledBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.danger,
  },
  bookingIdText: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  serviceTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  priceTag: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  itemsBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    gap: 2,
  },
  subItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subItemBullet: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: FONT_WEIGHT.bold,
  },
  subItemText: {
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  invoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 8,
    gap: 4,
  },
  invoiceBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  bookAgainBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 8,
    gap: 4,
    ...SHADOWS.sm,
  },
  bookAgainBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  cancelReasonText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  refundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  refundText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
  },
  rebookCancelledBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  rebookCancelledText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  invoiceNumberText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  invoiceDateText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },
  invoiceSectionTitle: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  invoiceServiceType: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  invoiceWorker: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  invoiceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  invoiceItemText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceTotalLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  invoiceTotalVal: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  modalCloseBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default BookingHistoryScreen;
