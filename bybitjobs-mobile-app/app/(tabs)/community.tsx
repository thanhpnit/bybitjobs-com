import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import RecruiterJobsScreen from '../recruiter/jobs';

interface PostItem {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  createdAt: string;
  category: 'Review' | 'Interview' | 'Salary' | 'General';
  title: string;
  content: string;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
}

function CandidateCommunityScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { userData } = useAuth();

  const [activeCategory, setActiveCategory] = useState<'All' | 'Review' | 'Interview' | 'Salary'>('All');
  const [posts, setPosts] = useState<PostItem[]>([
    {
      id: 'post-1',
      authorName: 'Nguyễn Văn Nam',
      authorRole: 'Senior React Native Dev',
      createdAt: '2 giờ trước',
      category: 'Interview',
      title: 'Chia sẻ kinh nghiệm phỏng vấn vị trí Mobile Lead lương $2500',
      content: 'Vừa hoàn thành 3 vòng phỏng vấn tại công ty công nghệ lớn. Vòng 1 hỏi sâu về React Native Architecture, Reanimated 3 và Firebase Offline Sync. Vòng 2 làm bài test live coding...',
      likes: 42,
      commentsCount: 15,
      isLiked: false,
    },
    {
      id: 'post-2',
      authorName: 'Trần Thị Mai',
      authorRole: 'HR Manager @ TechCorp',
      createdAt: '5 giờ trước',
      category: 'Review',
      title: 'Những lỗi sai kinh điển khiến CV bị loại ngay từ vòng giữ xe!',
      content: 'Làm HR 6 năm qua mình thấy 80% ứng viên hay mắc các lỗi: Không ghi rõ thành tựu bằng con số định lượng, trình bày từ ngữ thiếu tính chuẩn ATS, file CV nặng hơn 10MB...',
      likes: 89,
      commentsCount: 34,
      isLiked: true,
    },
    {
      id: 'post-3',
      authorName: 'Hoàng Minh Đức',
      authorRole: 'Fullstack Developer',
      createdAt: '1 ngày trước',
      category: 'Salary',
      title: 'Dải lương thị trường Lập trình viên năm 2026 tại TP.HCM & Hà Nội',
      content: 'Theo khảo sát mới nhất của BybitJobs AI Engine: Mức lương Junior Fullstack dao động 15-22tr, Mid-level 25-38tr, Senior 45-65tr. Làm Remote cho cty nước ngoài có thể chạm mốc $3500+.',
      likes: 120,
      commentsCount: 56,
      isLiked: false,
    },
  ]);

  // Modal Create Post State
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'Review' | 'Interview' | 'Salary' | 'General'>('General');

  const filteredPosts = posts.filter((p) => {
    if (activeCategory === 'Review') return p.category === 'Review';
    if (activeCategory === 'Interview') return p.category === 'Interview';
    if (activeCategory === 'Salary') return p.category === 'Salary';
    return true;
  });

  const handleToggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likes: isLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề và nội dung bài viết.');
      return;
    }

    const created: PostItem = {
      id: `post-${Date.now()}`,
      authorName: userData?.fullName || 'Ứng viên BybitJobs',
      authorRole: userData?.desiredJob || 'Thành viên cộng đồng',
      createdAt: 'Vừa xong',
      category: newPostCategory,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      likes: 1,
      commentsCount: 0,
      isLiked: true,
    };

    setPosts([created, ...posts]);
    setIsCreateModalVisible(false);
    setNewPostTitle('');
    setNewPostContent('');
    Alert.alert('Thành công', 'Bài viết của bạn đã được đăng lên Cộng đồng!');
  };

  const handleAIAssistPost = () => {
    setNewPostTitle('Chia sẻ kinh nghiệm phỏng vấn & tối ưu hồ sơ công việc');
    setNewPostContent(
      'Xin chào mọi người! Mình vừa áp dụng các mẹo chấm điểm CV chuẩn ATS và tập phỏng vấn thử với Trợ lý AI BybitJobs, kết quả mang lại rất ấn tượng. Các kỹ năng chính được sắp xếp rõ ràng hơn giúp tỷ lệ nhận cuộc gọi phỏng vấn tăng gấp 2 lần. Cụ thể kinh nghiệm như sau...'
    );
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Review':
        return { label: '💬 Review Công ty', color: '#EF4444', bg: '#FEF2F2' };
      case 'Interview':
        return { label: '💡 Phỏng vấn', color: '#0F172A', bg: '#F1F5F9' };
      case 'Salary':
        return { label: '💰 Thảo luận Lương', color: '#10B981', bg: '#ECFDF5' };
      default:
        return { label: '🌐 Thảo luận chung', color: '#8B5CF6', bg: '#F5F3FF' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: '#FFFFFF', borderBottomColor: '#F1F5F9' }]}>
        <View style={styles.headerTitleGroup}>
          <Ionicons name="people" size={22} color="#0F172A" />
          <Text style={[styles.headerTitle, { color: '#0F172A' }]}>Cộng đồng BybitJobs</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsCreateModalVisible(true)}
          style={styles.createPostBtn}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.createPostBtnText}>Đăng bài</Text>
        </TouchableOpacity>
      </View>

      {/* Category Chips Bar */}
      <View style={{ paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {[
            { id: 'All', label: 'Tất cả bài viết' },
            { id: 'Interview', label: '💡 Phỏng vấn' },
            { id: 'Review', label: '💬 Review Công ty' },
            { id: 'Salary', label: '💰 Thảo luận Lương' },
          ].map((item) => {
            const isActive = activeCategory === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setActiveCategory(item.id as any)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: isActive ? '#0F172A' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: isActive ? '#0F172A' : '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: isActive ? '700' : '500', color: isActive ? '#FFF' : '#475569' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Posts List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredPosts.map((post) => {
          const badge = getCategoryBadge(post.category);
          return (
            <View
              key={post.id}
              style={[
                styles.postCard,
                { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' },
              ]}
            >
              {/* Author Header */}
              <View style={styles.postHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{post.authorName[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.authorName, { color: isDark ? '#FFF' : '#11181C' }]}>{post.authorName}</Text>
                  <Text style={styles.authorRole}>{post.authorRole} • {post.createdAt}</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.categoryBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              {/* Post Title & Content */}
              <Text style={[styles.postTitle, { color: isDark ? '#FFF' : '#11181C' }]}>{post.title}</Text>
              <Text style={[styles.postContent, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>{post.content}</Text>

              {/* Action Buttons Footer */}
              <View style={[styles.postFooter, { borderTopColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleToggleLike(post.id)}
                  style={styles.actionBtn}
                >
                  <Ionicons name={post.isLiked ? 'heart' : 'heart-outline'} size={18} color={post.isLiked ? '#FF2D55' : '#8E8E93'} />
                  <Text style={[styles.actionBtnText, { color: post.isLiked ? '#FF2D55' : (isDark ? '#9CA3AF' : '#687076') }]}>
                    {post.likes} Yêu thích
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Bình luận', `Tính năng bình luận cho bài viết "${post.title}" đang được mở.`)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={isDark ? '#9CA3AF' : '#687076'} />
                  <Text style={[styles.actionBtnText, { color: isDark ? '#9CA3AF' : '#687076' }]}>
                    {post.commentsCount} Bình luận
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Chia sẻ', 'Đã sao chép liên kết bài viết vào bộ nhớ tạm!')}
                  style={styles.actionBtn}
                >
                  <Ionicons name="share-social-outline" size={18} color={isDark ? '#9CA3AF' : '#687076'} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal Create Post */}
      <Modal visible={isCreateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Tạo bài viết mới</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#11181C'} />
              </TouchableOpacity>
            </View>

            {/* AI Assistant Generator Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAIAssistPost}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F3E8FF',
                borderColor: '#7C3AED',
                borderWidth: 1,
                padding: 10,
                borderRadius: 12,
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Ionicons name="sparkles" size={18} color="#7C3AED" />
              <Text style={{ color: '#7C3AED', fontSize: 12, fontWeight: '700' }}>✨ AI Gợi ý nội dung bài viết chia sẻ</Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.inputTitle, { backgroundColor: isDark ? '#151718' : '#F1F5F9', color: isDark ? '#FFF' : '#11181C' }]}
              placeholder="Tiêu đề bài viết..."
              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
              value={newPostTitle}
              onChangeText={setNewPostTitle}
            />

            <TextInput
              style={[styles.inputContent, { backgroundColor: isDark ? '#151718' : '#F1F5F9', color: isDark ? '#FFF' : '#11181C' }]}
              placeholder="Nội dung bài viết chia sẻ kinh nghiệm..."
              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
              multiline
              value={newPostContent}
              onChangeText={setNewPostContent}
            />

            <TouchableOpacity activeOpacity={0.85} onPress={handleCreatePost} style={styles.submitPostBtn}>
              <Text style={styles.submitPostBtnText}>Đăng bài ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  createPostBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  createPostBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  postCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorRole: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  postContent: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputTitle: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  inputContent: {
    height: 120,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitPostBtn: {
    backgroundColor: '#0F172A',
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitPostBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default function CommunityScreen() {
  const { userRole } = useAuth();
  if (userRole === 'employer') {
    return <RecruiterJobsScreen />;
  }
  return <CandidateCommunityScreen />;
}
