import React, { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { listJobs } from '../../api/jobs';

const BookingHistoryScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('completed'); // 'completed' | 'cancelled'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [completedList, setCompletedList] = useState([]);
  const [cancelledList, setCancelledList] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const [completed, cancelledJobs] = await Promise.all([
            listJobs({ status: 'completed' }),
            listJobs({ status: 'cancelled' }),
          ]);
          if (!cancelled) {
            setCompletedList(completed || []);
            setCancelledList(cancelledJobs || []);
          }
        } catch {
          // Network error — keep existing state
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, []),
  );

  /** Format ISO date to readable string */
  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleBookAgain = (booking) => {
    Alert.alert(
      'Book Service Again',
      `Re-book ${booking.service_type} with cooperative technician?`,
      [
        {
          text: 'Proceed',
          onPress: () => navigation.navigate('SearchService', { category: booking.service_type }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Bookings & Invoices</Text>
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
            Completed ({completedList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'cancelled' && styles.tabButtonActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'cancelled' && styles.tabButtonTextActive]}>
            Cancelled ({cancelledList.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ color: COLORS.textSecondary, marginTop: SPACING.md }}>Loading bookings…</Text>
          </View>
        ) : activeTab === 'completed' ? (
          completedList.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={48} color={COLORS.textTertiary} />
              <Text style={{ color: COLORS.textSecondary, marginTop: SPACING.md }}>No completed bookings yet</Text>
            </View>
          ) : (
          completedList.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.statusRow}>
                    <View style={styles.completedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={12} color={COLORS.success} />
                      <Text style={styles.completedBadgeText}>COMPLETED</Text>
                    </View>
                    <Text style={styles.bookingIdText}>#WM-{item.id}</Text>
                  </View>
                  <Text style={styles.serviceTitle}>{item.service_type}</Text>
                </View>

                <Text style={styles.priceTag}>₹{item.total_amount}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>Technician: {item.worker?.name || 'Cooperative Worker'}</Text>
              </View>

              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{fmtDate(item.completed_at || item.requested_at)}</Text>
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
                  <Text style={styles.invoiceBtnText}>View Invoice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bookAgainBtn}
                  onPress={() => handleBookAgain(item)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="repeat" size={16} color={COLORS.white} />
                  <Text style={styles.bookAgainBtnText}>Book Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
          )
        ) : (
          cancelledList.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <MaterialCommunityIcons name="cancel" size={48} color={COLORS.textTertiary} />
              <Text style={{ color: COLORS.textSecondary, marginTop: SPACING.md }}>No cancelled bookings</Text>
            </View>
          ) : (
          cancelledList.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.statusRow}>
                    <View style={styles.cancelledBadge}>
                      <MaterialCommunityIcons name="close-circle" size={12} color={COLORS.danger} />
                      <Text style={styles.cancelledBadgeText}>CANCELLED</Text>
                    </View>
                    <Text style={styles.bookingIdText}>#WM-{item.id}</Text>
                  </View>
                  <Text style={styles.serviceTitle}>{item.service_type}</Text>
                </View>

                <Text style={[styles.priceTag, { color: COLORS.textTertiary }]}>₹{item.total_amount}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{fmtDate(item.requested_at)}</Text>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.rebookCancelledBtn}
                onPress={() => handleBookAgain(item)}
              >
                <Text style={styles.rebookCancelledText}>Book this service now</Text>
              </TouchableOpacity>
            </View>
          ))
          )
        )}
      </ScrollView>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <Modal visible={!!selectedInvoice} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>COOPERATIVE INVOICE</Text>
                <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.invoiceNumberText}>Invoice: WM-{selectedInvoice.id}</Text>
              <Text style={styles.invoiceDateText}>{fmtDate(selectedInvoice.completed_at || selectedInvoice.requested_at)}</Text>

              <View style={styles.divider} />

              <Text style={styles.invoiceSectionTitle}>Service Provided</Text>
              <Text style={styles.invoiceServiceType}>{selectedInvoice.service_type}</Text>
              <Text style={styles.invoiceWorker}>Technician: {selectedInvoice.worker?.name || 'Cooperative Worker'}</Text>

              <View style={styles.divider} />

              <View style={styles.invoiceTotalRow}>
                <Text style={styles.invoiceTotalLabel}>Paid in Full</Text>
                <Text style={styles.invoiceTotalVal}>₹{selectedInvoice.total_amount}</Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedInvoice(null)}
              >
                <Text style={styles.modalCloseBtnText}>Close Invoice</Text>
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
