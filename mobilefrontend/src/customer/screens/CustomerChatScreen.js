import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { getCustomerMessages, sendCustomerMessage } from '../../api/chat';
import { getActiveJob } from '../../api/jobs';
import { useSocketEvent, WS_EVENTS } from '../../context/SocketContext';

const CustomerChatScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const routeParams = useRoute().params ?? {};
  const [jobId, setJobId] = useState(routeParams.jobId || null);
  const [worker, setWorker] = useState(routeParams.worker || null);
  const [loadingActiveJob, setLoadingActiveJob] = useState(!routeParams.jobId);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (!jobId) {
      setLoadingActiveJob(true);
      getActiveJob()
        .then((active) => {
          if (active) {
            setJobId(active.id);
            if (active.worker) setWorker(active.worker);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingActiveJob(false));
    }
  }, [jobId]);

  const fetchMessages = useCallback(() => {
    if (!jobId) return;
    getCustomerMessages(jobId).then((data) => {
      if (data) setMessages(data);
    }).catch(() => {});
  }, [jobId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // WebSocket real-time delivery
  useSocketEvent([WS_EVENTS.CHAT_MESSAGE], (event) => {
    if (!event.payload?.job_id || event.payload?.job_id === jobId) {
      fetchMessages();
    }
  });

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

  // Poll every 3 seconds for new messages as fallback
  useEffect(() => {
    if (!jobId) return undefined;
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [jobId, fetchMessages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (!jobId) return;
    const textToSend = inputText.trim();
    setInputText('');
    sendCustomerMessage(jobId, textToSend).then((message) => {
      setMessages((currentMessages) => [...currentMessages, message]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
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
          <MaterialCommunityIcons name="phone-lock" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Hidden Phone Number Privacy Banner */}
      <View style={styles.privacyBanner}>
        <MaterialCommunityIcons name="shield-lock-outline" size={16} color={COLORS.primary} />
        <Text style={styles.privacyBannerText}>
           {t('customer.protectedChannel')}
        </Text>
      </View>

      {loadingActiveJob ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>{t('common.loading') || 'Loading conversation…'}</Text>
        </View>
      ) : !jobId ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <MaterialCommunityIcons name="chat-processing-outline" size={56} color={COLORS.textTertiary} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, textAlign: 'center' }}>
            {t('customer.noActiveChat') || 'No Active Booking Conversation'}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 18 }}>
            {t('customer.noActiveChatBody') || 'Book a service or view an active booking to message your assigned worker.'}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
            onPress={() => navigation.navigate('CustomerHome')}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600' }}>{t('customer.findServices') || 'Find Services'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chatContainer}
        >
          {/* Messages List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScrollView}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
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
                    styles.messageRow,
                    isMe ? styles.messageRowMe : styles.messageRowThem,
                  ]}
                >
                  {!isMe && (
                    <View style={styles.msgAvatarCircle}>
                      <MaterialCommunityIcons name="account-hard-hat" size={16} color={COLORS.primary} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isMe ? styles.messageBubbleMe : styles.messageBubbleThem,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? styles.messageTextMe : styles.messageTextThem,
                      ]}
                    >
                      {messageText(item)}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isMe ? styles.messageTimeMe : styles.messageTimeThem,
                      ]}
                    >
                      {messageTime(item)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

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
