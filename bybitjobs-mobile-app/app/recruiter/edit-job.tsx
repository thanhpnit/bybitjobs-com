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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

export default function RecruiterEditJobScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobs, addJob, updateJob } = useAuth();

  const isNew = id === 'new';
  const existingJob = jobs.find((j) => j.id === id);

  // States
  const [title, setTitle] = React.useState(existingJob?.title || '');
  const [industry, setIndustry] = React.useState(existingJob?.industry || 'Công nghệ thông tin');
  const [salary, setSalary] = React.useState(existingJob?.salary || 'Thỏa thuận');
  const [location, setLocation] = React.useState(existingJob?.location || '');
  const [description, setDescription] = React.useState(existingJob?.description || '');
  const [requirements, setRequirements] = React.useState(existingJob?.requirements || '');
  const [deadline, setDeadline] = React.useState(existingJob?.deadline || '11/30/2026');
  const [isOpen, setIsOpen] = React.useState(existingJob ? existingJob.isOpen : true);

  const handleSelectIndustry = () => {
    Alert.alert(
      'Chọn Ngành nghề',
      'Chọn ngành nghề cho tin tuyển dụng:',
      [
        { text: 'Công nghệ thông tin', onPress: () => setIndustry('Công nghệ thông tin') },
        { text: 'Thiết kế đồ họa', onPress: () => setIndustry('Thiết kế đồ họa') },
        { text: 'Vận chuyển', onPress: () => setIndustry('Vận chuyển') },
        { text: 'Dịch vụ gia đình', onPress: () => setIndustry('Dịch vụ gia đình') },
        { text: 'Khác', onPress: () => setIndustry('Khác') },
      ]
    );
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

    const jobData = {
      title,
      industry,
      salary,
      location,
      description,
      requirements,
      deadline,
      isOpen,
    };

    if (isNew) {
      const success = await addJob(jobData);
      if (success) {
        Alert.alert('Thành công', 'Đã thêm mới tin tuyển dụng thành công.', [
          {
            text: 'Đồng ý',
            onPress: () => {
              router.replace('/recruiter/jobs');
            },
          },
        ]);
      }
    } else {
      updateJob(id as string, jobData);
      Alert.alert('Thành công', 'Đã cập nhật tin tuyển dụng thành công.', [
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
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
      {/* Header bar */}
      <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
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
                  placeholder="Ví dụ: Thiết kế logo quán cafe"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* Input: Industry */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>NGÀNH NGHỀ</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSelectIndustry}
                style={[styles.dropdownBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}
              >
                <Text style={[styles.dropdownValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {industry}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Input: Salary */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>MỨC LƯƠNG</Text>
              <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                <Ionicons name="cash-outline" size={18} color="#8E8E93" style={styles.fieldIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Thỏa thuận, 300k/ngày, 25k/giờ..."
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={salary}
                  onChangeText={setSalary}
                />
              </View>
            </View>

            {/* Input: Location */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>ĐỊA ĐIỂM</Text>
              <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                <Ionicons name="location-outline" size={18} color="#8E8E93" style={styles.fieldIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Ví dụ: Phú Nhuận, TP.HCM"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Input: Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>MÔ TẢ CÔNG VIỆC</Text>
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
            </View>

            {/* Input: Deadline */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>HẠN ỨNG TUYỂN</Text>
              <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                <Ionicons name="calendar-outline" size={18} color="#8E8E93" style={styles.fieldIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Ví dụ: 11/30/2026"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={deadline}
                  onChangeText={setDeadline}
                />
              </View>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  textBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputBoxWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
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
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  textareaBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    height: 46,
    borderRadius: 10,
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
    height: 46,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
