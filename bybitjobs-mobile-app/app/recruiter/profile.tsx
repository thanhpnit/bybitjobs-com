import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const isIphoneWithNotch = bottomInset > 0;
  
  // Destructure needed properties from useAuth
  const { employerData, updateCompany, jobs, logout, userData, isLoggedIn, switchRole, unreadNotificationsCount } = useAuth();

  // Mode state: false for dashboard/packages overview, true for edit profile form
  const [isEditing, setIsEditing] = React.useState(false);

  // Form Field states (prefilled with mock values or context states)
  const [companyName, setCompanyName] = React.useState(employerData?.companyName || 'Công ty TNHH Giao Hàng Nhanh');
  const [website, setWebsite] = React.useState(employerData?.website || 'https://bybitjobs.com');
  const [email, setEmail] = React.useState(employerData?.email || 'example@company.com');
  const [phone, setPhone] = React.useState(employerData?.phoneNumber || '0123 456 789');
  const [address, setAddress] = React.useState(employerData?.address || 'Quận 7, TP. Hồ Chí Minh');
  const [industry, setIndustry] = React.useState(employerData?.industry || 'Sản xuất / Vận tải');
  const [scale, setScale] = React.useState(employerData?.scale || '51-200 nhân viên');
  const [description, setDescription] = React.useState(
    employerData?.description || 'Chúng tôi cam kết mang lại giải pháp giao hàng nhanh chóng, hiệu quả và tin cậy cho hàng triệu khách hàng trên toàn quốc.'
  );

  // Logo & Banner state simulator
  const [logoColor, setLogoColor] = React.useState(employerData?.logo || '#0084FF');
  const [logoUploaded, setLogoUploaded] = React.useState(!!employerData?.logo);

  // Dynamic branch list state
  const [branches, setBranches] = React.useState<BranchItem[]>(
    employerData?.branches || [
      { id: 'branch-1', name: 'Trụ sở chính', address: 'Quận 7, TP. Hồ Chí Minh' },
      { id: 'branch-2', name: 'Văn phòng đại diện', address: 'Quận Cầu Giấy, Hà Nội' },
    ]
  );

  React.useEffect(() => {
    if (employerData) {
      setCompanyName(employerData.companyName || 'Công ty TNHH Giao Hàng Nhanh');
      setWebsite(employerData.website || 'https://bybitjobs.com');
      setEmail(employerData.email || 'example@company.com');
      setPhone(employerData.phoneNumber || '0123 456 789');
      setAddress(employerData.address || 'Quận 7, TP. Hồ Chí Minh');
      setIndustry(employerData.industry || 'Sản xuất / Vận tải');
      setScale(employerData.scale || '51-200 nhân viên');
      setDescription(
        employerData.description || 'Chúng tôi cam kết mang lại giải pháp giao hàng nhanh chóng, hiệu quả và tin cậy cho hàng triệu khách hàng trên toàn quốc.'
      );
      if (employerData.branches) {
        setBranches(employerData.branches);
      }
    }
  }, [employerData]);

  const getInitial = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return 'C';
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase();
  };

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

    // 2. Alert success & switch back to overview mode
    Alert.alert(
      'Thành công',
      'Thông tin doanh nghiệp đã được cập nhật thành công.',
      [
        {
          text: 'Đồng ý',
          onPress: () => {
            setIsEditing(false);
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

  const handleBuyPackage = (pkg: any) => {
    router.push({
      pathname: '/recruiter/payment',
      params: {
        packageId: pkg.id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        packagePriceNum: String(pkg.priceNum),
        packageDuration: pkg.duration,
      },
    });
  };

  const handlePostJob = () => {
    router.push({
      pathname: '/recruiter/edit-job',
      params: { id: 'new' },
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất tài khoản không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  // Reusable row for settings
  const renderSettingRow = (
    iconName: any,
    title: string,
    onPress: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.settingRowItem, { borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}
    >
      <View style={styles.settingRowLeft}>
        <View style={[styles.settingRowIconBox, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
          <Ionicons name={iconName} size={18} color="#0084FF" />
        </View>
        <Text style={[styles.settingRowText, { color: isDark ? '#FFF' : '#11181C' }]}>
          {title}
        </Text>
      </View>
      {rightElement ? rightElement : (
        <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#CCC'} />
      )}
    </TouchableOpacity>
  );

  // Stats & listings computations
  const employerJobs = (jobs || []).filter(job => job.employerId === userData?.uid);
  const totalJobsCount = employerJobs.length > 0 ? employerJobs.length : 12;
  const activeJobsCount = employerJobs.length > 0 ? employerJobs.filter(j => j.isOpen).length : 8;
  
  let realApplicantsCount = 0;
  employerJobs.forEach(job => {
    realApplicantsCount += job.applicantsCount || 0;
  });
  const totalApplicants = employerJobs.length > 0 ? `${realApplicantsCount}+` : '150+';

  // Fallback jobs list if empty
  const displayJobs = employerJobs.length > 0 ? employerJobs.map(job => ({
    id: job.id,
    title: job.title,
    isOpen: job.isOpen,
    type: job.type || 'Toàn thời gian',
    requiredCount: job.requiredCount || 1,
    applicantsCount: job.applicantsCount || 0,
    salary: job.salary,
    avatars: [] as string[]
  })) : [
    {
      id: 'mock-1',
      title: 'Nhân viên giao hàng khu vực Quận 7',
      isOpen: true,
      type: 'Toàn thời gian',
      requiredCount: 5,
      applicantsCount: 14,
      salary: '300k/ngày',
      avatars: [
        'https://randomuser.me/api/portraits/men/32.jpg',
        'https://randomuser.me/api/portraits/women/44.jpg'
      ]
    },
    {
      id: 'mock-2',
      title: 'Nhân viên đóng gói hàng hóa ca tối',
      isOpen: true,
      type: 'Bán thời gian',
      requiredCount: 2,
      applicantsCount: 5,
      salary: '25k/giờ',
      avatars: [
        'https://randomuser.me/api/portraits/men/45.jpg'
      ]
    },
    {
      id: 'mock-3',
      title: 'Cộng tác viên nhập liệu Online',
      isOpen: false,
      type: 'Từ xa',
      requiredCount: 0,
      applicantsCount: 0,
      salary: '50k/đơn',
      avatars: [] as string[]
    }
  ];

  const [servicePackages, setServicePackages] = React.useState<any[]>([]);

  React.useEffect(() => {
    let intervalId: any = null;
    const fetchPackages = async () => {
      try {
        const res = await fetch('http://160.250.246.119:4000/api/packages');
        if (!res.ok) throw new Error('API response was not ok');
        const rawData = await res.json();
        const data: any[] = [];
        
        rawData.forEach((pkg: any) => {
          data.push({
            id: pkg.id,
            name: pkg.name,
            price: pkg.price,
            priceNum: pkg.priceNum || 0,
            duration: pkg.period ? pkg.period.replace('/', '').trim() : '',
            tag: `TRẠNG THÁI: ${pkg.badge || ''}`,
            features: [
              `Số lượng: ${pkg.posts || ''}`,
              `Lượt nhận CV: ${pkg.cvs || ''}`,
            ],
            isPopular: pkg.isPopular,
            isVip: pkg.id === 'premium' || pkg.name?.toLowerCase().includes('premium'),
          });
        });

        data.sort((a, b) => a.priceNum - b.priceNum);
        setServicePackages(data);
      } catch (err) {
        console.log('Lỗi fetch packages in profile:', err);
      }
    };

    fetchPackages();
    intervalId = setInterval(fetchPackages, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const benefits = [
    {
      icon: 'eye-outline' as const,
      title: 'Tăng lượt tiếp cận',
      desc: 'Bài đăng của bạn tiếp cận nhiều ứng viên tiềm năng hơn gấp 3 lần.',
    },
    {
      icon: 'checkmark-circle-outline' as const,
      title: 'Huy hiệu xác minh',
      desc: 'Tăng độ uy tín với biểu tượng "Nhà tuyển dụng tin cậy".',
    },
    {
      icon: 'flash-outline' as const,
      title: 'Hỗ trợ ưu tiên',
      desc: 'Mọi thắc mắc của bạn sẽ được đội ngũ Smalljobs xử lý ngay lập tức.',
    },
  ];

  // Giao diện chỉnh sửa thông tin công ty (Edit Profile Form View)
  const renderEditProfileForm = () => {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => setIsEditing(false)}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerBarTitle}>Thông tin công ty</Text>
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
  };

  // Giao diện hợp nhất Cá nhân (Dashboard + Gói dịch vụ + Bottom Navigation)
  const renderCombinedProfile = () => {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]} edges={['top']}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
            <Ionicons name="menu-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.headerBarTitle, { color: '#FFF' }]}>BybitJobs</Text>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isIphoneWithNotch ? 130 : 110 }}>
          {/* 1. Cover & Logo Hero */}
          <View style={styles.empHeroSection}>
            <Image
              source={require('../../assets/images/small_jobs_banner.png')}
              style={styles.empBannerImage}
              resizeMode="cover"
            />
            <View style={[styles.empLogoWrapper, { borderColor: isDark ? '#151718' : '#FFF' }]}>
              <View style={[styles.empLogoCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                {logoUploaded ? (
                  <Ionicons name="stats-chart" size={32} color={logoColor} />
                ) : (
                  <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0084FF' }}>
                    {getInitial(companyName)}
                  </Text>
                )}
              </View>
              {/* Edit overlay icon on logo to open editing form */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsEditing(true)}
                style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#0084FF', padding: 5, borderRadius: 12, borderWidth: 1.5, borderColor: '#FFF' }}
              >
                <Ionicons name="pencil" size={10} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Company Info Details */}
          <View style={styles.empProfileDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
              <Text style={[styles.empCompanyName, { color: isDark ? '#FFF' : '#11181C' }]}>
                {companyName}
              </Text>
              <Ionicons name="checkmark-circle" size={18} color="#0084FF" style={{ marginLeft: 6 }} />
            </View>
            <View style={styles.empLocationRow}>
              <Ionicons name="location-outline" size={14} color="#8E8E93" />
              <Text style={styles.empLocationText}>{address}</Text>
            </View>
          </View>

          {/* 3. Stats Row */}
          <View style={styles.empStatsRow}>
            <View style={[styles.empStatCard, { backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8' }]}>
              <Text style={[styles.empStatValue, { color: '#0084FF' }]}>{totalJobsCount}</Text>
              <Text style={styles.empStatLabel}>Tin đã đăng</Text>
            </View>
            <View style={[styles.empStatCard, { backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8' }]}>
              <Text style={[styles.empStatValue, { color: '#0084FF' }]}>{activeJobsCount}</Text>
              <Text style={styles.empStatLabel}>Đang tuyển</Text>
            </View>
            <View style={[styles.empStatCard, { backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8' }]}>
              <Text style={[styles.empStatValue, { color: '#0084FF' }]}>{totalApplicants}</Text>
              <Text style={styles.empStatLabel}>Ứng viên</Text>
            </View>
          </View>

          {/* 4. Post New Job Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePostJob}
            style={styles.empPostJobBtn}
          >
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.empPostJobBtnText}>Đăng tin tuyển dụng mới</Text>
          </TouchableOpacity>

          {/* 5. Posted Jobs Section */}
          <View style={styles.empSectionHeader}>
            <Text style={[styles.empSectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Việc làm đã đăng</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/jobs')}>
              <Text style={styles.empSeeAllLink}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.empJobsList}>
            {displayJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                activeOpacity={0.9}
                onPress={() => {
                  if (job.id.startsWith('mock-')) {
                    Alert.alert('Thông báo', `Chi tiết tin đăng mẫu: ${job.title}`);
                  } else {
                    router.push({
                      pathname: '/job-details',
                      params: {
                        jobId: job.id,
                        title: job.title,
                        salary: job.salary,
                        location: address,
                      },
                    });
                  }
                }}
                style={[styles.empJobCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}
              >
                <View style={styles.empJobHeader}>
                  <Text style={[styles.empJobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                    {job.title}
                  </Text>
                  <View style={[styles.empJobBadge, { backgroundColor: job.isOpen ? '#E8F5E9' : '#ECEFF1' }]}>
                    <Text style={[styles.empJobBadgeText, { color: job.isOpen ? '#2E7D32' : '#8E8E93' }]}>
                      {job.isOpen ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                    </Text>
                  </View>
                </View>

                <View style={styles.empJobMetaRow}>
                  <View style={styles.empJobMetaItem}>
                    <Ionicons name="time-outline" size={13} color="#8E8E93" />
                    <Text style={styles.empJobMetaText}>{job.type}</Text>
                  </View>
                  <View style={styles.empJobMetaItem}>
                    <Ionicons name="people-outline" size={13} color="#8E8E93" />
                    <Text style={styles.empJobMetaText}>
                      {job.requiredCount > 0 ? `Cần ${job.requiredCount} người` : 'Đã tuyển đủ'}
                    </Text>
                  </View>
                </View>

                <View style={styles.empJobFooter}>
                  <View style={styles.empApplicantsRow}>
                    {job.avatars && job.avatars.length > 0 ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {job.avatars.map((url, idx) => (
                          <Image
                            key={idx}
                            source={{ uri: url }}
                            style={[styles.empApplicantAvatar, { marginLeft: idx > 0 ? -10 : 0 }]}
                          />
                        ))}
                        {job.applicantsCount > job.avatars.length && (
                          <Text style={styles.empApplicantsMore}>
                            +{job.applicantsCount - job.avatars.length}
                          </Text>
                        )}
                      </View>
                    ) : (
                      job.applicantsCount > 0 ? (
                        <Text style={{ fontSize: 11, color: '#0084FF', fontWeight: 'bold' }}>
                          {job.applicantsCount} ứng viên đã ứng tuyển
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#8E8E93' }}>Chưa có ứng viên</Text>
                      )
                    )}
                  </View>

                  <View style={[styles.empJobSalaryBox, { backgroundColor: isDark ? '#1C2A3A' : '#EBF5FF' }]}>
                    <Text style={styles.empJobSalaryText}>{job.salary}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 6. Pricing Packages Section */}
          <Text style={[styles.empSectionTitle, { paddingHorizontal: 16, marginTop: 28, marginBottom: 16, color: isDark ? '#FFF' : '#11181C' }]}>
            Nâng cấp gói dịch vụ
          </Text>

          {servicePackages.map((pkg) => {
            let cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
            let textColor = isDark ? '#FFF' : '#11181C';
            let descColor = isDark ? '#9BA1A6' : '#687076';
            let buttonBg = isDark ? '#2C2C2E' : '#ECEFF1';
            let buttonText = isDark ? '#FFF' : '#11181C';

            if (pkg.isPopular) {
              cardBg = isDark ? '#1A2E44' : '#F0F8FF';
              buttonBg = '#0084FF';
              buttonText = '#FFFFFF';
            } else if (pkg.isVip) {
              cardBg = '#091E35';
              textColor = '#FFFFFF';
              descColor = '#A8C5E5';
              buttonBg = '#FFFFFF';
              buttonText = '#091E35';
            }

            return (
              <View
                key={pkg.id}
                style={[
                  styles.empPkgCard,
                  { backgroundColor: cardBg, borderColor: pkg.isPopular ? '#0084FF' : (isDark ? '#2C2C2E' : '#E5E7EB') },
                  pkg.isPopular && styles.empPkgCardPopular
                ]}
              >
                <View style={styles.empPkgTagsRow}>
                  <View
                    style={[
                      styles.empPkgTagBubble,
                      {
                        backgroundColor: pkg.isVip
                          ? '#FF9500'
                          : pkg.isPopular
                            ? '#0084FF'
                            : isDark
                              ? '#2C2C2E'
                              : '#ECEFF1',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.empPkgTagText,
                        { color: pkg.isVip || pkg.isPopular ? '#FFF' : (isDark ? '#9BA1A6' : '#5E6E7A') },
                      ]}
                    >
                      {pkg.tag}
                    </Text>
                  </View>

                  {pkg.subTag && (
                    <View style={[styles.empPkgSubTagBubble, { backgroundColor: pkg.isVip ? '#0084FF' : '#FF9800' }]}>
                      <Text style={styles.empPkgSubTagText}>{pkg.subTag}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.empPkgPriceRow}>
                  <Text style={[styles.empPkgName, { color: textColor }]}>{pkg.name}</Text>
                  <Text
                    style={[
                      styles.empPkgPrice,
                      { color: pkg.isPopular ? '#0084FF' : pkg.isVip ? '#FFF' : '#0084FF' },
                    ]}
                  >
                    {pkg.price}
                  </Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  {pkg.features.map((feature: string, idx: number) => (
                    <View key={idx} style={styles.empPkgFeatureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={pkg.isVip ? '#82C1F5' : '#4CAF50'}
                        style={styles.empPkgFeatureIcon}
                      />
                      <Text style={[styles.empPkgFeatureText, { color: descColor }]}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleBuyPackage(pkg)}
                  style={[styles.empPkgBuyBtn, { backgroundColor: buttonBg }]}
                >
                  <Text style={[styles.empPkgBuyBtnText, { color: buttonText }]}>Mua ngay</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* 7. Benefits Section */}
          <Text style={[styles.empSectionTitle, { paddingHorizontal: 16, marginTop: 20, marginBottom: 16, color: isDark ? '#FFF' : '#11181C' }]}>
            Lợi ích khi nâng cấp
          </Text>

          {benefits.map((benefit, idx) => (
            <View
              key={idx}
              style={[
                styles.empBenefitCard,
                { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' },
              ]}
            >
              <View style={[styles.empBenefitIconFrame, { backgroundColor: isDark ? '#2C2C2E' : '#E6F4FE' }]}>
                <Ionicons name={benefit.icon} size={20} color="#0084FF" />
              </View>
              <View style={styles.empBenefitTextCol}>
                <Text style={[styles.empBenefitCardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {benefit.title}
                </Text>
                <Text style={[styles.empBenefitCardDesc, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  {benefit.desc}
                </Text>
              </View>
            </View>
          ))}

          {/* 8. Elegant Bottom Promo Banner */}
          <View style={styles.empPromoFrame}>
            <Image
              source={require('../../assets/images/small_jobs_banner.png')}
              style={styles.empPromoImage}
              resizeMode="cover"
            />
            <View style={styles.empPromoOverlay}>
              <Text style={styles.empPromoText}>Hàng ngàn doanh nghiệp đã tin dùng</Text>
            </View>
          </View>

          {/* 9. Settings Options & Logout for Employer */}
          <View style={[styles.whiteCard, isDark && styles.darkCard, { marginHorizontal: 16, paddingBottom: 6 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
              <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Cài đặt tài khoản & Hỗ trợ
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            {renderSettingRow('business-outline', 'Thông tin công ty', () => setIsEditing(true))}
            {renderSettingRow('receipt-outline', 'Lịch sử giao dịch', () => router.push('/recruiter/transactions' as any))}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                'Chuyển vai trò',
                'Bạn có chắc chắn muốn quay lại giao diện Người tìm việc không?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Đồng ý',
                    onPress: () => {
                      switchRole('candidate');
                      router.replace('/(tabs)/profile');
                    }
                  }
                ]
              );
            }}
            style={[styles.bigLogoutButton, { marginHorizontal: 16, marginTop: 16, marginBottom: 8, backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE', width: undefined }]}
          >
            <Ionicons name="people-outline" size={20} color="#0084FF" style={{ marginRight: 8 }} />
            <Text style={[styles.bigLogoutButtonText, { color: '#0084FF' }]}>Quay lại vai trò Người tìm việc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            style={[styles.bigLogoutButton, { marginHorizontal: 16, marginTop: 8, marginBottom: 20, backgroundColor: isDark ? '#2C1A1D' : '#FFEBEE', width: undefined }]}
          >
            <Ionicons name="log-out" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
            <Text style={styles.bigLogoutButtonText}>Đăng xuất tài khoản</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Custom Raised FAB Bottom Navigation Bar for Recruiter */}
        {false && (
        <View style={[
          styles.bottomNavBar, 
          { 
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', 
            borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
            height: isIphoneWithNotch ? 82 : 64,
            paddingBottom: isIphoneWithNotch ? 22 : 6,
            paddingTop: 8
          }
        ]}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/dashboard')} style={styles.navItem}>
            <Ionicons name="home-outline" size={24} color="#8E8E93" />
            <Text style={styles.navItemText}>Trang chủ</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/candidates')} style={styles.navItem}>
            <Ionicons name="people-outline" size={24} color="#8E8E93" />
            <Text style={styles.navItemText}>Quản lý ứng viên</Text>
          </TouchableOpacity>

          {/* Center Raised FAB */}
          <TouchableOpacity activeOpacity={0.85} onPress={handlePostJob} style={styles.fabNavItem}>
            <View style={[styles.fabCircle, { backgroundColor: '#0060B6', borderColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <Ionicons name="add" size={32} color="#FFF" />
            </View>
            <Text style={styles.fabItemText}>Đăng tin</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/jobs')} style={styles.navItem}>
            <Ionicons name="briefcase-outline" size={24} color="#8E8E93" />
            <Text style={styles.navItemText}>Quản lý tin tuyển dụng</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/profile')} style={styles.navItem}>
            <Ionicons name="person" size={24} color="#0084FF" />
            <Text style={[styles.navItemText, { color: '#0084FF' }]}>Cá nhân</Text>
          </TouchableOpacity>
        </View>
        )}
      </SafeAreaView>
    );
  };

  if (isEditing) {
    return renderEditProfileForm();
  }

  return renderCombinedProfile();
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
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
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

  // Combined Layout Styles
  empHeroSection: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  empBannerImage: {
    width: '100%',
    height: '100%',
  },
  empLogoWrapper: {
    position: 'absolute',
    bottom: -35,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
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
  empLogoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empProfileDetails: {
    alignItems: 'center',
    marginTop: 45,
    marginBottom: 16,
  },
  empCompanyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  empLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  empLocationText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  empStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  empStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  empStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  empPostJobBtn: {
    flexDirection: 'row',
    backgroundColor: '#0084FF',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 6,
  },
  empPostJobBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  empSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  empSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empSeeAllLink: {
    fontSize: 13,
    color: '#0084FF',
    fontWeight: '600',
  },
  empJobsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  empJobCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  empJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  empJobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  empJobBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  empJobBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  empJobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  empJobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  empJobMetaText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  empJobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empApplicantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empApplicantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  empApplicantsMore: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0084FF',
    marginLeft: 6,
  },
  empJobSalaryBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  empJobSalaryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  empPkgCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1.5,
  },
  empPkgCardPopular: {
    borderWidth: 2,
    borderColor: '#0084FF',
  },
  empPkgTagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  empPkgTagBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  empPkgTagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  empPkgSubTagBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  empPkgSubTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  empPkgPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  empPkgName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empPkgPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empPkgFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  empPkgFeatureIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  empPkgFeatureText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  empPkgBuyBtn: {
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  empPkgBuyBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  empBenefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  empBenefitIconFrame: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  empBenefitTextCol: {
    flex: 1,
  },
  empBenefitCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  empBenefitCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  empPromoFrame: {
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    position: 'relative',
  },
  empPromoImage: {
    width: '100%',
    height: '100%',
  },
  empPromoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 30, 54, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  empPromoText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Settings lists styles from profile tab
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  settingRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingRowText: {
    fontSize: 13,
    fontWeight: '500',
  },
  bigLogoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    width: '100%',
    marginTop: 8,
    marginBottom: 20,
  },
  bigLogoutButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Recruiter Bottom Navigation Bar
  bottomNavBar: {
    height: 64,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    overflow: 'visible',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  navItemText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4,
  },
  fabNavItem: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  fabCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -25,
    borderWidth: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  fabItemText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0060B6',
    marginTop: 34,
  },
});
