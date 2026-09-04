import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth, canPostJob } from '@/hooks/use-auth';
import { db } from '@/src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function RecruiterEditJobScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { jobs, addJob, updateJob, userData, employerData } = useAuth();

  const isNew = !id || id === 'new';
  const existingJob = jobs.find((j) => j.id === id);
  const [industryOptions, setIndustryOptions] = React.useState<string[]>(['Công nghệ thông tin', 'Khác']);

  React.useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const snap = await getDocs(collection(db, 'industries'));
        const options: string[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          if (data.status === 'Active') {
            options.push(data.name);
          }
        });
        if (options.length > 0) {
          setIndustryOptions(options);
        }
      } catch (e) {
        console.error('Error fetching industries', e);
      }
    };
    fetchIndustries();
  }, []);

  // States
  const [title, setTitle] = React.useState(existingJob?.title || '');
  const [industry, setIndustry] = React.useState(existingJob?.industry || 'Công nghệ thông tin');
  const [salary, setSalary] = React.useState(existingJob?.salary || 'Thỏa thuận');
  const [location, setLocation] = React.useState(existingJob?.location || '');
  const [experience, setExperience] = React.useState((existingJob as any)?.experience || 'Không yêu cầu kinh nghiệm');
  const [description, setDescription] = React.useState(existingJob?.description || '');
  const [requirements, setRequirements] = React.useState(existingJob?.requirements || '');
  const getThirtyDaysFromNow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  };

  const formatDeadlineDate = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const [deadline, setDeadline] = React.useState(() => {
    if (existingJob?.deadline) return existingJob.deadline;
    return formatDeadlineDate(getThirtyDaysFromNow());
  });

  const [isOpen, setIsOpen] = React.useState(existingJob ? existingJob.isOpen : true);
  const [isIndustryModalVisible, setIsIndustryModalVisible] = React.useState(false);
  const [selectedIndustries, setSelectedIndustries] = React.useState<string[]>(() => {
    const values = (existingJob?.industry || 'Công nghệ thông tin')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return values.length ? values : ['Công nghệ thông tin'];
  });

  const [isGeneratingJD, setIsGeneratingJD] = React.useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = React.useState(false);

  const handleGenerateAIJD = async () => {
    if (!title.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề công việc trước khi dùng AI tạo mô tả.');
      return;
    }

    setIsGeneratingJD(true);
    try {
      const response = await fetch('http://160.250.246.119:4000/api/ai/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, industry, salary, location }),
      });

      if (!response.ok) {
        throw new Error('Không thể kết nối đến máy chủ AI');
      }

      const result = await response.json();
      if (result.success) {
        if (result.description) setDescription(result.description);
        if (result.requirements) setRequirements(result.requirements);
        Alert.alert('✨ Thành công', 'AI đã tự động soạn thảo Mô tả & Yêu cầu công việc cho bạn!');
      } else {
        throw new Error(result.error || 'Lỗi tạo JD từ AI');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo mô tả công việc bằng AI.');
    } finally {
      setIsGeneratingJD(false);
    }
  };

  const parseDateString = (dateStr?: string): Date => {
    if (!dateStr) return getThirtyDaysFromNow();
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(p1) && !isNaN(p2) && !isNaN(y)) {
          // Định dạng chuẩn của app là DD/MM/YYYY: p1 là Ngày, p2 là Tháng
          let day = p1;
          let month = p2;
          if (p1 <= 12 && p2 > 12) {
            // Định dạng dự phòng nếu là MM/DD/YYYY
            day = p2;
            month = p1;
          }
          // Đảm bảo tháng luôn trong phạm vi 1 - 12
          const validMonth = Math.max(0, Math.min(11, month - 1));
          return new Date(y, validMonth, day);
        }
      }
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? getThirtyDaysFromNow() : parsed;
  };

  // Date Picker Modal States
  const [isDatePickerVisible, setIsDatePickerVisible] = React.useState(false);
  const [pickerDate, setPickerDate] = React.useState(() => parseDateString(existingJob?.deadline));
  
  const [activeMonth, setActiveMonth] = React.useState(() => pickerDate.getMonth());
  const [activeYear, setActiveYear] = React.useState(() => pickerDate.getFullYear());

  const selectDate = (date: Date) => {
    setDeadline(formatDeadlineDate(date));
    setPickerDate(date);
    setActiveMonth(date.getMonth());
    setActiveYear(date.getFullYear());
    setIsDatePickerVisible(false);
  };

  const renderDaysGrid = () => {
    const days = [];
    const firstDayIndex = new Date(activeYear, activeMonth, 1).getDay();
    const totalDays = new Date(activeYear, activeMonth + 1, 0).getDate();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayGridCellEmpty} />
      );
    }

    for (let i = 1; i <= totalDays; i++) {
      const cellDate = new Date(activeYear, activeMonth, i);
      const cellDateStart = new Date(activeYear, activeMonth, i);
      cellDateStart.setHours(0, 0, 0, 0);
      
      const isPast = cellDateStart.getTime() < todayStart.getTime();

      const isSelected = 
        pickerDate.getDate() === i && 
        pickerDate.getMonth() === activeMonth && 
        pickerDate.getFullYear() === activeYear;
      
      const isToday = 
        new Date().getDate() === i && 
        new Date().getMonth() === activeMonth && 
        new Date().getFullYear() === activeYear;

      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          activeOpacity={0.7}
          disabled={isPast}
          onPress={() => selectDate(cellDate)}
          style={[
            styles.dayGridCell,
            isToday && styles.todayGridCell,
            isSelected && styles.selectedGridCell,
            isPast && { opacity: 0.35 },
          ]}
        >
          <Text
            style={[
              styles.dayText,
              { color: isDark ? '#FFF' : '#11181C' },
              isToday && { color: '#0084FF', fontWeight: 'bold' },
              isSelected && { color: '#FFF', fontWeight: 'bold' },
              isPast && { color: isDark ? '#6B7280' : '#9CA3AF' },
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const toggleIndustry = (value: string) => {
    setSelectedIndustries((current) => {
      if (current.includes(value)) {
        return current.length === 1 ? current : current.filter((item) => item !== value);
      }
      return [...current, value];
    });
  };

  const applyIndustries = () => {
    const nextIndustry = selectedIndustries.join(', ');
    setIndustry(nextIndustry || 'Công nghệ thông tin');
    setIsIndustryModalVisible(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Cảnh báo', 'Tiêu đề công việc không được để trống.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Cảnh báo', 'Địa điểm không được để trống.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Cảnh báo', 'Mô tả công việc không được để trống.');
      return;
    }

    // Kiểm tra tính hợp lệ của hạn nộp hồ sơ (Không được chọn ngày trong quá khứ)
    if (deadline && checkIsJobExpired(deadline)) {
      Alert.alert(
        'Hạn nộp hồ sơ không hợp lệ',
        'Hạn chót ứng tuyển không được ở trong quá khứ. Vui lòng chọn một ngày từ hôm nay trở đi.'
      );
      return;
    }

    // Kiểm tra giới hạn số lượng tin tuyển dụng được phép đăng theo gói dịch vụ đang sở hữu
    if (isNew) {
      const recruiterActiveJobsCount = jobs.filter((j) => j.employerId === userData?.uid && j.isOpen).length;
      const check = canPostJob(employerData, recruiterActiveJobsCount);
      if (!check.allowed) {
        Alert.alert(
          'Đạt Giới Hạn Đăng Tin',
          `${check.reason}\n\nBạn có muốn chuyển tới trang Nâng cấp dịch vụ ngay bây giờ không?`,
          [
            { text: 'Để sau', style: 'cancel' },
            { text: 'Nâng cấp ngay', onPress: () => router.push('/recruiter/pricing') }
          ]
        );
        return;
      }
    }

    const jobData = {
      title,
      industry,
      salary,
      location,
      experience,
      description,
      requirements,
      deadline,
      isOpen,
    };

    if (isNew) {
      const success = await addJob(jobData);
      if (success) {
        Alert.alert('Đã gửi duyệt', 'Tin tuyển dụng đã được gửi lên Admin. Bài đăng sẽ hiển thị sau khi được duyệt.', [
          {
            text: 'Đồng ý',
            onPress: () => {
              router.replace('/recruiter/jobs');
            },
          },
        ]);
      }
    } else {
      updateJob(id as string, { ...jobData, status: 'Chờ duyệt' });
      Alert.alert('Đã gửi duyệt lại', 'Tin tuyển dụng đã được cập nhật và đang chờ Admin duyệt lại trước khi hiển thị.', [
        {
          text: 'Đồng ý',
          onPress: () => {
            router.replace('/recruiter/jobs');
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8F9FA' }]} edges={['top']}>
      <View style={styles.headerBg} />

      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>
          {isNew ? 'Đăng tin tuyển dụng' : 'Chỉnh sửa bài đăng'}
        </Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.textBtn} onPress={handleSave}>
          <Text style={styles.textBtnText}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Card Wrapper */}
          <View style={[styles.formCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
            
            {/* Input: Job Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>TIÊU ĐỀ CÔNG VIỆC</Text>
              <View style={[styles.inputBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Ví dụ: Lập trình viên React Native"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Quick Title Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {[
                  'Lập trình viên React Native',
                  'Lập trình viên Fullstack / Web',
                  'UI/UX Designer',
                  'Chuyên viên Marketing & Content',
                  'Nhân viên CSKH / Telesales',
                  'Thực tập sinh IT (Internship)',
                ].map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.8}
                    onPress={() => setTitle(item)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: title === item ? '#0084FF' : (isDark ? '#2C2C2E' : '#F1F5F9'),
                      borderWidth: 1,
                      borderColor: title === item ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: title === item ? '#FFF' : (isDark ? '#CBD5E1' : '#475569') }}>
                      + {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input: Industry */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>NGÀNH NGHỀ</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsIndustryModalVisible(true)}
                style={[styles.dropdownBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}
              >
                <Text style={[styles.dropdownValue, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                  {industry}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#8E8E93" />
              </TouchableOpacity>
              <View style={styles.industryChipRow}>
                {selectedIndustries.slice(0, 3).map((item) => (
                  <View key={item} style={[styles.industryChip, { backgroundColor: isDark ? '#102A43' : '#E6F4FE' }]}>
                    <Text style={styles.industryChipText} numberOfLines={1}>{item}</Text>
                  </View>
                ))}
                {selectedIndustries.length > 3 && (
                  <View style={[styles.industryChip, { backgroundColor: isDark ? '#2C2C2E' : '#EEF2F7' }]}>
                    <Text style={[styles.industryChipText, { color: isDark ? '#D1D5DB' : '#687076' }]}>
                      +{selectedIndustries.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Input: Salary */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>MỨC LƯƠNG</Text>
              <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                <Ionicons name="cash-outline" size={18} color="#8E8E93" style={styles.fieldIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Thỏa thuận, 15-20 triệu, 300k/ngày..."
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={salary}
                  onChangeText={setSalary}
                />
              </View>

              {/* Quick Salary Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {[
                  'Thỏa thuận trực tiếp',
                  '10 - 15 Triệu/tháng',
                  '15 - 25 Triệu/tháng',
                  'Trên 25 Triệu/tháng',
                  '300k/ngày',
                  '25k - 35k/giờ (Part-time)',
                ].map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.8}
                    onPress={() => setSalary(item)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: salary === item ? '#0084FF' : (isDark ? '#2C2C2E' : '#F1F5F9'),
                      borderWidth: 1,
                      borderColor: salary === item ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: salary === item ? '#FFF' : (isDark ? '#CBD5E1' : '#475569') }}>
                      💵 {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input: Location */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C', marginBottom: 0 }]}>ĐỊA ĐIỂM</Text>
                {(employerData?.address || (userData as any)?.address) && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setLocation(employerData?.address || (userData as any)?.address || '')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="location" size={13} color="#0084FF" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#0084FF' }}>Lấy địa chỉ công ty</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                <Ionicons name="location-outline" size={18} color="#8E8E93" style={styles.fieldIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Ví dụ: Quận 7, TP. Hồ Chí Minh"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              {/* Quick Location Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {[
                  'TP. Hồ Chí Minh',
                  'Hà Nội',
                  'Đà Nẵng',
                  'Làm việc từ xa (Remote / WFH)',
                  'Quận 7, TP.HCM',
                  'Quận Cầu Giấy, Hà Nội',
                ].map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.8}
                    onPress={() => setLocation(item)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: location === item ? '#0084FF' : (isDark ? '#2C2C2E' : '#F1F5F9'),
                      borderWidth: 1,
                      borderColor: location === item ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: location === item ? '#FFF' : (isDark ? '#CBD5E1' : '#475569') }}>
                      📍 {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input: Experience */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>YÊU CẦU KINH NGHIỆM</Text>
              <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                <Ionicons name="star-outline" size={18} color="#8E8E93" style={styles.fieldIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Ví dụ: Không yêu cầu, 1-2 năm kinh nghiệm..."
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={experience}
                  onChangeText={setExperience}
                />
              </View>

              {/* Quick Experience Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {[
                  'Không yêu cầu kinh nghiệm',
                  'Dưới 1 năm / Fresher',
                  '1 - 2 năm kinh nghiệm',
                  '2 - 5 năm kinh nghiệm',
                  'Trên 5 năm (Senior)',
                  'Theo chi tiết yêu cầu',
                ].map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.8}
                    onPress={() => setExperience(item)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: experience === item ? '#0084FF' : (isDark ? '#2C2C2E' : '#F1F5F9'),
                      borderWidth: 1,
                      borderColor: experience === item ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: experience === item ? '#FFF' : (isDark ? '#CBD5E1' : '#475569') }}>
                      ⭐ {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input: Description */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C', marginBottom: 0 }]}>MÔ TẢ CÔNG VIỆC</Text>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!title.trim()) {
                        Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề công việc để xem trước.');
                        return;
                      }
                      setIsPreviewModalVisible(true);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? '#2C2C2E' : '#EBF5FF',
                      borderColor: '#0084FF',
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 16,
                      gap: 4
                    }}
                  >
                    <Ionicons name="eye-outline" size={13} color="#0084FF" />
                    <Text style={{ color: '#0084FF', fontSize: 11, fontWeight: '600' }}>Xem trước</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleGenerateAIJD}
                    disabled={isGeneratingJD}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#7C3AED',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      gap: 6
                    }}
                  >
                    {isGeneratingJD ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={14} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>AI soạn mô tả</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.textareaBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                <TextInput
                  style={[styles.textarea, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Nhập mô tả chi tiết công việc..."
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={description}
                  onChangeText={setDescription}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Input: Requirements */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>YÊU CẦU</Text>
              <View style={[styles.textareaBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                <TextInput
                  style={[styles.textarea, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Ví dụ: Có ít nhất 1 năm kinh nghiệm..."
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={requirements}
                  onChangeText={setRequirements}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Quick Requirement Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {[
                  'Không yêu cầu kinh nghiệm',
                  'Tối thiểu 1 năm kinh nghiệm',
                  'Tốt nghiệp Đại học / Cao đẳng',
                  'Tinh thần trách nhiệm & chủ động',
                  'Giao tiếp tốt, làm việc nhóm tốt',
                ].map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (requirements.includes(item)) return;
                      setRequirements((prev) => (prev ? `${prev}\n• ${item}` : `• ${item}`));
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isDark ? '#3A3D40' : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#CBD5E1' : '#475569' }}>
                      + {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input: Deadline */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>HẠN ỨNG TUYỂN</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const targetDate = parseDateString(deadline);
                  setPickerDate(targetDate);
                  setActiveMonth(targetDate.getMonth());
                  setActiveYear(targetDate.getFullYear());
                  setIsDatePickerVisible(true);
                }}
                style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}
              >
                <Ionicons name="calendar-outline" size={18} color="#8E8E93" style={styles.fieldIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Ví dụ: 11/30/2026"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={deadline}
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
            </View>

            {/* Bottom divider line */}
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }]} />

            {/* Switch Toggle: Job active/inactive status */}
            <View style={styles.statusToggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.statusToggleTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Trạng thái bài đăng
                </Text>
                <Text style={styles.statusToggleDesc}>
                  Bật để cho phép ứng viên nộp hồ sơ, tắt để tạm dừng hiển thị.
                </Text>
              </View>
              <View style={styles.switchWrapper}>
                <Switch
                  trackColor={{ false: '#767577', true: '#0084FF' }}
                  thumbColor={isOpen ? '#FFF' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={setIsOpen}
                  value={isOpen}
                />
                <Text style={[styles.switchLabel, { color: isOpen ? '#0084FF' : '#8E8E93' }]}>
                  {isOpen ? 'Đang Mở' : 'Đã Đóng'}
                </Text>
              </View>
            </View>

            {/* Bottom Actions CTA buttons */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              style={styles.submitButton}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.submitButtonText}>
                {isNew ? 'Đăng bài ngay' : 'Cập nhật bài đăng'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={[styles.cancelButton, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}
            >
              <Text style={[styles.cancelButtonText, { color: isDark ? '#FFF' : '#11181C' }]}>
                Hủy bỏ
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isIndustryModalVisible}
        onRequestClose={() => setIsIndustryModalVisible(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.industrySheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.industrySheetHeader}>
              <View style={styles.industrySheetTitleWrap}>
                <Text style={[styles.industrySheetTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Chọn ngành nghề
                </Text>
                <Text style={styles.industrySheetSubtitle}>
                  Có thể chọn nhiều ngành phù hợp với tin tuyển dụng.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsIndustryModalVisible(false)}
                style={[styles.sheetCloseBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F4F7' }]}
              >
                <Ionicons name="close" size={20} color={isDark ? '#FFF' : '#11181C'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.industryOptionsContent}>
              {industryOptions.map((item) => {
                const checked = selectedIndustries.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.75}
                    onPress={() => toggleIndustry(item)}
                    style={[
                      styles.industryOption,
                      {
                        backgroundColor: checked
                          ? (isDark ? '#0B2C4D' : '#E6F4FE')
                          : (isDark ? '#151718' : '#F8FAFC'),
                        borderColor: checked ? '#0084FF' : (isDark ? '#2C2C2E' : '#E5E7EB'),
                      },
                    ]}
                  >
                    <View style={[styles.industryCheckBox, checked && styles.industryCheckBoxActive]}>
                      {checked && <Ionicons name="checkmark" size={15} color="#FFF" />}
                    </View>
                    <Text style={[styles.industryOptionText, { color: isDark ? '#FFF' : '#11181C' }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity activeOpacity={0.85} onPress={applyIndustries} style={styles.applyIndustryBtn}>
              <Text style={styles.applyIndustryBtnText}>Áp dụng ngành nghề</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isDatePickerVisible}
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.datePickerContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            {/* Header */}
            <View style={[styles.pickerHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <Text style={[styles.pickerTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Chọn Hạn Ứng Tuyển</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsDatePickerVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#9BA1A6' : '#687076'} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Selectors */}
            <View style={styles.monthYearSelectorRow}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => {
                  if (activeMonth === 0) {
                    setActiveMonth(11);
                    setActiveYear(prev => prev - 1);
                  } else {
                    setActiveMonth(prev => prev - 1);
                  }
                }}
                style={styles.navArrow}
              >
                <Ionicons name="chevron-back" size={20} color="#0084FF" />
              </TouchableOpacity>
              
              <Text style={[styles.monthYearText, { color: isDark ? '#FFF' : '#11181C' }]}>
                {`Tháng ${activeMonth + 1}, ${activeYear}`}
              </Text>

              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => {
                  if (activeMonth === 11) {
                    setActiveMonth(0);
                    setActiveYear(prev => prev + 1);
                  } else {
                    setActiveMonth(prev => prev + 1);
                  }
                }}
                style={styles.navArrow}
              >
                <Ionicons name="chevron-forward" size={20} color="#0084FF" />
              </TouchableOpacity>
            </View>

            {/* Days of Week Header */}
            <View style={styles.daysOfWeekRow}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                <Text key={idx} style={[styles.dayOfWeekText, { color: idx === 0 ? '#FF3B30' : '#8E8E93' }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {renderDaysGrid()}
            </View>

            {/* Quick Presets */}
            <View style={styles.quickPresetsRow}>
              {[
                { label: '+7 Ngày', days: 7 },
                { label: '+14 Ngày', days: 14 },
                { label: '+30 Ngày', days: 30 },
              ].map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + preset.days);
                    selectDate(d);
                  }}
                  style={[styles.presetBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
                >
                  <Text style={[styles.presetBtnText, { color: '#0084FF' }]}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Scrollable Job Post Preview Modal */}
      <Modal
        visible={isPreviewModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsPreviewModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#151718' : '#F4F5F7' }}>
          {/* Header Bar */}
          <View style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            backgroundColor: isDark ? '#1E2022' : '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#2C2E30' : '#E2E8F0',
          }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsPreviewModalVisible(false)}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#2C2E30' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name="close" size={20} color={isDark ? '#FFF' : '#11181C'} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFF' : '#11181C' }}>
              👀 Xem Trước Tin Đăng
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Scrollable Preview Content */}
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          >
            {/* Header Card */}
            <View style={{
              backgroundColor: isDark ? '#1C2A3A' : '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? '#2C3E50' : '#E2E8F0',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#0084FF',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>
                    {((userData as any)?.companyName || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: isDark ? '#9BA1A6' : '#64748B', fontWeight: '600' }}>
                    {(userData as any)?.companyName || 'Doanh nghiệp tuyển dụng'}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: isDark ? '#FFF' : '#0F172A', marginTop: 2, lineHeight: 24 }}>
                    {title || 'Tiêu đề công việc'}
                  </Text>
                </View>
              </View>

              {/* Tags / Badges */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2C2C2E' : '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 }}>
                  <Ionicons name="cash-outline" size={14} color="#10B981" />
                  <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>{salary || 'Thỏa thuận'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2C2C2E' : '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 }}>
                  <Ionicons name="location-outline" size={14} color="#3B82F6" />
                  <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '600' }}>{location || 'Toàn quốc'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2C2C2E' : '#F5F3FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 }}>
                  <Ionicons name="briefcase-outline" size={14} color="#8B5CF6" />
                  <Text style={{ color: '#8B5CF6', fontSize: 12, fontWeight: '600' }}>{industry || 'Khác'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2C2C2E' : '#FFF7ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 }}>
                  <Ionicons name="time-outline" size={14} color="#F97316" />
                  <Text style={{ color: '#F97316', fontSize: 12, fontWeight: '600' }}>Hạn chót: {deadline || '30 ngày'}</Text>
                </View>
              </View>
            </View>

            {/* Description Section */}
            <View style={{
              backgroundColor: isDark ? '#1C2A3A' : '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? '#2C3E50' : '#E2E8F0',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Ionicons name="document-text-outline" size={18} color="#0084FF" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#FFF' : '#0F172A' }}>
                  MÔ TẢ CÔNG VIỆC
                </Text>
              </View>
              <Text selectable={true} style={{ fontSize: 14, color: isDark ? '#ECEDEE' : '#334155', lineHeight: 22 }}>
                {description || 'Chưa nhập mô tả công việc.'}
              </Text>
            </View>

            {/* Requirements Section */}
            <View style={{
              backgroundColor: isDark ? '#1C2A3A' : '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? '#2C3E50' : '#E2E8F0',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#FFF' : '#0F172A' }}>
                  YÊU CẦU ỨNG VIÊN
                </Text>
              </View>
              <Text selectable={true} style={{ fontSize: 14, color: isDark ? '#ECEDEE' : '#334155', lineHeight: 22 }}>
                {requirements || 'Chưa nhập yêu cầu ứng viên.'}
              </Text>
            </View>

            {/* Benefits Section */}
            <View style={{
              backgroundColor: isDark ? '#1C2A3A' : '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? '#2C3E50' : '#E2E8F0',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Ionicons name="gift-outline" size={18} color="#F59E0B" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#FFF' : '#0F172A' }}>
                  QUYỀN LỢI & PHÚC LỢI
                </Text>
              </View>
              <Text selectable={true} style={{ fontSize: 14, color: isDark ? '#ECEDEE' : '#334155', lineHeight: 22 }}>
                Môi trường làm việc chuyên nghiệp, năng động. Chế độ đãi ngộ cạnh tranh, thưởng hiệu quả công việc và bảo hiểm đầy đủ.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Bar */}
          <View style={{
            padding: 16,
            backgroundColor: isDark ? '#1E2022' : '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#2C2E30' : '#E2E8F0',
            flexDirection: 'row',
            gap: 12,
          }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsPreviewModalVisible(false)}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                backgroundColor: isDark ? '#2C2E30' : '#E2E8F0',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: isDark ? '#FFF' : '#334155', fontSize: 15, fontWeight: '700' }}>
                Đóng xem trước
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setIsPreviewModalVisible(false);
                handleSave();
              }}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                backgroundColor: '#0084FF',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>
                Lưu tin đăng
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
    height: Platform.OS === 'ios' ? 210 : 190,
    backgroundColor: '#0084FF',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative',
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  headerBarTitle: {
    position: 'absolute',
    left: 70,
    right: 70,
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 2,
  },
  textBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    paddingTop: 10,
  },
  formCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  inputBoxWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
  },
  fieldIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    paddingRight: 10,
  },
  industryChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  industryChip: {
    maxWidth: '100%',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  industryChipText: {
    color: '#0084FF',
    fontSize: 12,
    fontWeight: '700',
  },
  textareaBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 100,
  },
  textarea: {
    fontSize: 14,
    minHeight: 80,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusToggleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  statusToggleDesc: {
    fontSize: 11,
    color: '#8E8E93',
    lineHeight: 14,
  },
  switchWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#0084FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    elevation: 3,
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Custom Date Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  industrySheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  industrySheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  industrySheetTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  industrySheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  industrySheetSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  industryOptionsContent: {
    paddingBottom: 12,
    gap: 10,
  },
  industryOption: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  industryCheckBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#C7CDD5',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  industryCheckBoxActive: {
    borderColor: '#0084FF',
    backgroundColor: '#0084FF',
  },
  industryOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  applyIndustryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyIndustryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  datePickerContainer: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderWidth: 0,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  monthYearSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 132, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayOfWeekText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dayGridCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayGridCellEmpty: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayText: {
    fontSize: 14,
  },
  todayGridCell: {
    backgroundColor: 'rgba(0, 132, 255, 0.08)',
  },
  selectedGridCell: {
    backgroundColor: '#0084FF',
  },
  quickPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 14,
  },
  presetBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  presetBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
