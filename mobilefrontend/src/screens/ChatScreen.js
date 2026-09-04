import React, { useCallback, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import Avatar from '../components/Avatar';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import useApi from '../hooks/useApi';
import { useSocketEvent, WS_EVENTS } from '../context/SocketContext';
import { getMessages, sendMessage, requestCall } from '../api/chat';
import { getJob } from '../api/jobs';
import { formatTime } from '../utils/format';

/**
 * Spec #5 — talk to the customer before and during the job.
 *
 * Neither side ever sees a phone number: the only way to get a call is to ask the
 * customer to place one, which is a record on the job, not a number.
 */
const ChatScreen = () => {
  const navigation = useNavigation();
  const jobId = useRoute().params?.jobId;
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [calling, setCalling] = useState(false);
  const flatListRef = useRef(null);

  const thread = useApi(
    useCallback(
      () =>
        Promise.all([getJob(jobId), getMessages(jobId)]).then(([job, messages]) => ({
          job,
          messages,
        })),
      [jobId],
    ),
    [jobId],
  );

  // A message from the customer arrives over the socket; pull the thread again so
  // ordering and ids come from one source.
  useSocketEvent([WS_EVENTS.CHAT_MESSAGE], (event) => {
    if (event.payload?.job_id === jobId) thread.refetch();
  });

  const job = thread.data?.job;
  const messages = thread.data?.messages ?? [];

  const scrollToEnd = (animated = true) => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated }), 60);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    // Show it straight away — a chat that waits for the server feels broken.
    const optimistic = {
      id: `pending-${Date.now()}`,
      sender: 'worker',
      text,
      sent_at: new Date().toISOString(),
      pending: true,
    };
    thread.setData((prev) => ({ ...prev, messages: [...(prev?.messages ?? []), optimistic] }));
    scrollToEnd();

    try {
      const saved = await sendMessage(jobId, text);
      thread.setData((prev) => ({
        ...prev,
        messages: (prev?.messages ?? []).map((m) => (m.id === optimistic.id ? saved : m)),
      }));
    } catch (error) {
      thread.setData((prev) => ({
        ...prev,
        messages: (prev?.messages ?? []).map((m) =>
          m.id === optimistic.id ? { ...m, pending: false, failed: true } : m,
        ),
      }));
      Alert.alert('Message not sent', error.message);
    } finally {
      setSending(false);
    }
  };

  const handleRequestCall = async () => {
    setCalling(true);
    try {
      await requestCall(jobId);
      Alert.alert(
        'Call requested',
        'The customer has been asked to call you. Your number stays private.',
      );
    } catch (error) {
      Alert.alert('Could not send the request', error.message);
    } finally {
      setCalling(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isWorker = item.sender === 'worker';
    return (
      <View
        style={[
          styles.messageBubbleWrap,
          isWorker ? styles.workerBubbleWrap : styles.customerBubbleWrap,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isWorker ? styles.workerBubble : styles.customerBubble,
            item.failed && styles.failedBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isWorker ? styles.workerMessageText : styles.customerMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
        <Text style={[styles.messageTime, isWorker ? styles.workerTime : styles.customerTime]}>
          {item.failed ? 'Not sent' : item.pending ? 'Sending…' : formatTime(item.sent_at)}
        </Text>
      </View>
    );
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Avatar name={job?.customer.name ?? '?'} uri={job?.customer.photo_url} size={40} />
        <View style={{ marginLeft: SPACING.sm }}>
          <Text style={styles.headerName}>{job?.customer.name ?? 'Customer'}</Text>
          <Text style={styles.headerStatus}>{job?.service_type ?? 'Customer'}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.callBtn} onPress={handleRequestCall} disabled={calling}>
        {calling ? (
          <ActivityIndicator size="small" color={COLORS.success} />
        ) : (
          <MaterialCommunityIcons name="phone-outline" size={22} color={COLORS.success} />
        )}
      </TouchableOpacity>
    </View>
  );

  if (thread.loading && !thread.data) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        {header}
        <LoadingState />
      </View>
    );
  }

  if (!thread.data) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        {header}
        <EmptyState
          tone="error"
          title="Couldn't load the chat"
          message={thread.error?.message}
          actionLabel="Try again"
          onAction={thread.reload}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      {header}

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.info} />
        <Text style={styles.privacyText}>
          Phone numbers are hidden. Use &quot;Request Call&quot; for privacy-protected calling.
        </Text>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={40}
            color={COLORS.textTertiary}
          />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Say hello, confirm the address, or ask what the problem looks like.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, inputText.trim() ? styles.sendBtnActive : {}]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <MaterialCommunityIcons
              name="send"
              size={22}
              color={inputText.trim() ? COLORS.white : COLORS.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Request Call Button */}
        <TouchableOpacity
          style={styles.requestCallBar}
          activeOpacity={0.8}
          onPress={handleRequestCall}
          disabled={calling}
        >
          <MaterialCommunityIcons name="phone-in-talk" size={20} color={COLORS.success} />
          <Text style={styles.requestCallText}>
            {calling ? 'Sending request…' : 'Request Customer to Call (Privacy Protected)'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  headerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  headerStatus: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  privacyText: {
    fontSize: FONT_SIZE.xs,
    color: '#0369A1',
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 16,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  messagesList: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  messageBubbleWrap: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  workerBubbleWrap: {
    alignSelf: 'flex-end',
  },
  customerBubbleWrap: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  workerBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    ...SHADOWS.sm,
  },
  failedBubble: {
    opacity: 0.55,
  },
  messageText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  workerMessageText: {
    color: COLORS.white,
  },
  customerMessageText: {
    color: COLORS.textPrimary,
  },
  messageTime: {
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },
  workerTime: {
    color: COLORS.textTertiary,
    textAlign: 'right',
  },
  customerTime: {
    color: COLORS.textTertiary,
    textAlign: 'left',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 0,
    marginRight: SPACING.sm,
    maxHeight: 100,
  },
  textInput: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    minHeight: 40,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
  requestCallBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.successLight,
    paddingVertical: SPACING.md,
    paddingBottom: 34,
  },
  requestCallText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSuccess,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: SPACING.sm,
  },
});

export default ChatScreen;
