import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface NotificationItem {
  id: string;
  category: 'job' | 'system' | 'community' | 'security';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeSegment, setActiveSegment] = React.useState<'all' | 'unread'>('all');

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    {
      id: '1',
      category: 'job',
      title: 'Nhà tuyển dụng đã xem hồ sơ',
      description: 'Công ty Bybit Việt Nam đã xem CV_Web_Developer_VN.pdf của bạn.',
      time: '3 phút trước',
      isRead: false,
    },
    {
      id: '2',
      category: 'security',
      title: 'Xác thực tài khoản thành công',
      description: 'Chúc mừng! Tài khoản của bạn đã được xác thực chính chủ và cấp tích xanh.',
      time: '15 phút trước',
      isRead: false,
    },
    {
      id: '3',
      category: 'job',
      title: 'Tin tuyển dụng phù hợp mới',
      description: 'Việc làm "Senior React Native Developer - Bybit" đang tìm ứng viên phù hợp với bạn.',
      time: '1 giờ trước',
      isRead: false,
    },
    {
      id: '4',
      category: 'community',
      title: 'Lượt tương tác mới trong Cộng đồng',
      description: 'Nguyễn Văn A và 5 người khác đã thích bài viết chia sẻ kinh nghiệm phỏng vấn của bạn.',
      time: 'Hôm qua',
      isRead: true,
    },
    {
      id: '5',
      category: 'system',
      title: 'Chào mừng bạn đến với BybitJobs',
      description: 'Khám phá ngay hàng ngàn công việc chất lượng và tạo CV chuyên nghiệp miễn phí.',
      time: '2 ngày trước',
      isRead: true,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications(
      notifications.map((n) => ({ ...n, isRead: true }))
    );
    Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc!');
  };

  const handleNotificationPress = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    const item = notifications.find((n) => n.id === id);
    if (item) {
      Alert.alert(item.title, item.description);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'job':
        return { name: 'briefcase', color: '#0084FF', bg: '#E6F4FE' };
      case 'security':
        return { name: 'shield-checkmark', color: '#4CAF50', bg: '#E8F5E9' };
      case 'community':
        return { name: 'people', color: '#FF2D55', bg: '#FFEBEE' };
      default:
        return { name: 'notifications', color: '#FF9500', bg: '#FFF3E0' };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeSegment === 'unread') return !n.isRead;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Header Background */}
      <View style={styles.headerBg} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerBarPlaceholder} />
          <Text style={styles.headerTitle}>Thông báo</Text>
          {notifications.some((n) => !n.isRead) ? (
            <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead} style={styles.iconButton}>
              <Ionicons name="checkmark-done" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBarPlaceholder} />
          )}
        </View>

        {/* Filter Segment Row */}
        <View style={styles.segmentContainer}>
          <View style={[styles.segmentTrack, { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSegment('all')}
              style={[
                styles.segmentItem,
                activeSegment === 'all' && [styles.segmentItemActive, { backgroundColor: isDark ? '#2C2C2E' : '#FFF' }]
              ]}
            >
              <Text style={[styles.segmentText, activeSegment === 'all' ? styles.segmentTextActive : { color: isDark ? '#AAA' : '#666' }]}>
                Tất cả ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSegment('unread')}
              style={[
                styles.segmentItem,
                activeSegment === 'unread' && [styles.segmentItemActive, { backgroundColor: isDark ? '#2C2C2E' : '#FFF' }]
              ]}
            >
              <Text style={[styles.segmentText, activeSegment === 'unread' ? styles.segmentTextActive : { color: isDark ? '#AAA' : '#666' }]}>
                Chưa đọc ({notifications.filter(n => !n.isRead).length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List of Notifications */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => {
              const iconData = getCategoryIcon(item.category);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => handleNotificationPress(item.id)}
                  style={[
                    styles.notificationCard,
                    isDark ? styles.darkCard : styles.lightCard,
                    !item.isRead && styles.unreadCardBorder
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    
                    {/* Category Icon Circle */}
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C1C1E' : iconData.bg }]}>
                      <Ionicons name={iconData.name as any} size={20} color={iconData.color} />
                    </View>

                    {/* Content */}
                    <View style={styles.contentCol}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C', fontWeight: !item.isRead ? 'bold' : '600' }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {!item.isRead && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <Text style={[styles.cardDesc, { color: isDark ? '#AAA' : '#5E6E7A' }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                      <Text style={styles.cardTime}>
                        {item.time}
                      </Text>
                    </View>

                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#E6F4FE' }]}>
                <Ionicons name="notifications-off-outline" size={48} color="#0084FF" />
              </View>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Không có thông báo mới
              </Text>
              <Text style={styles.emptySubtitle}>
                Bạn sẽ nhận được thông báo khi có việc làm mới, lời mời phỏng vấn hoặc cập nhật hệ thống.
              </Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 120 : 100,
    backgroundColor: '#0084FF',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerBarPlaceholder: {
    width: 36,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Segment bar styles
  segmentContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  segmentTrack: {
    flexDirection: 'row',
    height: 42,
    borderRadius: 21,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentItemActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  segmentTextActive: {
    color: '#0084FF',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  
  // Notification cards
  notificationCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  lightCard: {
    backgroundColor: '#FFF',
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
  },
  unreadCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#0084FF',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0084FF',
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  cardTime: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 6,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 100,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
});
