import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

interface BranchItem {
  id: string;
  name: string;
  address: string;
}

export default function RecruiterProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { employerData, updateCompany } = useAuth();

  // Form Field states (prefilled with mock values or context states)
  // Form Field states (prefilled with mock values or context states)
  const [companyName, setCompanyName] = React.useState(employerData?.companyName || 'Smalljobs Global Solutions');
  const [website, setWebsite] = React.useState(employerData?.website || 'https://smalljobs.vn');
  const [email, setEmail] = React.useState(employerData?.email || 'example@company.com');
  const [phone, setPhone] = React.useState(employerData?.phoneNumber || '0123 456 789');
  const [address, setAddress] = React.useState(employerData?.address || 'Tòa nhà Landmark 81, TP. HCM');
  const [industry, setIndustry] = React.useState(employerData?.industry || 'Công nghệ');
  const [scale, setScale] = React.useState(employerData?.scale || '51-200 nhân viên');
  const [description, setDescription] = React.useState(
    employerData?.description || 'Smalljobs.vn là nền tảng kết nối các công việc tự do và bán thời gian hàng đầu Việt Nam. Chúng tôi cam kết mang lại giải pháp tuyển dụng minh bạch, nhanh chóng và hiệu quả cho doanh nghiệp và người lao động.'
  );

  // Logo & Banner state simulator
  const [logoColor, setLogoColor] = React.useState(employerData?.logo || '#0084FF');
  const [logoUploaded, setLogoUploaded] = React.useState(!!employerData?.logo);

  // Dynamic branch list state
  const [branches, setBranches] = React.useState<BranchItem[]>(
    employerData?.branches || [
      { id: 'branch-1', name: 'Trụ sở Hà Nội', address: 'Quận Cầu Giấy, Hà Nội' },
      { id: 'branch-2', name: 'Chi nhánh TP. HCM', address: 'Quận 1, TP. Hồ Chí Minh' },
    ]
  );

  const handleSelectIndustry = () => {
    Alert.alert(
      'Chọn Lĩnh vực',
      'Chọn lĩnh vực hoạt động chính của công ty:',
      [
        { text: 'Công nghệ', onPress: () => setIndustry('Công nghệ') },
        { text: 'Tài chính / Ngân hàng', onPress: () => setIndustry('Tài chính / Ngân hàng') },
        { text: 'Sản xuất / Vận tải', onPress: () => setIndustry('Sản xuất / Vận tải') },
        { text: 'Dịch vụ / Bán lẻ', onPress: () => setIndustry('Dịch vụ / Bán lẻ') },
        { text: 'Khác', onPress: () => setIndustry('Lĩnh vực khác') },
      ]
    );
  };

  const handleSelectScale = () => {
    Alert.alert(
      'Chọn Quy mô',
      'Chọn quy mô nhân sự của công ty:',
      [
        { text: 'Dưới 10 nhân viên', onPress: () => setScale('Dưới 10 nhân viên') },
        { text: '10-50 nhân viên', onPress: () => setScale('10-50 nhân viên') },
        { text: '51-200 nhân viên', onPress: () => setScale('51-200 nhân viên') },
        { text: '201-500 nhân viên', onPress: () => setScale('201-500 nhân viên') },
        { text: 'Trên 500 nhân viên', onPress: () => setScale('Trên 500 nhân viên') },
      ]
    );
  };

  const handleSelectLogo = () => {
    Alert.alert(
      'Tải lên Logo',
      'Chọn phương thức tải ảnh đại diện công ty:',
      [
        { text: 'Chụp ảnh mới', onPress: () => {
          Alert.alert('Thành công', 'Đã chụp ảnh và cập nhật Logo công ty mới.');
          setLogoColor('#34C759'); // Green color indicates success
          setLogoUploaded(true);
        }},
        { text: 'Chọn từ Thư viện', onPress: () => {
          Alert.alert('Thành công', 'Đã chọn ảnh từ thư viện và cập nhật Logo.');
          setLogoColor('#FF9500'); // Orange color indicates success
          setLogoUploaded(true);
        }},
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const handleSelectBanner = () => {
    Alert.alert(
      'Tải lên Ảnh bìa (Banner)',
      'Chọn phương thức tải ảnh bìa công ty:',
      [
        { text: 'Chụp ảnh mới', onPress: () => {
          Alert.alert('Thành công', 'Đã cập nhật ảnh bìa (Banner) công ty mới.');
        }},
        { text: 'Chọn từ Thư viện', onPress: () => {
          Alert.alert('Thành công', 'Đã tải ảnh bìa (Banner) thành công.');
        }},
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const handleSaveChanges = () => {
    // 1. Update state back in auth context
    updateCompany({
      companyName,
      phoneNumber: phone,
      address,
      website,
      email,
      industry,
      scale,
      description,
      branches,
      logo: logoColor,
    });

    // 2. Alert success & redirect back to Recruiter Dashboard
    Alert.alert(
      'Thành công',
      'Thông tin doanh nghiệp và các văn phòng đã được cập nhật thành công.',
      [
        {
          text: 'Về Dashboard',
          onPress: () => {
            router.replace('/recruiter/dashboard');
          },
        },
      ]
    );
  };

  const handleAddBranch = () => {
    const newId = `branch-${Date.now()}`;
    const mockBranchNames = ['Văn phòng Đà Nẵng', 'Văn phòng Cần Thơ', 'Chi nhánh Hải Phòng'];
    const mockAddresses = ['Quận Hải Châu, Đà Nẵng', 'Quận Ninh Kiều, Cần Thơ', 'Quận Hồng Bàng, Hải Phòng'];
    const randomIndex = Math.floor(Math.random() * mockBranchNames.length);

    const newBranch: BranchItem = {
      id: newId,
      name: mockBranchNames[randomIndex],
      address: mockAddresses[randomIndex],
    };

    setBranches([...branches, newBranch]);
    Alert.alert('Thêm mới', `Đã thêm văn phòng đại diện: ${newBranch.name}`);
  };

  const handleDeleteBranch = (id: string, name: string) => {
    Alert.alert(
      'Xóa chi nhánh',
      `Bạn có chắc chắn muốn xóa văn phòng "${name}" này không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa ngay',
          style: 'destructive',
          onPress: () => {
            setBranches(branches.filter((b) => b.id !== id));
          },
        },
      ]
    );
  };

  const handleEditBranch = (name: string) => {
    Alert.alert('Chỉnh sửa', `Tính năng chỉnh sửa văn phòng "${name}" đang được cập nhật.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Drawer menu emulator header */}
      <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
          <Ionicons name="menu-outline" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Smalljobs.vn</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.push('/recruiter/dashboard')}>
          <Ionicons name="desktop-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner image and overlapping logo section */}
        <View style={styles.heroSection}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleSelectBanner} style={{ width: '100%' }}>
            <Image
              source={require('../../assets/images/small_jobs_banner.png')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            {/* Camera icon overlay on banner */}
            <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 }}>
              <Ionicons name="camera-outline" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
          
          {/* Overlapping company logo */}
          <TouchableOpacity 
            activeOpacity={0.85} 
            onPress={handleSelectLogo}
            style={[styles.logoWrapper, { borderColor: isDark ? '#151718' : '#FFF' }]}
          >
            <View style={[styles.logoCircle, { backgroundColor: logoUploaded ? '#EBF5FF' : '#E6F4FE' }]}>
              <Ionicons name="stats-chart" size={32} color={logoColor} />
            </View>
            {/* Edit overlay icon on logo */}
            <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#0084FF', padding: 3, borderRadius: 10, borderWidth: 1.5, borderColor: '#FFF' }}>
              <Ionicons name="pencil" size={10} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Space margin to account for absolute overlay */}
        <View style={styles.logoSpacer} />

        {/* Core Form Fields */}
        <View style={styles.formFields}>

          {/* Tên công ty */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Tên công ty</Text>
            <View style={[styles.inputBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>
          </View>

          {/* Lĩnh vực & Quy mô side by side */}
          <View style={styles.rowGrid}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleSelectIndustry} 
              style={styles.colHalf}
            >
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Lĩnh vực</Text>
              <View style={[styles.dropdownBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
                <Text style={[styles.dropdownValue, { color: isDark ? '#FFF' : '#11181C' }]}>{industry}</Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleSelectScale} 
              style={styles.colHalf}
            >
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Quy mô</Text>
              <View style={[styles.dropdownBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
                <Text style={[styles.dropdownValue, { color: isDark ? '#FFF' : '#11181C' }]}>{scale}</Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Website */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Website</Text>
            <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
              <Ionicons name="globe-outline" size={20} color="#8E8E93" style={styles.fieldIcon} />
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                value={website}
                onChangeText={setWebsite}
              />
            </View>
          </View>

          {/* Email công ty */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Email công ty</Text>
            <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
              <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.fieldIcon} />
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Số điện thoại */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Số điện thoại</Text>
            <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
              <Ionicons name="call-outline" size={20} color="#8E8E93" style={styles.fieldIcon} />
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Địa chỉ chi tiết */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Địa chỉ chi tiết</Text>
            <View style={[styles.inputBoxWithIcon, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
              <Ionicons name="location-outline" size={20} color="#8E8E93" style={styles.fieldIcon} />
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          {/* Mô tả công ty */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Mô tả công ty</Text>
            <View style={[styles.textareaBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
              <TextInput
                style={[styles.textarea, { color: isDark ? '#FFF' : '#11181C' }]}
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Branches Section */}
          <View style={styles.branchHeaderRow}>
            <Text style={[styles.branchTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Văn phòng đại diện</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleAddBranch} style={styles.addBranchBtn}>
              <Ionicons name="add-circle-outline" size={16} color="#0084FF" />
              <Text style={styles.addBranchText}>Thêm mới</Text>
            </TouchableOpacity>
          </View>

          {/* Repeater branch list rendering */}
          {branches.map((branch) => (
            <View
              key={branch.id}
              style={[
                styles.branchCard,
                { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' },
              ]}
            >
              <View style={styles.branchIconWrapper}>
                <Ionicons name="location-sharp" size={18} color="#0084FF" />
              </View>
              <View style={styles.branchDetails}>
                <Text style={[styles.branchNameText, { color: isDark ? '#FFF' : '#11181C' }]}>{branch.name}</Text>
                <Text style={styles.branchAddressText}>{branch.address}</Text>
              </View>
              <View style={styles.branchActions}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleEditBranch(branch.name)} style={styles.actionBtn}>
                  <Ionicons name="pencil" size={16} color="#8E8E93" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleDeleteBranch(branch.id, branch.name)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

        </View>

        <View style={styles.scrollPaddingBottom} />
      </ScrollView>

      {/* Sticky Save Changes Button at Bottom */}
      <View style={[styles.stickyBottom, { backgroundColor: isDark ? '#151718' : '#FFFFFF', borderTopColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSaveChanges}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={styles.saveButtonIcon} />
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  heroSection: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 140,
  },
  logoWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSpacer: {
    height: 16,
  },
  formFields: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
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
    fontWeight: '500',
    height: '100%',
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  colHalf: {
    flex: 1,
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
    fontSize: 13,
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
    fontWeight: '500',
    minHeight: 80,
  },
  branchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  branchTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  addBranchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBranchText: {
    color: '#0084FF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  branchIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  branchDetails: {
    flex: 1,
  },
  branchNameText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  branchAddressText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  branchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  scrollPaddingBottom: {
    height: 60,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  saveButton: {
    backgroundColor: '#0084FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 46,
    borderRadius: 10,
    width: '100%',
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButtonIcon: {
    marginLeft: 6,
  },
});
