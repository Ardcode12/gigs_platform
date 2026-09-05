import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../../theme';
import Card from '../components/Card';
import ScreenHeader from '../../components/ScreenHeader';
import Avatar from '../../components/Avatar';
import RatingStars from '../../components/RatingStars';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import useApi from '../../hooks/useApi';
import { getRatings, getRatingSummary } from '../../api/ratings';
import { formatDate } from '../../utils/format';
import { useT } from '../../i18n/LanguageContext';

const STAR_ROWS = [5, 4, 3, 2, 1];

/** Spec #11 — the overall rating, how it breaks down, and what customers wrote. */
const RatingsScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const ratings = useApi(
    useCallback(
      () =>
        Promise.all([getRatingSummary(), getRatings({ limit: 50 })]).then(([summary, list]) => ({
          summary,
          list,
        })),
      [],
    ),
    [],
  );

  if (ratings.loading && !ratings.data) {
    return (
      <View style={styles.container}>
         <ScreenHeader title={t('worker.ratings')} onBack={() => navigation.goBack()} />
         <LoadingState message={t('worker.loadingRatings')} />
      </View>
    );
  }

  if (!ratings.data) {
    return (
      <View style={styles.container}>
         <ScreenHeader title={t('worker.ratings')} onBack={() => navigation.goBack()} />
        <EmptyState
          tone="error"
           title={t('worker.loadRatings')}
          message={ratings.error?.message}
           actionLabel={t('common.tryAgain')}
          onAction={ratings.reload}
        />
      </View>
    );
  }

  const { summary, list } = ratings.data;
  const total = summary.count || 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
         title={t('worker.ratings')}
         subtitle={total > 0 ? t(total === 1 ? 'worker.rating_one' : 'worker.rating_other', { count: total }) : t('worker.noRatings')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={ratings.refreshing}
            onRefresh={ratings.refetch}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Overall */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.overallBlock}>
              <Text style={styles.overallValue}>{(summary.overall ?? 0).toFixed(1)}</Text>
              <RatingStars rating={summary.overall} size={18} />
              <Text style={styles.overallCount}>
                 {t(total === 1 ? 'worker.review_one' : 'worker.review_other', { count: total })}
              </Text>
            </View>

            <View style={styles.bars}>
              {STAR_ROWS.map((star) => {
                const count = summary.distribution?.[String(star)] ?? 0;
                const pct = total === 0 ? 0 : (count / total) * 100;
                return (
                  <View key={star} style={styles.barRow}>
                    <Text style={styles.barStar}>{star}</Text>
                    <MaterialCommunityIcons name="star" size={12} color={COLORS.warning} />
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.barCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Feedback list */}
         <Text style={styles.sectionTitle}>{t('worker.whatCustomersSaid')}</Text>

        {list.length === 0 ? (
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="comment-text-outline"
              size={30}
              color={COLORS.textTertiary}
            />
             <Text style={styles.emptyTitle}>{t('worker.noFeedback')}</Text>
            <Text style={styles.emptyText}>
               {t('worker.feedbackBody')}
            </Text>
          </Card>
        ) : (
          list.map((item) => (
            <Card key={item.id} style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                <Avatar name={item.customer_name} size={40} />
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewName}>{item.customer_name}</Text>
                  <Text style={styles.reviewService}>
                    {item.service_type} · {formatDate(item.created_at)}
                  </Text>
                </View>
                <RatingStars rating={item.stars} size={14} />
              </View>

              {!!item.feedback && <Text style={styles.reviewText}>“{item.feedback}”</Text>}
            </Card>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.xl,
  },
  summaryCard: {
    marginBottom: SPACING.xl,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallBlock: {
    alignItems: 'center',
    paddingRight: SPACING.lg,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  overallValue: {
    fontSize: FONT_SIZE.hero,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
    lineHeight: 42,
  },
  overallCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  bars: {
    flex: 1,
    paddingLeft: SPACING.lg,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  barStar: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginRight: 2,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.warning,
  },
  barCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    minWidth: 16,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  reviewCard: {
    marginBottom: SPACING.md,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewMeta: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  reviewName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  reviewService: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reviewText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 21,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    fontStyle: 'italic',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
  },
});

export default RatingsScreen;
