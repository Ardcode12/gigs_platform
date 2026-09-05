import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../theme';
import { reportCustomer } from '../../api/reports';
import { useT } from '../../i18n/LanguageContext';

const CATEGORIES = [
  ['Customer did not provide OTP', 'worker.reportCategoryOtp'],
  ['Customer refused payment', 'worker.reportCategoryPayment'],
  ['Unsafe or abusive behavior', 'worker.reportCategoryUnsafe'],
  ['Other issue', 'worker.reportCategoryOther'],
];

const ReportCustomerScreen = () => {
  const navigation = useNavigation();
  const jobId = useRoute().params?.jobId;
  const [category, setCategory] = useState(CATEGORIES[0][0]);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const t = useT();

  const submit = async () => {
    if (!jobId || sending) return;
    setSending(true);
    try {
      await reportCustomer(jobId, category, description.trim() || null);
       Alert.alert(t('worker.reportSubmitted'), t('worker.reportBody'), [
         { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
       Alert.alert(t('worker.couldNotReport'), error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
         <Text style={styles.title}>{t('worker.reportCustomer')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
         <Text style={styles.label}>{t('worker.reason')}</Text>
         {CATEGORIES.map(([value, key]) => (
           <TouchableOpacity key={value} style={styles.option} onPress={() => setCategory(value)}>
             <View style={[styles.radio, category === value && styles.radioActive]} />
             <Text style={styles.optionText}>{t(key)}</Text>
          </TouchableOpacity>
        ))}
         <Text style={styles.label}>{t('worker.detailsOptional')}</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
           placeholder={t('worker.describe')}
          placeholderTextColor={COLORS.textTertiary}
          multiline
          style={styles.input}
        />
        <TouchableOpacity style={styles.submit} onPress={submit} disabled={sending}>
           <Text style={styles.submitText}>{sending ? t('common.loading') : t('worker.submitReport')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, padding: SPACING.lg,
  },
  back: { color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },
  title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.xl },
  label: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.lg },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, marginRight: SPACING.md },
  radioActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  optionText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md },
  input: { minHeight: 110, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, textAlignVertical: 'top', color: COLORS.textPrimary },
  submit: { marginTop: SPACING.xl, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center' },
  submitText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
});

export default ReportCustomerScreen;
