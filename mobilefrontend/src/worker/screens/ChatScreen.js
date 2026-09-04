import React, { useState, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { CHAT_MESSAGES } from '../data/workerMockData';

const QUICK_WORKER_CHIPS = [
  'I have reached your gate.',
  'Reaching in 10 minutes.',
  'Please share exact flat number.',
  'Need 5 mins to inspect wiring.',
];

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const sendMessage = (customText) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;
    const newMsg = {
      id: String(messages.length + 1),
      sender: 'worker',
      text: textToSend.trim(),
      time: 'Just now',
    };
    setMessages([...messages, newMsg]);
    if (!customText) setInputText('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCall = () => {
    Alert.alert(
      'Protected Call',
      'Calling customer Priya Sharma via WORKMAT masked exchange. Your mobile number remains hidden.',
      [{ text: 'Start Call' }, { text: 'Cancel', style: 'cancel' }]
    );
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
        <Text
          style={[
            styles.messageTime,
            isWorker ? styles.workerTime : styles.customerTime,
          ]}
        >
          {item.time}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>PS</Text>
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.sm }}>
            <Text style={styles.headerName}>Priya Sharma</Text>
            <Text style={styles.headerStatus}>Customer • Electrical Job</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.callBtn}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone-shield" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Privacy Notice Banner */}
      <View style={styles.privacyNotice}>
        <MaterialCommunityIcons name="shield-lock-outline" size={16} color={COLORS.primary} />
        <Text style={styles.privacyText}>
          Privacy Shield: Phone numbers are masked on both ends for safety.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatContainer}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Canned Quick Response Chips for Low-Tech Workers */}
        <View style={styles.quickChipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QUICK_WORKER_CHIPS.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chipButton}
                onPress={() => sendMessage(chip)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Standardized 48px Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => Alert.alert('Upload Photo', 'Take picture of repair area')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="camera-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.textTertiary}
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              inputText.trim().length > 0 && styles.sendBtnActive,
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim()}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  headerName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  headerStatus: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  privacyText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: FONT_WEIGHT.medium,
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: SPACING.md,
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
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  workerBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  customerBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  workerMessageText: {
    color: COLORS.white,
  },
  customerMessageText: {
    color: COLORS.textPrimary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  workerTime: {
    color: COLORS.textTertiary,
  },
  customerTime: {
    color: COLORS.textTertiary,
  },
  quickChipsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  chipButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
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
  cameraBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    maxHeight: 80,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
});

export default ChatScreen;
