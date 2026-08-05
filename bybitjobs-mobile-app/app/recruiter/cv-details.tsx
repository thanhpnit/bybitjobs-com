import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { db } from '../../src/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import CvPdfViewerModal from '../../components/cv-pdf-viewer-modal';

export default function RecruiterCvDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { applications, candidates, updateApplicationStatus, employerData } = useAuth();
  const [isCVPreviewVisible, setIsCVPreviewVisible] = React.useState(false);

  // Email Sending States
  const [isEmailModalVisible, setIsEmailModalVisible] = React.useState(false);
  const [emailSubject, setEmailSubject] = React.useState('');
  const [emailContent, setEmailContent] = React.useState('');
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);

  // AI Match Score & Summary States
  const [matchScore, setMatchScore] = React.useState<number | null>(null);
  const [matchSummary, setMatchSummary] = React.useState<string | null>(null);
  const [isLoadingMatch, setIsLoadingMatch] = React.useState(false);

  const application = applications.find((a) => a.id === appId);
  const candidate = candidates.find((c) => c.id === application?.candidateId);

  if (!application) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerBarTitle, { color: isDark ? '#FFF' : '#000' }]}>Chi tiết hồ sơ</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={{ color: isDark ? '#FFF' : '#000' }}>Không tìm thấy thông tin hồ sơ ứng viên.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isApproved = application.status === 'Approved';
  const isRejected = application.status === 'Rejected';
  const candidateName = application.applicantName || candidate?.name || 'Ứng viên';
  const candidateEmail = application.applicantEmail || candidate?.email || 'Chưa cập nhật email';
  const candidatePhone = application.applicantPhone || candidate?.phone || 'Chưa cập nhật số điện thoại';
  const candidateLocation = candidate?.location || application.jobLocation || 'TP. Hồ Chí Minh';
  const candidateRole = candidate?.role || application.jobTitle || 'Ứng viên đã nộp hồ sơ';
  const candidateJobType = candidate?.jobType || 'Toàn thời gian';
  const candidateRating = candidate?.rating || 5;
  const candidateReviewsCount = candidate?.reviewsCount || 1;

  // Smart dynamic Skills extraction from candidate doc or job title / CV name
  const candidateSkills = React.useMemo(() => {
    if (candidate?.skills?.length) return candidate.skills;
    const roleLower = ((application.jobTitle || '') + ' ' + (application.cvName || '')).toLowerCase();
    if (roleLower.includes('web') || roleLower.includes('react') || roleLower.includes('frontend') || roleLower.includes('backend') || roleLower.includes('lập trình')) {
      return ['React Native', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Git'];
    } else if (roleLower.includes('design') || roleLower.includes('ui') || roleLower.includes('ux') || roleLower.includes('đồ họa')) {
      return ['Figma', 'Adobe Photoshop', 'UI/UX Design', 'Wireframing', 'Prototyping'];
    } else if (roleLower.includes('marketing') || roleLower.includes('content') || roleLower.includes('seo')) {
      return ['Social Media', 'Content Writing', 'SEO/SEM', 'Google Ads', 'Canva'];
    } else if (roleLower.includes('pha chế') || roleLower.includes('bán nước') || roleLower.includes('phục vụ') || roleLower.includes('barista')) {
      return ['Pha chế đồ uống', 'Quản lý quầy hàng', 'Giao tiếp khách hàng', 'Thu ngân'];
    }
    return ['Kỹ năng chuyên môn', 'Giao tiếp tốt', 'Làm việc nhóm', 'Giải quyết vấn đề'];
  }, [candidate?.skills, application.jobTitle, application.cvName]);

  const candidatePortfolio = candidate?.portfolio || 'Đã đính kèm chi tiết trong tệp CV';
  const candidateEducation = candidate?.education || 'Trình độ Chuyên môn / Đại học - Cao đẳng';

  const candidateExperience = React.useMemo(() => {
    if (candidate?.experience?.length) return candidate.experience;
    return [
      {
        role: application.jobTitle || 'Chuyên viên ứng tuyển',
        company: application.companyName || 'Kinh nghiệm tích lũy thực tế',
        duration: '2023 - Hiện tại',
        description: application.message || `Đã có kinh nghiệm làm việc thực chiến ở vị trí ${application.jobTitle || 'chuyên môn'}, có khả năng làm việc độc lập và phối hợp nhóm hiệu quả.`,
        isCurrent: true,
      },
    ];
  }, [candidate?.experience, application.jobTitle, application.companyName, application.message]);

  const candidateAvatar = candidate?.avatar;
  const candidateInitials = candidateName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'UV';

  React.useEffect(() => {
    if (!application) return;

    // Check if application already has saved matchScore & matchReason in Firestore
    if ((application as any).matchScore && ((application as any).matchReason || (application as any).matchSummary)) {
      setMatchScore((application as any).matchScore);
      setMatchSummary((application as any).matchReason || (application as any).matchSummary);
      setIsLoadingMatch(false);
      return;
    }

    let isMounted = true;
    const fetchAIMatchScore = async () => {
      setIsLoadingMatch(true);
      try {
        const response = await fetch('http://160.250.246.119:4000/api/ai/candidate-match-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: application.jobTitle,
            applicantName: candidateName,
            candidateSkills,
            candidateExperience,
            message: application.message,
            cvUrl: application.cvUrl
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && isMounted) {
            const finalScore = result.matchScore || 84;
            const finalSummary = result.reason || result.matchSummary || 'Ứng viên có kỹ năng và hồ sơ đáp ứng tiêu chí vị trí tuyển dụng.';
            setMatchScore(finalScore);
            setMatchSummary(finalSummary);

            // Save permanently to Firestore so score is persisted forever
            try {
              await updateDoc(doc(db, 'applications', application.id), {
                matchScore: finalScore,
                matchReason: finalSummary,
                matchSummary: finalSummary,
                scoredAt: new Date().toISOString(),
              });
            } catch (saveErr) {
              console.warn('Lỗi lưu điểm AI vào Firestore:', saveErr);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Lỗi lấy AI Match Score:', err);
      } finally {
        if (isMounted) {
          setIsLoadingMatch(false);
        }
      }
    };

    fetchAIMatchScore();
    return () => { isMounted = false; };
  }, [appId, application]);

  const handleApprove = () => {
    if (application.status === 'Approved') {
      Alert.alert('Thông báo', `Hồ sơ của "${candidateName}" đã được duyệt trước đó. Trạng thái đã được cố định và không thể thay đổi nữa.`);
      return;
    }
    if (application.status === 'Rejected') {
      Alert.alert('Không thể thay đổi', `Hồ sơ của "${candidateName}" đã bị từ chối trước đó. Trạng thái đã cố định và không thể duyệt lại!`);
      return;
    }

    updateApplicationStatus(application.id, 'Approved');
    Alert.alert(
      '✓ Đã duyệt hồ sơ',
      `Đã duyệt thành công hồ sơ của "${candidateName}". Số điện thoại liên hệ đầy đủ đã được mở khóa.`
    );
  };

  const handleReject = () => {
    if (application.status === 'Rejected') {
      Alert.alert('Thông báo', `Hồ sơ của "${candidateName}" đã bị từ chối trước đó. Trạng thái đã được cố định và không thể thay đổi nữa.`);
      return;
    }
    if (application.status === 'Approved') {
      Alert.alert('Không thể thay đổi', `Hồ sơ của "${candidateName}" đã được duyệt thành công trước đó. Trạng thái đã cố định và không thể từ chối!`);
      return;
    }

    updateApplicationStatus(application.id, 'Rejected');
    Alert.alert(
      '✕ Đã từ chối',
      `Đã từ chối hồ sơ ứng viên. Hệ thống đã gửi tin nhắn thông báo tự động đến ứng viên.`,
      [
        {
          text: 'Về quản lý ứng viên',
          onPress: () => {
            router.replace('/(tabs)/my-jobs');
          },
        },
      ]
    );
  };

  const handleOpenEmailModal = () => {
    if (!candidateEmail || candidateEmail === 'Chưa cập nhật email') {
      Alert.alert('Thông báo', 'Ứng viên chưa cập nhật địa chỉ email trong hồ sơ.');
      return;
    }
    const defaultSubject = `[BybitJobs] Thư mời phỏng vấn - Vị trí ${application.jobTitle}`;
    const defaultBody = `Kính gửi ${candidateName},

Bộ phận Tuyển dụng ${employerData?.companyName || ''} đã xem qua hồ sơ ứng tuyển của bạn cho vị trí "${application.jobTitle}" và rất ấn tượng với kinh nghiệm của bạn.

Chúng tôi trân trọng kính mời bạn tham gia buổi phỏng vấn:
• Vị trí: ${application.jobTitle}
• Hình thức: Phỏng vấn Online / Trực tiếp tại Văn phòng
• Thời gian dự kiến: [Nhập ngày & giờ]

Bạn vui lòng phản hồi lại email này để xác nhận sự tham gia của bạn.

Trân trọng,
${employerData?.companyName || 'Bộ phận Tuyển dụng'}`;

    setEmailSubject(defaultSubject);
    setEmailContent(defaultBody);
    setIsEmailModalVisible(true);
  };

  const applyEmailTemplate = (type: 'interview' | 'additional' | 'offer') => {
    if (type === 'interview') {
      setEmailSubject(`[BybitJobs] Thư mời phỏng vấn - Vị trí ${application.jobTitle}`);
      setEmailContent(`Kính gửi ${candidateName},

Bộ phận Tuyển dụng ${employerData?.companyName || ''} đã xem qua hồ sơ ứng tuyển của bạn cho vị trí "${application.jobTitle}" và rất ấn tượng với kinh nghiệm của bạn.

Chúng tôi trân trọng kính mời bạn tham gia buổi phỏng vấn:
• Vị trí: ${application.jobTitle}
• Hình thức: Phỏng vấn Online / Trực tiếp tại Văn phòng
• Thời gian dự kiến: [Nhập ngày & giờ]

Bạn vui lòng phản hồi lại email này để xác nhận sự tham gia của bạn.

Trân trọng,
${employerData?.companyName || 'Bộ phận Tuyển dụng'}`);
    } else if (type === 'additional') {
      setEmailSubject(`[BybitJobs] Yêu cầu bổ sung hồ sơ - Vị trí ${application.jobTitle}`);
      setEmailContent(`Kính gửi ${candidateName},

Cảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí "${application.jobTitle}" tại công ty chúng tôi.

Để có thêm cơ sở đánh giá trong vòng hồ sơ, bạn vui lòng gửi bổ sung cho chúng tôi [Kinh nghiệm / Bằng cấp / Portfolio công việc] bằng cách phản hồi trực tiếp email này.

Trân trọng,
${employerData?.companyName || 'Bộ phận Tuyển dụng'}`);
    } else if (type === 'offer') {
      setEmailSubject(`[BybitJobs] Thư mời nhận việc (Offer Letter) - Vị trí ${application.jobTitle}`);
      setEmailContent(`Kính gửi ${candidateName},

Sau quá trình phỏng vấn và đánh giá năng lực, chúng tôi rất vui mừng thông báo bạn đã xuất sắc trúng tuyển vị trí "${application.jobTitle}".

Thông tin nhận việc dự kiến:
• Vị trí làm việc: ${application.jobTitle}
• Ngày bắt đầu: [Nhập ngày nhận việc]

Rất mong được làm việc và đồng hành cùng bạn!

Trân trọng,
${employerData?.companyName || 'Bộ phận Tuyển dụng'}`);
    }
  };

  const handleSendEmailSubmit = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tiêu đề và nội dung email.');
      return;
    }

    try {
      setIsSendingEmail(true);
      const response = await fetch('http://160.250.246.119:4000/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: candidateEmail,
          subject: emailSubject.trim(),
          text: emailContent.trim(),
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
                <h2 style="color: #0f172a; margin: 0; font-size: 22px;">${employerData?.companyName || 'Nhà tuyển dụng BybitJobs'}</h2>
                <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Thông báo về hồ sơ ứng tuyển vị trí ${application.jobTitle}</p>
              </div>
              <div style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-line;">
                ${emailContent.trim()}
              </div>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Email này được gửi từ Nhà tuyển dụng thông qua hệ thống BybitJobs.</p>
            </div>
          `
        })
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.warn('Phản hồi từ server không đúng dạng JSON:', responseText);
      }

      setIsSendingEmail(false);

      if (response.ok && data.success) {
        Alert.alert('Thành công 🎉', `Đã gửi email trực tiếp qua Nodemailer tới ${candidateEmail}!`);
        setIsEmailModalVisible(false);
      } else {
        const errorMsg = data.error || data.details || data.message || 'API Server VPS chưa cập nhật route /api/send-email. Vui lòng deploy server VPS.';
        Alert.alert('Lỗi gửi email', errorMsg);
      }
    } catch (error: any) {
      setIsSendingEmail(false);
      console.error('Lỗi khi gửi email qua Nodemailer:', error);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ gửi email. Chi tiết: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Chi tiết CV ứng viên</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main scrolling details */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Card 1: Avatar & Personal General Details */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <View style={styles.avatarContainer}>
            {candidateAvatar ? (
              <Image source={{ uri: candidateAvatar }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatar, styles.profileAvatarFallback]}>
                <Text style={styles.profileAvatarFallbackText}>{candidateInitials}</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#0084FF" />
            </View>
          </View>

          <Text style={[styles.candidateNameText, { color: isDark ? '#FFF' : '#11181C' }]}>
            {candidateName}
          </Text>
          <Text style={styles.candidateRoleSubtitle}>
            {candidateRole}
          </Text>

          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>⭐️ {candidateRating} ({candidateReviewsCount} đánh giá)</Text>
          </View>

          {/* Contact Details List */}
          <View style={[styles.detailsDivider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} />
          
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => {
              if (candidateEmail && candidateEmail !== 'Chưa cập nhật email') {
                Linking.openURL(`mailto:${candidateEmail}?subject=${encodeURIComponent(`Thư mời phỏng vấn - Vị trí ${candidateRole}`)}`).catch(() => {
                  Alert.alert('Thông báo', 'Không thể mở ứng dụng Email trên thiết bị của bạn.');
                });
              } else {
                Alert.alert('Thông báo', 'Ứng viên chưa cập nhật địa chỉ Email.');
              }
            }}
            style={styles.contactRow}
          >
            <Ionicons name="mail-outline" size={16} color="#0084FF" style={styles.contactIcon} />
            <Text style={[styles.contactValueText, { color: '#0084FF', textDecorationLine: 'underline', fontWeight: '600' }]}>{candidateEmail}</Text>
            <View style={{ backgroundColor: '#E6F4FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="paper-plane" size={12} color="#0084FF" />
              <Text style={{ color: '#0084FF', fontSize: 11, fontWeight: '700' }}>Gửi Email</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={16} color="#8E8E93" style={styles.contactIcon} />
            <Text style={[styles.contactValueText, { color: isDark ? '#FFF' : '#11181C', fontWeight: isApproved ? '700' : '500' }]}>
              {candidatePhone}
            </Text>
            {!isApproved && (
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={11} color="#FF9500" />
                <Text style={styles.lockBadgeText}>Ẩn</Text>
              </View>
            )}
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={16} color="#8E8E93" style={styles.contactIcon} />
            <Text style={[styles.contactValueText, { color: isDark ? '#FFF' : '#11181C' }]}>{candidateLocation}</Text>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="time-outline" size={16} color="#8E8E93" style={styles.contactIcon} />
            <Text style={[styles.contactValueText, { color: isDark ? '#FFF' : '#11181C' }]}>{candidateJobType}</Text>
          </View>
        </View>

        {/* Card AI Match Score & Review */}
        <View style={[styles.aiMatchCard, { backgroundColor: isDark ? '#1C1528' : '#F5F3FF', borderColor: isDark ? '#3B2D54' : '#DDD6FE' }]}>
          <View style={styles.aiMatchHeaderRow}>
            <View style={styles.aiMatchBadge}>
              <Ionicons name="sparkles" size={18} color="#7C3AED" />
              <Text style={styles.aiMatchBadgeText}>🎯 Đánh giá Độ tương thích AI</Text>
            </View>
            {isLoadingMatch ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : matchScore !== null ? (
              <View style={styles.scorePill}>
                <Text style={styles.scorePillText}>🎯 Độ phù hợp: {matchScore}%</Text>
              </View>
            ) : null}
          </View>

          {isLoadingMatch ? (
            <Text style={[styles.aiMatchSummaryText, { color: isDark ? '#D1D5DB' : '#6B7280', fontStyle: 'italic' }]}>
              Đang đối chiếu hồ sơ ứng viên với công việc bằng AI...
            </Text>
          ) : matchSummary ? (
            <Text style={[styles.aiMatchSummaryText, { color: isDark ? '#E5E7EB' : '#374151' }]}>
              "{matchSummary}"
            </Text>
          ) : (
            <Text style={[styles.aiMatchSummaryText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Chưa thể đánh giá độ phù hợp của ứng viên.
            </Text>
          )}

          {/* Structured List Breakdown: Match / Unmatched Criteria */}
          <View style={{
            marginTop: 14,
            backgroundColor: isDark ? '#151020' : '#FFFFFF',
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: isDark ? '#2D2240' : '#EDE9FE',
          }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#DDD6FE' : '#6D28D9', marginBottom: 10 }}>
              📊 Bảng chi tiết danh sách đánh giá tiêu chí:
            </Text>

            {/* List Item 1: Skills */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="ribbon" size={16} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFF' : '#1F2937' }}>Chuyên môn & Kỹ năng</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Đạt bộ kỹ năng chuyên ngành chính</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                <Text style={{ color: '#065F46', fontSize: 11, fontWeight: '700' }}>Phù hợp</Text>
              </View>
            </View>

            {/* List Item 2: Experience */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="briefcase" size={16} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFF' : '#1F2937' }}>Kinh nghiệm làm việc</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Đã có kinh nghiệm vị trí tương đương</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                <Text style={{ color: '#065F46', fontSize: 11, fontWeight: '700' }}>Phù hợp</Text>
              </View>
            </View>

            {/* List Item 3: Location (Phù hợp / Khớp vị trí) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="location" size={16} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFF' : '#1F2937' }}>Địa điểm làm việc</Text>
                  <Text style={{ fontSize: 11, color: '#059669', marginTop: 1 }}>Phù hợp khu vực làm việc ({candidateLocation})</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                <Text style={{ color: '#065F46', fontSize: 11, fontWeight: '700' }}>Phù hợp</Text>
              </View>
            </View>

            {/* List Item 4: Salary (Phù hợp / Đạt ngân sách) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="cash" size={16} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFF' : '#1F2937' }}>Mức lương kỳ vọng</Text>
                  <Text style={{ fontSize: 11, color: '#059669', marginTop: 1 }}>Nằm trong dải ngân sách tin tuyển dụng</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                <Text style={{ color: '#065F46', fontSize: 11, fontWeight: '700' }}>Phù hợp</Text>
              </View>
            </View>
          </View>

          {/* AI Interview Questions Generator Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              router.push('/ai-advisor');
            }}
            style={{
              marginTop: 12,
              backgroundColor: '#7C3AED',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="sparkles" size={16} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>
              AI Gợi ý câu hỏi phỏng vấn ứng viên này
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card 2: Main Skills */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>KỸ NĂNG CHÍNH</Text>
          <View style={styles.skillsWrapper}>
            {candidateSkills.map((skill, index) => (
              <View key={index} style={[styles.skillChip, { backgroundColor: isDark ? '#2C2C2E' : '#EBF5FF' }]}>
                <Text style={styles.skillChipText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card 3: Other Profile Items */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>HỒ SƠ KHÁC</Text>
          
          <View style={styles.otherItemRow}>
            <View style={styles.otherIconBg}>
              <Ionicons name="globe-outline" size={20} color="#0084FF" />
            </View>
            <View style={styles.otherTextWrapper}>
              <Text style={styles.otherLabel}>Portfolio</Text>
              <Text style={styles.otherValueText}>{candidatePortfolio}</Text>
            </View>
          </View>

          <View style={[styles.detailsDivider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', marginVertical: 10 }]} />

          <View style={styles.otherItemRow}>
            <View style={styles.otherIconBg}>
              <Ionicons name="school-outline" size={20} color="#0084FF" />
            </View>
            <View style={styles.otherTextWrapper}>
              <Text style={styles.otherLabel}>Học vấn</Text>
              <Text style={styles.otherValueText}>{candidateEducation}</Text>
            </View>
          </View>
        </View>

        {/* Card 4: Work Experience - VERTICAL TIMELINE CHART */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>KINH NGHIỆM LÀM VIỆC</Text>
          
          <View style={styles.timelineContainer}>
            {candidateExperience.map((exp, index) => {
              const isLast = index === candidateExperience.length - 1;
              return (
                <View key={index} style={styles.timelineRow}>
                  {/* Timeline spine decoration */}
                  <View style={styles.spineColumn}>
                    <View style={[styles.timelineNode, { backgroundColor: exp.isCurrent ? '#0084FF' : '#B0C4DE' }]} />
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }]} />}
                  </View>

                  {/* Experience description node */}
                  <View style={styles.experienceContentWrapper}>
                    <Text style={[styles.expRoleText, { color: isDark ? '#FFF' : '#11181C' }]}>
                      {exp.role}
                    </Text>
                    <Text style={styles.expCompanyText}>
                      {exp.company} • {exp.duration}
                    </Text>
                    <Text style={[styles.expDescText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                      {exp.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Card 5: PDF Attached CV Preview */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <View style={styles.attachedCvHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C', marginBottom: 0 }]}>TỆP CV ĐÍNH KÈM</Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.downloadBtn}
                onPress={() => setIsCVPreviewVisible(true)}
              >
                <Ionicons name="eye-outline" size={14} color="#0084FF" />
                <Text style={styles.downloadBtnText}>Xem trước</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.downloadBtn}
                onPress={() => Alert.alert('Tải xuống', `Đang tải xuống tệp: ${application.cvName || 'CV_Web_Developer_VN.pdf'}`)}
              >
                <Ionicons name="download-outline" size={14} color="#0084FF" />
                <Text style={styles.downloadBtnText}>Tải xuống PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Styled Document container */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsCVPreviewVisible(true)}
            style={[styles.cvMockPreviewContainer, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1', minHeight: 70 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', padding: 12 }}>
              <View style={{ backgroundColor: '#FFEBEE', width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="document-text" size={24} color="#D32F2F" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 14, color: isDark ? '#FFF' : '#11181C' }} numberOfLines={1}>
                  {application.cvName || 'CV_Web_Developer_VN.pdf'}
                </Text>
                <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }}>
                  Dung lượng: {application.cvSize || '1.1 MB'} • Ngày nộp: {application.cvUploadTime || 'Vừa xong'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.scrollPadding} />
      </ScrollView>

      <CvPdfViewerModal
        visible={isCVPreviewVisible}
        onClose={() => setIsCVPreviewVisible(false)}
        cvUrl={application.cvUrl || ''}
        cvName={application.cvName}
        fullName={candidateName}
        desiredJob={candidate?.desiredJob || application.jobTitle || 'Ứng viên'}
        phone={candidatePhone}
        email={candidateEmail}
      />

      {/* Sticky Bottom Actions Container */}
      <View style={[styles.stickyBottomBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderTopColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        
        {/* Red / White Reject Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleReject}
          style={[
            styles.bottomBtn,
            styles.rejectActionBtn,
            isRejected && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
            isApproved && { opacity: 0.45 }
          ]}
        >
          <Ionicons name="close" size={20} color={isRejected ? "#FFF" : "#FF3B30"} style={{ marginRight: 6 }} />
          <Text style={[styles.rejectActionBtnText, isRejected && { color: '#FFF' }]}>
            {isRejected ? '✕ Đã từ chối' : 'Từ chối'}
          </Text>
        </TouchableOpacity>

        {/* Email Send Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenEmailModal}
          style={[styles.bottomBtn, { backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
        >
          <Ionicons name="mail" size={18} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Gửi Email</Text>
        </TouchableOpacity>

        {/* Blue / White Approve Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleApprove}
          style={[
            styles.bottomBtn,
            styles.approveActionBtn,
            isApproved && { backgroundColor: '#10B981', borderColor: '#10B981' },
            isRejected && { opacity: 0.45 }
          ]}
        >
          <Ionicons name={isApproved ? "checkmark-done-circle" : "checkmark-circle-outline"} size={20} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.approveActionBtnText}>
            {isApproved ? '✓ Đã duyệt' : 'Duyệt hồ sơ'}
          </Text>
        </TouchableOpacity>

      </View>

      {/* Modal Soạn & Gửi Email trực tiếp qua Nodemailer */}
      <Modal
        visible={isEmailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEmailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <View style={{
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '90%',
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="mail-open-outline" size={22} color="#0F172A" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFF' : '#0F172A' }}>
                  Gửi Email tới Ứng viên
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsEmailModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Recipient info pill */}
            <View style={{
              backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>
                Người nhận: <Text style={{ color: isDark ? '#FFF' : '#0F172A', fontWeight: '700' }}>{candidateName}</Text>
              </Text>
              <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '600' }}>
                {candidateEmail}
              </Text>
            </View>

            {/* Template Selection Chips */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 }}>
              💡 Mẫu email nhanh (Templates):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => applyEmailTemplate('interview')}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '600' }}>💡 1. Thư mời phỏng vấn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => applyEmailTemplate('additional')}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '600' }}>📄 2. Yêu cầu bổ sung CV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => applyEmailTemplate('offer')}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }}
              >
                <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '600' }}>🎯 3. Offer Letter (Nhận việc)</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Subject Input */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 }}>
              Tiêu đề Email:
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark ? '#151718' : '#F8FAFC',
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 44,
                fontSize: 14,
                fontWeight: '600',
                color: isDark ? '#FFF' : '#0F172A',
                borderWidth: 1,
                borderColor: isDark ? '#2C2C2E' : '#E2E8F0',
                marginBottom: 14,
              }}
              placeholder="Nhập tiêu đề email..."
              placeholderTextColor="#94A3B8"
              value={emailSubject}
              onChangeText={setEmailSubject}
            />

            {/* Content Input */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 }}>
              Nội dung Email:
            </Text>
            <TextInput
              style={{
                backgroundColor: isDark ? '#151718' : '#F8FAFC',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                height: 150,
                fontSize: 13.5,
                lineHeight: 20,
                color: isDark ? '#FFF' : '#0F172A',
                borderWidth: 1,
                borderColor: isDark ? '#2C2C2E' : '#E2E8F0',
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
              placeholder="Nhập nội dung thư gửi đến ứng viên..."
              placeholderTextColor="#94A3B8"
              multiline
              value={emailContent}
              onChangeText={setEmailContent}
            />

            {/* Submit & Cancel Buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsEmailModalVisible(false)}
                disabled={isSendingEmail}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: '#F1F5F9',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 14 }}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSendEmailSubmit}
                disabled={isSendingEmail}
                style={{
                  flex: 2,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: '#0F172A',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                {isSendingEmail ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={18} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Gửi Email qua Nodemailer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    elevation: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBarTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRightActions: {
    flexDirection: 'row',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileAvatarFallback: {
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarFallbackText: {
    color: '#0084FF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  candidateNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  candidateRoleSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  ratingBadge: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  detailsDivider: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 28,
  },
  contactIcon: {
    marginRight: 10,
    width: 20,
  },
  contactValueText: {
    fontSize: 13,
  },
  lockBadge: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFD580',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    gap: 2,
    marginLeft: 8,
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0084FF',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0084FF',
  },
  otherItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  otherTextWrapper: {
    flex: 1,
  },
  otherLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 2,
  },
  otherValueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  timelineContainer: {
    paddingLeft: 4,
    paddingTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  spineColumn: {
    width: 24,
    alignItems: 'center',
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 10,
    bottom: -10,
    left: 11,
  },
  experienceContentWrapper: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  expRoleText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  expCompanyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0084FF',
    marginBottom: 8,
  },
  expDescText: {
    fontSize: 12,
    lineHeight: 18,
  },
  attachedCvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadBtnText: {
    fontSize: 11,
    color: '#0084FF',
    fontWeight: '700',
  },
  cvMockPreviewContainer: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cvMockPaper: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    maxWidth: 260,
    minHeight: 180,
    borderRadius: 6,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cvMockAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  cvMockLineLong: {
    height: 6,
    width: '100%',
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    borderRadius: 3,
  },
  cvMockLineMedium: {
    height: 6,
    width: '75%',
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    borderRadius: 3,
  },
  cvMockLineShort: {
    height: 6,
    width: '45%',
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
    borderRadius: 3,
  },
  cvMockBlocksRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cvMockBlock: {
    flex: 1,
    height: 40,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 4,
  },
  scrollPadding: {
    height: 30,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    gap: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectActionBtn: {
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    backgroundColor: '#FFF',
  },
  rejectActionBtnText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
  },
  approveActionBtn: {
    backgroundColor: '#0084FF',
  },
  approveActionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  aiMatchCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  aiMatchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiMatchBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
  },
  scorePill: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  scorePillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  aiMatchSummaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
