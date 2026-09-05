import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { SERVICE_CATEGORIES } from '../data/customerMockData';

const SUGGESTED_NATURAL_PROMPTS = [
  'I need fan repair, two lights replaced and some wiring.',
  'Kitchen tap leaking and bathroom drain clogged.',
  'Fix wardrobe wooden hinges and install lock.',
  'Full 2BHK deep cleaning before housewarming.',
  'Repaint living room wall and repair ceiling dampness.',
  'Lawn mowing, flower bed pruning and plant repotting.',
];

const SearchServiceScreen = () => {
  const navigation = useNavigation();
  const initialCategory = useRoute().params?.category || '';
  const [searchQuery, setSearchQuery] = useState(initialCategory);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [naturalText, setNaturalText] = useState(
    'I need fan repair, two lights replaced and some wiring.'
  );

  const filteredCategories = SERVICE_CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyPrompt = (prompt) => {
    setNaturalText(prompt);
  };

  const handleProceedToAi = () => {
    navigation.navigate('AIRequirement', { userInput: naturalText });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search & Describe Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Natural Language AI Requirement Box */}
        <View style={styles.naturalCard}>
          <View style={styles.naturalHeaderRow}>
            <View style={styles.aiBadge}>
              <MaterialCommunityIcons name="auto-fix" size={16} color={COLORS.white} />
              <Text style={styles.aiBadgeText}>AI NATURAL REQUIREMENT</Text>
            </View>
            <Text style={styles.naturalHelper}>Instant breakdown</Text>
          </View>

          <Text style={styles.naturalLabel}>
            Describe what you need in plain English, Hindi, or your language:
          </Text>

          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={4}
              placeholder="e.g. My ceiling fan stopped spinning and I want two new LED bulbs fitted in the hall..."
              placeholderTextColor={COLORS.textTertiary}
              value={naturalText}
              onChangeText={setNaturalText}
            />
            {naturalText.length > 0 && (
              <TouchableOpacity
                onPress={() => setNaturalText('')}
                style={styles.clearIcon}
              >
                <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Suggested Prompts */}
          <Text style={styles.suggestionsHeader}>💡 Or tap a common requirement:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
            {SUGGESTED_NATURAL_PROMPTS.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.promptChip,
                  naturalText === prompt && styles.promptChipActive,
                ]}
                onPress={() => handleApplyPrompt(prompt)}
              >
                <Text
                  style={[
                    styles.promptChipText,
                    naturalText === prompt && styles.promptChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* AI Analyse Button */}
          <TouchableOpacity
            style={styles.aiAnalyseButton}
            onPress={handleProceedToAi}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="creation" size={20} color={COLORS.white} />
            <Text style={styles.aiAnalyseButtonText}>Analyze & Detect Services</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Standard Search Bar */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>Browse by Skill Category</Text>
        </View>

        <View style={styles.searchBarWrapper}>
          <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search Electrician, Plumber, Cleaner..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories List */}
        <View style={styles.categoriesList}>
          {filteredCategories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryItem, isSelected && styles.categoryItemActive]}
                onPress={() => {
                  setSelectedCategory(cat.name);
                  navigation.navigate('WorkerRecommendations', { category: cat.name });
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: cat.bg }]}>
                  <MaterialCommunityIcons name={cat.icon} size={28} color={cat.color} />
                </View>

                <View style={styles.categoryItemDetails}>
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryTitleText}>{cat.name}</Text>
                    <View style={styles.verifiedCountPill}>
                      <Text style={styles.verifiedCountText}>{cat.count}</Text>
                    </View>
                  </View>
                  <Text style={styles.categoryDescription} numberOfLines={1}>
                    {cat.description}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={COLORS.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  naturalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  naturalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  naturalHelper: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  naturalLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  textAreaWrapper: {
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    position: 'relative',
  },
  textAreaInput: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  clearIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  suggestionsHeader: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  promptsScroll: {
    flexDirection: 'row',
    marginVertical: SPACING.xs,
  },
  promptChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    maxWidth: 240,
  },
  promptChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  promptChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  promptChipTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  aiAnalyseButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
    gap: 8,
    ...SHADOWS.sm,
  },
  aiAnalyseButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  sectionHeadingRow: {
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    marginBottom: SPACING.md,
  },
  searchBarInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  categoriesList: {
    gap: SPACING.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  categoryItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryItemDetails: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  categoryTitleText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  verifiedCountPill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  verifiedCountText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  categoryDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
});

export default SearchServiceScreen;
