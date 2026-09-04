import React, { useState } from 'react';
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
import { RECOMMENDED_WORKERS, CHAT_MESSAGES_SAMPLE } from '../data/customerMockData';

const CustomerChatScreen = ({ navigation, route }) => {
  const worker = route?.params?.worker || RECOMMENDED_WORKERS[0];
  const [messages, setMessages] = useState(CHAT_MESSAGES_SAMPLE);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'customer',
      text: inputText.trim(),
      time: 'Just now',
    };
    setMessages([...messages, newMsg]);
    setInputText('');
  };

  const handleProtectedCall = () => {
    Alert.alert(
      'Protected In-App Call',
      `Calling ${worker.name} via WORKMAT Masked Exchange. Your phone number is strictly shielded and not revealed to the worker.`,
      [{ text: 'Start Masked Call' }, { text: 'Cancel', style: 'cancel' }]
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
          <Image source={{ uri: worker.photo }} style={styles.headerAvatar} />
          <View>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerWorkerName}>{worker.name}</Text>
              <MaterialCommunityIcons name="check-decagram" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.headerStatusText}>Online • South Coop #14</Text>
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
          Protected Channel: Phone numbers are hidden on both ends for your safety.
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
            <Text style={styles.chatStartDateText}>Today • Electrical Booking</Text>
          </View>

          {messages.map((item) => {
            const isMe = item.sender === 'customer';
            return (
              <View
                key={item.id}
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
                    {item.text}
                  </Text>
                  <Text style={[styles.messageTime, isMe ? styles.timeMe : styles.timeWorker]}>
                    {item.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Clarification Chips */}
        <View style={styles.quickRepliesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              'Are you bringing spare parts?',
              'What time will you reach?',
              'I have uploaded a photo.',
              'Please bring safety ladders.',
            ].map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickChip}
                onPress={() => setInputText(chip)}
              >
                <Text style={styles.quickChipText}>{chip}</Text>
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
            placeholder="Type a message or question..."
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
