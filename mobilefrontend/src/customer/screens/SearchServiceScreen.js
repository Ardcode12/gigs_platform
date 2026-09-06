import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { getServiceCategories, searchServices } from '../../api/jobs';

/**
 * Service search screen — ALL data comes from the live backend.
 * No hardcoded worker counts, no mock arrays.
 */
const SearchServiceScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const initialCategory = useRoute().params?.category || '';

  const [searchQuery, setSearchQuery] = useState(initialCategory);
  const [categories, setCategories] = useState([]);
  const [searchResults, setSearchResults] = useState(null); // null = not yet searched
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load all categories on mount
  const loadCategories = useCallback(async () => {
    try {
      setError(null);
      const data = await getServiceCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchServices({ q: searchQuery.trim() });
        setSearchResults(res);
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryPress = (cat) => {
    navigation.navigate('WorkerRecommendations', { category: cat.name, service_type: cat.key });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  // What to show in the category list
  const displayCategories = searchResults ? searchResults.categories : categories;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Service</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchBarInput}
          placeholder="Search plumber, electrician, AC repair…"
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={!!initialCategory}
        />
        {searching ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults(null); }}>
            <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* AI Helper Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={() => navigation.navigate('AIRequirement', { userInput: searchQuery })}
          activeOpacity={0.9}
        >
          <View style={styles.aiIconBubble}>
            <MaterialCommunityIcons name="robot" size={22} color={COLORS.white} />
          </View>
          <View style={styles.aiBannerTextWrap}>
            <Text style={styles.aiBannerTitle}>Describe requirement to AI</Text>
            <Text style={styles.aiBannerDesc}>
              {searchQuery ? `Break down "${searchQuery}" with AI` : 'Get instant itemized cost estimate & worker matching'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Error state */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadCategories} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading services…</Text>
          </View>
        )}

        {/* Search results — matching workers */}
        {searchResults && searchResults.workers.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>
              Matching Workers ({searchResults.workers.length})
            </Text>
            {searchResults.workers.map((w) => (
              <View key={String(w.id)} style={styles.workerCard}>
                <View style={styles.workerAvatarBox}>
                  <MaterialCommunityIcons name="account-hard-hat" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{w.name}</Text>
                  <Text style={styles.workerSkills} numberOfLines={1}>
                    {(w.skills || []).slice(0, 3).join(' • ')}
                  </Text>
                  <View style={styles.workerMeta}>
                    {w.rating_avg > 0 && (
                      <View style={styles.ratingPill}>
                        <MaterialCommunityIcons name="star" size={11} color="#EAB308" />
                        <Text style={styles.ratingText}>{w.rating_avg.toFixed(1)}</Text>
                      </View>
                    )}
                    {w.distance_km != null && (
                      <Text style={styles.distanceText}>{w.distance_km.toFixed(1)} km</Text>
                    )}
                    <View style={[styles.availDot, { backgroundColor: w.is_available ? COLORS.success : COLORS.textMuted }]} />
                    <Text style={styles.availText}>{w.is_available ? 'Available' : 'Busy'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Categories */}
        {!loading && !error && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>
              {searchResults ? `Categories (${displayCategories.length})` : 'All Services'}
            </Text>

            {displayCategories.length === 0 && (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="magnify-close" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No services found</Text>
                <Text style={styles.emptyText}>
                  Try a different keyword — e.g. "plumber", "AC repair" or "painting"
                </Text>
              </View>
            )}

            {displayCategories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(cat)}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: cat.bg }]}>
                  <MaterialCommunityIcons name={cat.icon} size={28} color={cat.color} />
                </View>

                <View style={styles.categoryItemDetails}>
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryTitleText}>{cat.name}</Text>
                    {/* Real count from database — NEVER hardcoded */}
                    <View style={[styles.workerCountPill, cat.available_workers > 0 && styles.workerCountPillActive]}>
                      <MaterialCommunityIcons
                        name={cat.available_workers > 0 ? 'check-circle' : 'clock-outline'}
                        size={10}
                        color={cat.available_workers > 0 ? COLORS.success : COLORS.textMuted}
                      />
                      <Text style={[styles.workerCountText, cat.available_workers > 0 && styles.workerCountTextActive]}>
                        {cat.available_workers > 0
                          ? `${cat.available_workers} available`
                          : cat.total_workers > 0
                            ? `${cat.total_workers} workers`
                            : 'No workers yet'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.categoryDescription} numberOfLines={1}>
                    {cat.description}
                  </Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    height: 52,
    gap: SPACING.sm,
  },
  searchBarInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  sectionBlock: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.danger,
  },
  retryBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.sm,
  },
  retryText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 20,
  },
  // Worker search results
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  workerAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  workerInfo: { flex: 1 },
  workerName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  workerSkills: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  workerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
  },
  distanceText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  // Category list
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryItemDetails: { flex: 1 },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  categoryTitleText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  workerCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 3,
  },
  workerCountPillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  workerCountText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  workerCountTextActive: {
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.bold,
  },
  categoryDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  aiIconBubble: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTextWrap: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark || COLORS.primary,
  },
  aiBannerDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
});

export default SearchServiceScreen;
