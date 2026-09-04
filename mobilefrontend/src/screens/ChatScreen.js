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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import { CHAT_MESSAGES } from '../data/mockData';

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: String(messages.length + 1),
      sender: 'worker',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
    setMessages([...messages, newMsg]);
    setInputText('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>PS</Text>
          </View>
          <View>
            <Text style={styles.headerName}>Priya Sharma</Text>
            <Text style={styles.headerStatus}>Customer</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <MaterialCommunityIcons name="phone-outline" size={22} color={COLORS.success} />
        </TouchableOpacity>
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.info} />
        <Text style={styles.privacyText}>
          Phone numbers are hidden. Use "Request Call" for privacy-protected calling.
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn}>
            <MaterialCommunityIcons name="camera" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachBtn}>
            <MaterialCommunityIcons name="image" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, inputText.trim() ? styles.sendBtnActive : {}]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <MaterialCommunityIcons
              name="send"
              size={22}
              color={inputText.trim() ? COLORS.white : COLORS.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Request Call Button */}
        <TouchableOpacity style={styles.requestCallBar} activeOpacity={0.8}>
          <MaterialCommunityIcons name="phone-in-talk" size={20} color={COLORS.success} />
          <Text style={styles.requestCallText}>Request Customer to Call (Privacy Protected)</Text>
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
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerAvatarText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
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
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 0,
    marginHorizontal: SPACING.sm,
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
