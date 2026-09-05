import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { ONGOING_BOOKING } from '../data/customerMockData';

const COMPLIMENT_TAGS = [
  'Punctual & Fast',
  'Polite Cooperative Behavior',
  'Fair Transparent Pricing',
  'Cleaned up Workspace',
  'Brought Proper Tools',
  'Excellent Knowledge',
];

const RatingFeedbackScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Punctual & Fast', 'Fair Transparent Pricing']);
  const worker = ONGOING_BOOKING.worker;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitReview = () => {
    Alert.alert(
       t('customer.ratingSubmitted'),
       t('customer.ratingSubmittedBody', { name: worker.name }),
      [
        {
           text: t('customer.backHome'),
          onPress: () => navigation.navigate('HomeTab'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
         <Text style={styles.headerTitle}>{t('customer.rating')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Worker Header Card */}
        <View style={styles.workerReviewCard}>
          <Image source={{ uri: worker.photo }} style={styles.workerAvatar} />
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerTrade}>{t(worker.tradeKey)}</Text>
          <Text style={styles.coopBranch}>{worker.coopBranch}</Text>

          <View style={styles.divider} />

           <Text style={styles.questionText}>{t('customer.ratingQuestion')}</Text>

          {/* 1–5 Star Rating */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((starVal) => {
              const isFilled = starVal <= rating;
              return (
                <TouchableOpacity
                  key={starVal}
                  onPress={() => setRating(starVal)}
                  style={styles.starTouch}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={isFilled ? 'star' : 'star-outline'}
                    size={38}
                    color={isFilled ? '#F59E0B' : COLORS.border}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.ratingDescriptor}>
             {rating === 5 && t('customer.outstanding')}
             {rating === 4 && t('customer.veryGood')}
             {rating === 3 && t('customer.average')}
             {rating === 2 && t('customer.needsImprovement')}
             {rating === 1 && t('customer.unsatisfactory')}
          </Text>
        </View>

        {/* Compliment Tags */}
        <View style={styles.sectionCard}>
           <Text style={styles.sectionTitle}>{t('customer.likeMost')}</Text>
          <View style={styles.tagsContainer}>
            {COMPLIMENT_TAGS.map((tag, idx) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.tagChip, isSelected && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={isSelected ? 'check' : 'plus'}
                    size={14}
                    color={isSelected ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Feedback Text Box */}
        <View style={styles.sectionCard}>
           <Text style={styles.sectionTitle}>{t('customer.writeFeedback')}</Text>
          <Text style={styles.sectionSub}>
             {t('customer.feedbackShared')}
          </Text>

          <TextInput
            style={styles.feedbackInput}
            multiline
            numberOfLines={4}
             placeholder={t('customer.feedbackPlaceholder')}
            placeholderTextColor={COLORS.textTertiary}
            value={feedback}
            onChangeText={setFeedback}
          />
        </View>

        {/* Submit Review Button */}
        <TouchableOpacity
          style={styles.submitReviewButton}
          onPress={handleSubmitReview}
          activeOpacity={0.85}
        >
           <Text style={styles.submitReviewText}>{t('customer.submitReview')}</Text>
          <MaterialCommunityIcons name="send" size={18} color={COLORS.white} />
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
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  workerReviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  workerAvatar: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  workerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  workerTrade: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 2,
  },
  coopBranch: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.lg,
  },
  questionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  starTouch: {
    padding: 2,
  },
  ratingDescriptor: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  tagChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  tagTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  feedbackInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitReviewButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    gap: 8,
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  submitReviewText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default RatingFeedbackScreen;
