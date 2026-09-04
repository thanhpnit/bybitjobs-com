import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIAdvisorScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { userRole, userData, employerData } = useAuth();
  const isEmployer = userRole === 'employer';

  const scrollViewRef = useRef<ScrollView>(null);

  // Initial welcome message tailored to candidate / employer
  const initialWelcomeMsg: Message = {
    id: 'welcome-1',
    role: 'assistant',
    content: isEmployer
      ? `👋 Xin chào Nhà tuyển dụng **${employerData?.companyName || userData?.fullName || 'Quý doanh nghiệp'}**!\n\nTôi là **Trợ lý AI BybitJobs**, chuyên gia cố vấn nhân sự & tuyển dụng. Tôi có thể hỗ trợ bạn:\n\n• ❓ **Soạn câu hỏi phỏng vấn** cho mọi vị trí & cấp bậc\n• 💰 **Tra cứu dải lương thị trường** tại Việt Nam\n• 📋 **Tư vấn chiến lược thu hút nhân tài**\n\nBạn muốn tôi hỗ trợ công việc gì ngay hôm nay?`
      : `👋 Xin chào **${userData?.fullName || 'bạn'}**!\n\nTôi là **Trợ lý AI BybitJobs**, người cố vấn sự nghiệp của bạn. Tôi có thể giúp bạn:\n\n• 🎤 **Tập phỏng vấn thử (AI Mock Interview)** theo ngành nghề\n• 📝 **Cố vấn viết & tối ưu CV chuẩn ATS**\n• 💼 **Định hướng phát triển sự nghiệp & đàm phán lương**\n\nHãy chọn một chủ đề bên dưới hoặc gõ câu hỏi cho tôi nhé!`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<Message[]>([initialWelcomeMsg]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Quick Action Chips
  const candidateChips = [
    { label: '💻 Phỏng vấn Kỹ thuật (Technical)', prompt: 'Tôi muốn tập phỏng vấn thử câu hỏi Kỹ thuật (Technical) vị trí ' + (userData?.desiredJob || 'Software Engineer') + '. Bạn hãy đóng vai Trưởng phòng Công nghệ và đặt 1 câu hỏi nhé!' },
    { label: '🤝 Phỏng vấn Tình huống (Behavioral)', prompt: 'Tôi muốn tập phỏng vấn các câu hỏi Tình huống (Behavioral Questions) xử lý xung đột và làm việc nhóm cho vị trí ' + (userData?.desiredJob || 'Ứng viên') + '.' },
    { label: '🌐 Phỏng vấn Tiếng Anh (English)', prompt: 'Let\'s conduct a mock interview in English for the position of ' + (userData?.desiredJob || 'Software Engineer') + '. Please ask me the first question in English.' },
    { label: '🎤 Phỏng vấn Tổng hợp', prompt: 'Tôi muốn tập phỏng vấn thử tổng hợp vị trí ' + (userData?.desiredJob || 'Software Engineer') + '. Bạn hãy đóng vai nhà tuyển dụng và đặt câu hỏi cho tôi nhé!' },
    { label: '📝 Cố vấn viết & tối ưu CV', prompt: 'Hãy cho tôi các lời khuyên để tối ưu hóa CV cho vị trí ' + (userData?.desiredJob || 'Ứng viên') + ' chuẩn ATS.' },
    { label: '💼 Định hướng phát triển sự nghiệp', prompt: 'Làm sao để tôi phát triển lộ trình thăng tiến sự nghiệp hiệu quả nhất?' },
  ];

  const employerChips = [
    { label: '❓ Soạn câu hỏi phỏng vấn', prompt: 'Hãy soạn giúp tôi bộ 5 câu hỏi phỏng vấn chuyên sâu cho vị trí Tuyển dụng.' },
    { label: '💰 Tra cứu dải lương thị trường', prompt: 'Mức lương thị trường trung bình hiện nay cho vị trí lập trình viên/nhân viên tại TP.HCM là bao nhiêu?' },
    { label: '📋 Bí quyết thu hút ứng viên giỏi', prompt: 'Làm thế nào để viết tin tuyển dụng và thu hút nhiều ứng viên chất lượng nhất?' },
  ];

  const activeChips = isEmployer ? employerChips : candidateChips;

  useEffect(() => {
    // Auto scroll to bottom when messages update
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isSending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputText('');
    setIsSending(true);

    const apiPayload = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const aiReplyId = (Date.now() + 1).toString();
    const initialAiMsg: Message = {
      id: aiReplyId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, initialAiMsg]);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://160.250.246.119:4000/api/ai/career-advisor');
      xhr.setRequestHeader('Content-Type', 'application/json');

      let seenIndex = 0;
      let fullStreamText = '';

      xhr.onprogress = () => {
        const responseText = xhr.responseText;
        const newChunk = responseText.substring(seenIndex);
        seenIndex = responseText.length;

        const lines = newChunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullStreamText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) => (m.id === aiReplyId ? { ...m, content: fullStreamText } : m))
                );
              }
            } catch (e) {}
          }
        }
      };

      xhr.onload = () => {
        setIsSending(false);
        if (fullStreamText.trim().length > 0) return;

        if (xhr.status >= 200 && xhr.status < 300) {
          if (xhr.responseText) {
            try {
              const jsonRes = JSON.parse(xhr.responseText);
              if (jsonRes.reply) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === aiReplyId ? { ...m, content: jsonRes.reply } : m))
                );
                return;
              }
            } catch (e) {}
          }
        }
        setMessages((prev) => prev.filter((m) => m.id !== aiReplyId));
        Alert.alert('Lỗi kết nối AI', 'Không thể kết nối đến Trợ lý AI. Vui lòng kiểm tra kết nối mạng hoặc server VPS.');
      };

      xhr.onerror = () => {
        setIsSending(false);
        if (fullStreamText.trim().length > 0) return;
        setMessages((prev) => prev.filter((m) => m.id !== aiReplyId));
        Alert.alert('Lỗi kết nối AI', 'Có lỗi kết nối mạng tới Trợ lý AI.');
      };

      xhr.send(
        JSON.stringify({
          messages: apiPayload,
          userRole: userRole || 'candidate',
          jobPosition: userData?.desiredJob || '',
        })
      );
    } catch (err: any) {
      setIsSending(false);
      Alert.alert('Lỗi kết nối', err.message || 'Có lỗi xảy ra khi trò chuyện với Trợ lý AI.');
    }
  };

  const handleResetChat = () => {
    setMessages([initialWelcomeMsg]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#11181C'} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.aiHeaderAvatar}>
            <Ionicons name="sparkles" size={16} color="#FFF" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#11181C' }]}>BybitJobs AI Advisor</Text>
            <Text style={styles.headerSubtitle}>
              {isEmployer ? 'Chế độ Nhà tuyển dụng' : 'Chế độ Cố vấn Ứng viên'}
            </Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={handleResetChat}>
          <Ionicons name="refresh-outline" size={22} color={isDark ? '#9BA1A6' : '#687076'} />
        </TouchableOpacity>
      </View>

      {/* Main Messages Area */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isAI ? styles.aiMessageWrapper : styles.userMessageWrapper,
                ]}
              >
                {isAI && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={14} color="#FFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isAI
                      ? [styles.aiBubble, { backgroundColor: isDark ? '#1F1A24' : '#FFFFFF', borderColor: isDark ? '#3B2D54' : '#E9D5FF' }]
                      : [styles.userBubble, { backgroundColor: '#0084FF' }],
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isAI ? { color: isDark ? '#E5E7EB' : '#1F2937' } : { color: '#FFFFFF' },
                    ]}
                  >
                    {msg.content}
                  </Text>
                  {isAI ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => Alert.alert('Đã sao chép', 'Nội dung phản hồi từ AI đã được lưu!')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Ionicons name="copy-outline" size={12} color="#7C3AED" />
                        <Text style={{ fontSize: 11, color: '#7C3AED', fontWeight: '600' }}>Sao chép</Text>
                      </TouchableOpacity>
                      <Text style={[styles.messageTime, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>
                        {msg.timestamp}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.messageTime, { color: '#E0F2FE' }]}>
                      {msg.timestamp}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {isSending && (
            <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color="#FFF" />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: isDark ? '#1F1A24' : '#FFFFFF', borderColor: isDark ? '#3B2D54' : '#E9D5FF', flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text style={{ color: isDark ? '#D1D5DB' : '#6B7280', fontSize: 13, fontStyle: 'italic' }}>
                  AI đang suy nghĩ và trả lời...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Action Shortcut Chips */}
        <View style={styles.quickChipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsContainer}>
            {activeChips.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => handleSendMessage(chip.prompt)}
                disabled={isSending}
                style={[
                  styles.chipButton,
                  {
                    backgroundColor: isDark ? '#2C2038' : '#F3E8FF',
                    borderColor: isDark ? '#4C3068' : '#DDD6FE',
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: isDark ? '#E9D5FF' : '#6B21A8' }]}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Input Bar */}
        <View style={[styles.inputBarContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderTopColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <TextInput
            style={[
              styles.chatTextInput,
              {
                backgroundColor: isDark ? '#151718' : '#F1F5F9',
                color: isDark ? '#FFF' : '#11181C',
                borderColor: isDark ? '#2C2C2E' : '#E2E8F0',
                maxHeight: 100,
              },
            ]}
            placeholder={isEmployer ? 'Hỏi AI về câu hỏi phỏng vấn, mức lương...' : 'Hỏi AI về cố vấn CV, tập phỏng vấn thử...'}
            placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
            value={inputText}
            onChangeText={setInputText}
            multiline={true}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isSending}
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() && !isSending ? '#0084FF' : (isDark ? '#2C2C2E' : '#E2E8F0') },
            ]}
          >
            <Ionicons name="send" size={18} color={inputText.trim() && !isSending ? '#FFF' : '#94A3B8'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
    paddingRight: 40,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
    paddingLeft: 40,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  aiBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  quickChipsWrapper: {
    paddingVertical: 8,
  },
  quickChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
