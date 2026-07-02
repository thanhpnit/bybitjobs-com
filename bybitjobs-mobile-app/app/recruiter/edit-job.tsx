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

  // Date Picker Modal States
  const [isDatePickerVisible, setIsDatePickerVisible] = React.useState(false);
  const [pickerDate, setPickerDate] = React.useState(() => {
    if (existingJob?.deadline && existingJob.deadline.includes('/')) {
      const parts = existingJob.deadline.split('/');
      if (parts.length === 3) {
        const m = parseInt(parts[0], 10) - 1;
        const d = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
          return new Date(y, m, d);
        }
      }
    }
    return new Date();
  });
  
  const [activeMonth, setActiveMonth] = React.useState(() => pickerDate.getMonth());
  const [activeYear, setActiveYear] = React.useState(() => pickerDate.getFullYear());

  const selectDate = (date: Date) => {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const y = date.getFullYear();
    setDeadline(`${m}/${d}/${y}`);
    setPickerDate(date);
    setIsDatePickerVisible(false);
  };

  const renderDaysGrid = () => {
    const days = [];
    const firstDayIndex = new Date(activeYear, activeMonth, 1).getDay();
    const totalDays = new Date(activeYear, activeMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayGridCellEmpty} />
      );
    }

    for (let i = 1; i <= totalDays; i++) {
      const cellDate = new Date(activeYear, activeMonth, i);
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
          onPress={() => selectDate(cellDate)}
          style={[
            styles.dayGridCell,
            isToday && styles.todayGridCell,
            isSelected && styles.selectedGridCell,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              { color: isDark ? '#FFF' : '#11181C' },
              isToday && { color: '#0084FF', fontWeight: 'bold' },
              isSelected && { color: '#FFF', fontWeight: 'bold' },
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

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
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (deadline && deadline.includes('/')) {
                    const parts = deadline.split('/');
                    if (parts.length === 3) {
                      const m = parseInt(parts[0], 10) - 1;
                      const d = parseInt(parts[1], 10);
                      const y = parseInt(parts[2], 10);
                      if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
                        const newD = new Date(y, m, d);
                        setPickerDate(newD);
                        setActiveMonth(m);
                        setActiveYear(y);
                      }
                    }
                  }
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

  // Custom Date Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
