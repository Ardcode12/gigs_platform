import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { getCustomerMessages, sendCustomerMessage } from '../../api/chat';

const CustomerChatScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const { worker = {}, jobId } = useRoute().params ?? {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!jobId) return undefined;
    let cancelled = false;
    getCustomerMessages(jobId).then((data) => {
      if (!cancelled) setMessages(data || []);
    }).catch(() => {
      if (!cancelled) setMessages([]);
    });
    return () => { cancelled = true; };
  }, [jobId]);

  const messageText = (message) =>
    message.textKey ? t(message.textKey) : message.text ?? '';

  // Backend sends `sent_at` (ISO timestamp). Format it to HH:MM.
  const messageTime = (message) => {
    if (message.timeKey) return t(message.timeKey);
    if (message.sent_at) {
      try {
        const d = new Date(message.sent_at);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch { return ''; }
    }
    return message.time ?? '';
  };

  // Poll every 3 seconds for new messages
  useEffect(() => {
    if (!jobId) return undefined;
    const interval = setInterval(() => {
      getCustomerMessages(jobId).then((data) => {
        if (data) setMessages(data);
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (!jobId) return;
    sendCustomerMessage(jobId, inputText.trim()).then((message) => {
      setMessages((currentMessages) => [...currentMessages, message]);
      setInputText('');
    }).catch((err) => Alert.alert(t('common.error'), err.message));
  };

  const handleProtectedCall = () => {
    Alert.alert(
      t('customer.chatCallTitle'),
      t('customer.chatCallBody', { name: worker.name }),
      [{ text: t('customer.startMaskedCall') }, { text: t('common.cancel'), style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.workerMetaHeader}
          onPress={() => navigation.navigate('WorkerProfile', { worker })}
        >
          {worker.photo_url || worker.photo ? (
            <Image source={{ uri: worker.photo_url || worker.photo }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, { backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="account-hard-hat" size={24} color={COLORS.primary} />
            </View>
          )}
          <View>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerWorkerName}>{worker.name || 'Worker'}</Text>
              <MaterialCommunityIcons name="check-decagram" size={14} color={COLORS.primary} />
            </View>
             <Text style={styles.headerStatusText}>{t('customer.online')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.callHeaderButton} onPress={handleProtectedCall}>
          <MaterialCommunityIcons name="phone-shield" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Hidden Phone Number Privacy Banner */}
      <View style={styles.privacyBanner}>
        <MaterialCommunityIcons name="shield-lock-outline" size={16} color={COLORS.primary} />
        <Text style={styles.privacyBannerText}>
           {t('customer.protectedChannel')}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatContainer}
      >
        {/* Messages List */}
        <ScrollView
          style={styles.messagesScrollView}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chatStartDateWrapper}>
             <Text style={styles.chatStartDateText}>{t('customer.todayBooking')}</Text>
          </View>

           {messages.map((item) => {
            const isMe = item.sender === 'customer';
            return (
              <View
                key={String(item.id)}
                style={[
                  styles.messageBubbleWrapper,
                  isMe ? styles.messageBubbleMe : styles.messageBubbleWorker,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.bubbleMeColor : styles.bubbleWorkerColor,
                  ]}
                  >
                  <Text style={[styles.messageText, isMe ? styles.textMe : styles.textWorker]}>
                    {messageText(item)}
                  </Text>
                  <Text style={[styles.messageTime, isMe ? styles.timeMe : styles.timeWorker]}>
                    {messageTime(item)}
                  </Text>
                </View>
              </View>
             );
           })}
           {messages.length === 0 && (
             <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>{t('chat.empty')}</Text>
           )}
         </ScrollView>

        {/* Quick Clarification Chips */}
        <View style={styles.quickRepliesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             {['customer.quickParts', 'customer.quickReach', 'customer.quickPhoto', 'customer.quickLadders'].map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.quickChip}
               onPress={() => setInputText(t(key))}
              >
                 <Text style={styles.quickChipText}>{t(key)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachButton}>
            <MaterialCommunityIcons name="camera-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={styles.chatTextInput}
             placeholder={t('customer.chatPlaceholder')}
            placeholderTextColor={COLORS.textTertiary}
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length > 0 && styles.sendButtonActive,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <MaterialCommunityIcons
              name="send"
              size={18}
              color={inputText.trim() ? COLORS.white : COLORS.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  workerMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: SPACING.xs,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerWorkerName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  headerStatusText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  callHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  privacyBanner: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  privacyBannerText: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: FONT_WEIGHT.medium,
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  chatStartDateWrapper: {
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chatStartDateText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  messageBubbleWrapper: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  messageBubbleMe: {
    alignSelf: 'flex-end',
  },
  messageBubbleWorker: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  bubbleMeColor: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  bubbleWorkerColor: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  textMe: {
    color: COLORS.white,
  },
  textWorker: {
    color: COLORS.textPrimary,
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeWorker: {
    color: COLORS.textTertiary,
  },
  quickRepliesContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  quickChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    maxHeight: 80,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
});

export default CustomerChatScreen;
