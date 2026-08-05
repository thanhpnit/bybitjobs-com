import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

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
  const { employerData, updateCompany, jobs, logout, userData, switchRole, unreadNotificationsCount, changePassword, updateAvatar, updateBanner, disableAccount } = useAuth();

  // Mode state: false for dashboard/packages overview, true for edit profile form
  const [isEditing, setIsEditing] = React.useState(false);

  // Change password modal states
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = React.useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = React.useState('');
  const [newPasswordInput, setNewPasswordInput] = React.useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);

  // Guide modal state
  const [isGuideModalVisible, setIsGuideModalVisible] = React.useState(false);

  // Form Field states (prefilled with mock values or context states)
  const [companyName, setCompanyName] = React.useState(employerData?.companyName || 'Công ty TNHH Giao Hàng Nhanh');
  const [website, setWebsite] = React.useState(employerData?.website || 'https://bybitjobs.com');
  const [email, setEmail] = React.useState(employerData?.email || 'example@company.com');
  const [phone, setPhone] = React.useState(employerData?.phoneNumber || '0123 456 789');
  const [address, setAddress] = React.useState(employerData?.address || 'Quận 7, TP. Hồ Chí Minh');
  const [industry, setIndustry] = React.useState(employerData?.industry || 'Sản xuất / Vận tải');
  
  const [isIndustryModalVisible, setIsIndustryModalVisible] = React.useState(false);
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

  // Branch Modal States
  const [isBranchModalVisible, setIsBranchModalVisible] = React.useState(false);
  const [editingBranchId, setEditingBranchId] = React.useState<string | null>(null);
  const [branchNameInput, setBranchNameInput] = React.useState('');
  const [branchAddressInput, setBranchAddressInput] = React.useState('');

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

  const handleGenerateCompanyDesc = (presetCategory?: string) => {
    const name = companyName || 'Công ty chúng tôi';
    const cat = presetCategory || industry || 'Công nghệ';

    let generated = '';
    if (cat.includes('Công nghệ') || cat.includes('IT') || cat.includes('Phần mềm')) {
      generated = `${name} là doanh nghiệp tiên phong trong lĩnh vực Công nghệ thông tin và Giải pháp số hóa. Chúng tôi chuyên nghiên cứu, phát triển các hệ thống phần mềm hiệu năng cao và ứng dụng di động thông minh nhằm mang lại trải nghiệm tối ưu cho người dùng.\n\nVới môi trường làm việc sáng tạo, minh bạch và chính sách đãi ngộ hấp dẫn, ${name} luôn mở rộng cửa đón chào các tài năng đam mê công nghệ cùng đồng hành và bứt phá sự nghiệp.`;
    } else if (cat.includes('Vận tải') || cat.includes('Giao nhận') || cat.includes('Logistics')) {
      generated = `${name} là đơn vị uy tín hàng đầu trong lĩnh vực Vận tải & Giao nhận hàng hóa toàn quốc. Chúng tôi cung cấp giải pháp chuỗi cung ứng toàn diện, giao vận tốc độ và đảm bảo an toàn tuyệt đối cho hàng triệu kiện hàng mỗi ngày.\n\nTại ${name}, cán bộ nhân viên được làm việc trong môi trường năng động, thu nhập ổn định cùng đầy đủ các chế độ phúc lợi và chương trình thưởng hiệu quả công việc hấp dẫn.`;
    } else if (cat.includes('F&B') || cat.includes('Nhà hàng') || cat.includes('Pha chế') || cat.includes('Ẩm thực')) {
      generated = `${name} là chuỗi thương hiệu Nhà hàng & Dịch vụ Ẩm thực được đông đảo khách hàng yêu thích. Chúng tôi cam kết mang đến những trải nghiệm ẩm thực chất lượng, không gian hiện đại và phong cách phục vụ tận tâm chuyên nghiệp.\n\n${name} coi trọng sự gắn kết của từng thành viên, liên tục đào tạo nâng cao tay nghề và tạo cơ hội thăng tiến rõ ràng cho đội ngũ nhân sự nhiệt huyết.`;
    } else if (cat.includes('Bán lẻ') || cat.includes('Thương mại') || cat.includes('Dịch vụ')) {
      generated = `${name} là hệ thống Bán lẻ & Dịch vụ thương mại uy tín. Chúng tôi tự hào mang đến cho khách hàng các sản phẩm chính hãng, dịch vụ chăm sóc tận tình và trải nghiệm mua sắm tiện lợi hàng đầu.\n\nChúng tôi mang đến môi trường làm việc thân thiện, mức thưởng doanh số hấp dẫn và chính sách lộ trình thăng tiến công bằng cho tất cả nhân sự.`;
    } else {
      generated = `${name} là doanh nghiệp uy tín hoạt động trong lĩnh vực ${cat}. Chúng tôi cam kết chất lượng sản phẩm dịch vụ hàng đầu, minh bạch trong quản trị và xây dựng văn hóa doanh nghiệp bền vững.\n\nĐến với ${name}, bạn sẽ được làm việc cùng đội ngũ đồng nghiệp nhiệt huyết, thu nhập cạnh tranh và được tạo mọi điều kiện để phát triển tối đa năng lực bản thân.`;
    }

    setDescription(generated);
  };

  const handleSelectIndustry = () => {
    setIsIndustryModalVisible(true);
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

  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);

  const handleUploadLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Quyền truy cập bị từ chối', 'Vui lòng cấp quyền truy cập thư viện ảnh để tải lên logo.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].base64) {
        setIsUploadingLogo(true);
        const res = await updateAvatar(result.assets[0].base64, true);
        setIsUploadingLogo(false);
        if (res.success) {
          Alert.alert('Thành công', 'Đã cập nhật logo công ty mới!');
          setLogoUploaded(true);
        } else {
          Alert.alert('Lỗi', res.message || 'Không thể cập nhật logo công ty.');
        }
      }
    } catch (error) {
      console.error(error);
      setIsUploadingLogo(false);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi chọn ảnh.');
    }
  };

  const handleSelectBanner = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Quyền truy cập bị từ chối', 'Vui lòng cấp quyền truy cập thư viện ảnh để tải lên ảnh bìa.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].base64) {
        const res = await updateBanner(result.assets[0].base64);
        if (res.success) {
          Alert.alert('Thành công', 'Đã cập nhật ảnh bìa (Banner) công ty mới!');
        } else {
          Alert.alert('Lỗi', res.message || 'Không thể cập nhật ảnh bìa công ty.');
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi chọn ảnh bìa.');
    }
  };

  const handleSaveChanges = () => {
    Alert.alert(
      'Xác nhận cập nhật thông tin',
      `Bạn có chắc chắn muốn lưu các thay đổi cho doanh nghiệp "${companyName}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận lưu',
          onPress: () => {
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

            Alert.alert(
              '✓ Đã cập nhật thành công',
              'Thông tin doanh nghiệp đã được lưu thay đổi thành công.',
              [
                {
                  text: 'Đồng ý',
                  onPress: () => {
                    setIsEditing(false);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleAddBranch = () => {
    setEditingBranchId(null);
    setBranchNameInput('');
    setBranchAddressInput('');
    setIsBranchModalVisible(true);
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

  const handleEditBranch = (id: string, name: string, address: string) => {
    setEditingBranchId(id);
    setBranchNameInput(name);
    setBranchAddressInput(address);
    setIsBranchModalVisible(true);
  };

  const handleSaveBranch = () => {
    if (!branchNameInput.trim()) {
      Alert.alert('Cảnh báo', 'Vui lòng nhập tên văn phòng / chi nhánh.');
      return;
    }
    if (!branchAddressInput.trim()) {
      Alert.alert('Cảnh báo', 'Vui lòng nhập địa chỉ văn phòng.');
      return;
    }

    if (editingBranchId) {
      setBranches(
        branches.map((b) =>
          b.id === editingBranchId
            ? { ...b, name: branchNameInput.trim(), address: branchAddressInput.trim() }
            : b
        )
      );
      Alert.alert('Thành công', 'Đã cập nhật thông tin văn phòng.');
    } else {
      const newBranch: BranchItem = {
        id: `branch-${Date.now()}`,
        name: branchNameInput.trim(),
        address: branchAddressInput.trim(),
      };
      setBranches([...branches, newBranch]);
      Alert.alert('Thành công', 'Đã thêm văn phòng đại diện mới.');
    }
    setIsBranchModalVisible(false);
    setEditingBranchId(null);
    setBranchNameInput('');
    setBranchAddressInput('');
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
  const totalJobsCount = employerJobs.length;
  const activeJobsCount = employerJobs.filter(j => j.isOpen).length;

  let realApplicantsCount = 0;
  employerJobs.forEach(job => {
    realApplicantsCount += job.applicantsCount || 0;
  });
  const totalApplicants = realApplicantsCount;

  const displayJobs = employerJobs
    .filter(job => job.isOpen && job.status !== 'Đã đóng')
    .map(job => ({
      id: job.id,
      title: job.title,
      isOpen: job.isOpen,
      type: job.type || 'Toàn thời gian',
      requiredCount: job.requiredCount || 1,
      applicantsCount: job.applicantsCount || 0,
      salary: job.salary,
      avatars: [] as string[]
    }));

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
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.iconBtn}
            onPress={() => {
              Alert.alert(
                'Hủy chỉnh sửa',
                'Bạn có chắc chắn muốn thoát mà không lưu thông tin vừa thay đổi?',
                [
                  { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
                  { text: 'Thoát không lưu', style: 'destructive', onPress: () => setIsEditing(false) }
                ]
              );
            }}
          >
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
              {employerData?.coverImage || employerData?.cover_image ? (
                <Image
                  source={{ uri: employerData.coverImage || employerData.cover_image }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require('../../assets/images/small_jobs_banner.png')}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              )}
              {/* Camera icon overlay on banner */}
              <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 }}>
                <Ionicons name="camera-outline" size={18} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* Overlapping company logo */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleUploadLogo}
              style={[styles.logoWrapper, { borderColor: isDark ? '#151718' : '#FFF' }]}
            >
              <View style={[styles.logoCircle, { backgroundColor: '#E6F4FE', overflow: 'hidden' }]}>
                {employerData?.logo ? (
                  <Image source={{ uri: employerData.logo }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0084FF' }}>
                    {getInitial(companyName)}
                  </Text>
                )}
              </View>
              {/* Edit overlay icon on logo */}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#0084FF', padding: 5, borderRadius: 12, borderWidth: 1.5, borderColor: '#FFF' }}>
                {isUploadingLogo ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="camera" size={10} color="#FFF" />
                )}
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
                  <Text style={[styles.dropdownValue, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>{industry}</Text>
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
                  <Text style={[styles.dropdownValue, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>{scale}</Text>
                  <Ionicons name="chevron-down" size={16} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Scale Preset Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4, marginBottom: 12 }}>
              {['Dưới 10 nhân viên', '10-50 nhân viên', '51-200 nhân viên', '201-500 nhân viên', 'Trên 500 nhân viên'].map((item) => {
                const checked = scale === item;
                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.8}
                    onPress={() => setScale(item)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: checked ? '#0084FF' : (isDark ? '#2C2C2E' : '#EBF5FF'),
                      borderWidth: 1,
                      borderColor: checked ? '#0084FF' : (isDark ? '#3A3D40' : '#D0E7FF'),
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: checked ? '#FFF' : (isDark ? '#D1D5DB' : '#0084FF') }}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C', marginBottom: 0 }]}>Mô tả công ty</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleGenerateCompanyDesc()}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}
                >
                  <Ionicons name="sparkles" size={12} color="#7C3AED" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#7C3AED' }}>✨ AI Mẫu mô tả</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Preset Description Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                {[
                  { label: '🏢 Công nghệ / IT', cat: 'Công nghệ' },
                  { label: '🚚 Vận tải & Logistics', cat: 'Vận tải' },
                  { label: '☕ Chuỗi F&B / Nhà hàng', cat: 'F&B' },
                  { label: '🏬 Bán lẻ & Dịch vụ', cat: 'Bán lẻ' },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.cat}
                    activeOpacity={0.8}
                    onPress={() => handleGenerateCompanyDesc(preset.cat)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isDark ? '#3A3D40' : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontSize: 11, color: isDark ? '#E2E8F0' : '#475569', fontWeight: '500' }}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

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
                  <TouchableOpacity activeOpacity={0.7} onPress={() => handleEditBranch(branch.id, branch.name, branch.address)} style={styles.actionBtn}>
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

        {/* Modal: Thêm / Sửa Văn phòng đại diện */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isBranchModalVisible}
          onRequestClose={() => setIsBranchModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.branchModalContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {editingBranchId ? 'Chỉnh sửa văn phòng' : 'Thêm văn phòng đại diện'}
                </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setIsBranchModalVisible(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#9BA1A6' : '#687076'} />
                </TouchableOpacity>
              </View>

              {/* Inputs */}
              <View style={{ padding: 20 }}>
                {/* Quick Branch Presets */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, color: isDark ? '#9BA1A6' : '#687076', marginBottom: 6 }}>Chọn nhanh gợi ý văn phòng:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setBranchNameInput('Chi nhánh chính');
                        setBranchAddressInput(address || 'TP. Hồ Chí Minh');
                      }}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: isDark ? '#2C2C2E' : '#EBF5FF', borderWidth: 1, borderColor: '#0084FF' }}
                    >
                      <Text style={{ fontSize: 11, color: '#0084FF', fontWeight: '700' }}>📍 Lấy địa chỉ công ty</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setBranchNameInput('Văn phòng Hà Nội');
                        setBranchAddressInput('Tòa nhà Charmvit, 117 Trần Duy Hưng, Cầu Giấy, Hà Nội');
                      }}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9', borderWidth: 1, borderColor: isDark ? '#3A3D40' : '#E2E8F0' }}
                    >
                      <Text style={{ fontSize: 11, color: isDark ? '#FFF' : '#334155' }}>🏛️ Chi nhánh Hà Nội</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setBranchNameInput('Văn phòng TP.HCM');
                        setBranchAddressInput('Số 180 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh');
                      }}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9', borderWidth: 1, borderColor: isDark ? '#3A3D40' : '#E2E8F0' }}
                    >
                      <Text style={{ fontSize: 11, color: isDark ? '#FFF' : '#334155' }}>🏛️ Chi nhánh TP.HCM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setBranchNameInput('Văn phòng Đà Nẵng');
                        setBranchAddressInput('Số 271 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng');
                      }}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9', borderWidth: 1, borderColor: isDark ? '#3A3D40' : '#E2E8F0' }}
                    >
                      <Text style={{ fontSize: 11, color: isDark ? '#FFF' : '#334155' }}>🏛️ Chi nhánh Đà Nẵng</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C', marginBottom: 8 }]}>
                    Tên văn phòng / chi nhánh
                  </Text>
                  <View style={[styles.inputBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                    <TextInput
                      style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                      placeholder="Ví dụ: Văn phòng Hà Nội"
                      placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                      value={branchNameInput}
                      onChangeText={setBranchNameInput}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { marginTop: 16 }]}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C', marginBottom: 8 }]}>
                    Địa chỉ văn phòng
                  </Text>
                  <View style={[styles.inputBox, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
                    <TextInput
                      style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                      placeholder="Ví dụ: Số 123 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội"
                      placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                      value={branchAddressInput}
                      onChangeText={setBranchAddressInput}
                    />
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSaveBranch}
                  style={[styles.saveBranchBtn, { backgroundColor: '#0084FF', marginTop: 24 }]}
                >
                  <Text style={styles.saveBranchBtnText}>Lưu thông tin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Chọn Lĩnh Vực */}
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
                    Chọn lĩnh vực
                  </Text>
                  <Text style={styles.industrySheetSubtitle}>
                    Chọn lĩnh vực hoạt động chính của công ty.
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
                  const checked = industry === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.75}
                      onPress={() => {
                        setIndustry(item);
                        setIsIndustryModalVisible(false);
                      }}
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
                      <Text
                        style={[
                          styles.industryOptionText,
                          { color: checked ? '#0084FF' : (isDark ? '#FFF' : '#11181C') },
                        ]}
                      >
                        {item}
                      </Text>
                      {checked && (
                        <Ionicons name="checkmark-circle" size={24} color="#0084FF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  };

  // Giao diện hợp nhất Cá nhân (Dashboard + Gói dịch vụ + Bottom Navigation)
  const renderCombinedProfile = () => {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]} edges={['top']}>
        <View style={styles.profileHeaderBg} />

        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.iconBtn} />
          <Text style={[styles.headerBarTitle, { color: '#FFF' }]}>Cá nhân</Text>
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
          <View style={[styles.empProfileCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
            {/* 1. Cover & Logo Hero */}
            <View style={styles.empHeroSection}>
              {employerData?.coverImage || employerData?.cover_image ? (
                <Image
                  source={{ uri: employerData.coverImage || employerData.cover_image }}
                  style={styles.empBannerImage}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require('../../assets/images/small_jobs_banner.png')}
                  style={styles.empBannerImage}
                  resizeMode="cover"
                />
              )}
              <View style={[styles.empLogoWrapper, { borderColor: isDark ? '#1C1C1E' : '#FFF' }]}>
                <View style={[styles.empLogoCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE', overflow: 'hidden' }]}>
                  {employerData?.logo ? (
                    <Image source={{ uri: employerData.logo }} style={{ width: '100%', height: '100%' }} />
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
                <Text style={[styles.empCompanyName, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                  {companyName}
                </Text>
                <Ionicons name="checkmark-circle" size={18} color="#0084FF" style={{ marginLeft: 6 }} />
              </View>
              <View style={styles.empLocationRow}>
                <Ionicons name="location-outline" size={14} color="#8E8E93" />
                <Text style={styles.empLocationText} numberOfLines={2}>{address}</Text>
              </View>
            </View>

            {/* 3. Stats Row */}
            <View style={styles.empStatsRow}>
              <View style={[styles.empStatCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
                <Text style={[styles.empStatValue, { color: '#0084FF' }]}>{totalJobsCount}</Text>
                <Text style={styles.empStatLabel}>Tin đã đăng</Text>
              </View>
              <View style={[styles.empStatCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
                <Text style={[styles.empStatValue, { color: '#0084FF' }]}>{activeJobsCount}</Text>
                <Text style={styles.empStatLabel}>Đang tuyển</Text>
              </View>
              <View style={[styles.empStatCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
                <Text style={[styles.empStatValue, { color: '#0084FF' }]}>{totalApplicants}</Text>
                <Text style={styles.empStatLabel}>Ứng viên</Text>
              </View>
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
            {displayJobs.length === 0 ? (
              <View style={[styles.empEmptyJobsBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
                <Ionicons name="file-tray-outline" size={34} color="#8E8E93" />
                <Text style={[styles.empEmptyJobsTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Chưa có tin tuyển dụng
                </Text>
                <Text style={styles.empEmptyJobsText}>
                  Các bài đăng thật của công ty sẽ hiển thị tại đây sau khi bạn đăng tin.
                </Text>
              </View>
            ) : (
              displayJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    router.push({
                      pathname: '/job-details',
                      params: {
                        jobId: job.id,
                        title: job.title,
                        salary: job.salary,
                        location: address,
                      },
                    });
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
              ))
            )}
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
                    {pkg.duration ? ` / ${pkg.duration}` : ''}
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
                  {renderSettingRow('key-outline', 'Đổi mật khẩu tài khoản', () => setIsChangePasswordModalVisible(true))}
                  {renderSettingRow('receipt-outline', 'Lịch sử giao dịch', () => router.push('/recruiter/transactions' as any))}
                  {renderSettingRow('notifications-outline', 'Cài đặt thông báo', () => {
                    Alert.alert('Cài đặt thông báo', 'Thông báo đẩy (Push Notifications) và Email thông báo ứng viên mới hiện đang được BẬT.', [{ text: 'Đóng' }]);
                  })}
                  {renderSettingRow('call-outline', 'Tổng đài Hỗ trợ CSKH 24/7 (1900 6888)', () => {
                    Alert.alert(
                      'Tổng đài CSKH VIP',
                      'Bạn có muốn gọi trực tiếp tới Tổng đài hỗ trợ tuyển dụng 1900 6888 không?',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Gọi ngay', onPress: () => Linking.openURL('tel:19006888') }
                      ]
                    );
                  })}
                  {renderSettingRow('chatbubbles-outline', 'Hỗ trợ trực tuyến / Zalo OA', () => {
                    Alert.alert(
                      'Hỗ trợ trực tuyến',
                      'Gửi email hỗ trợ trực tiếp đến bộ phận Chăm sóc khách hàng BybitJobs:',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Gửi Mail CSKH', onPress: () => Linking.openURL('mailto:support@bybitjobs.com?subject=Ho%20tro%20Nha%20tuyen%20dung') }
                      ]
                    );
                  })}
                  {renderSettingRow('book-outline', 'Hướng dẫn đăng tin & Mẹo tuyển dụng', () => setIsGuideModalVisible(true))}
                  {renderSettingRow('alert-circle-outline', 'Vô hiệu hóa tài khoản doanh nghiệp', () => {
                    Alert.alert(
                      'Xác nhận vô hiệu hóa tài khoản',
                      'Bạn có chắc chắn muốn vô hiệu hóa tài khoản Nhà tuyển dụng không? Tất cả tin tuyển dụng đang mở sẽ tạm ẩn khỏi hệ thống.',
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Vô hiệu hóa ngay',
                          style: 'destructive',
                          onPress: async () => {
                            const res = await disableAccount();
                            if (res.success) {
                              Alert.alert('Đã vô hiệu hóa', res.message, [
                                {
                                  text: 'Đăng xuất',
                                  onPress: async () => {
                                    await logout();
                                    router.replace('/(tabs)');
                                  }
                                }
                              ]);
                            } else {
                              Alert.alert('Thất bại', res.message);
                            }
                          }
                        }
                      ]
                    );
                  })}
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

        {/* Custom Raised FAB Bottom Navigation Bar for Recruiter */ }
            {
              false && (
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

                  <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/my-jobs')} style={styles.navItem}>
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
              )
            }
        {/* Modal Đổi mật khẩu cho Nhà tuyển dụng */}
        <Modal
          visible={isChangePasswordModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsChangePasswordModalVisible(false)}
        >
          <View style={styles.modalOverlayCenter}>
            <View style={[styles.passwordModalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitleText, { color: isDark ? '#FFF' : '#11181C' }]}>Đổi mật khẩu tài khoản</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setIsChangePasswordModalVisible(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#AAA' : '#687076'} />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 13, color: isDark ? '#9BA1A6' : '#687076', marginBottom: 16 }}>
                Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để bảo mật tài khoản doanh nghiệp.
              </Text>

              {/* Input 1: Mật khẩu hiện tại */}
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C', marginBottom: 6 }]}>Mật khẩu hiện tại</Text>
              <View style={[styles.inputBox, { backgroundColor: isDark ? '#151718' : '#F8F9FA', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C', flex: 1 }]}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPasswordInput}
                  onChangeText={setCurrentPasswordInput}
                />
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {/* Input 2: Mật khẩu mới */}
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C', marginTop: 12, marginBottom: 6 }]}>Mật khẩu mới</Text>
              <View style={[styles.inputBox, { backgroundColor: isDark ? '#151718' : '#F8F9FA', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C', flex: 1 }]}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  secureTextEntry={!showNewPassword}
                  value={newPasswordInput}
                  onChangeText={setNewPasswordInput}
                />
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {/* Input 3: Xác nhận mật khẩu mới */}
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFF' : '#11181C', marginTop: 12, marginBottom: 6 }]}>Xác nhận mật khẩu mới</Text>
              <View style={[styles.inputBox, { backgroundColor: isDark ? '#151718' : '#F8F9FA', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C', flex: 1 }]}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPasswordInput}
                  onChangeText={setConfirmPasswordInput}
                />
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsChangePasswordModalVisible(false)}
                  style={{ flex: 1, height: 46, borderRadius: 10, borderWidth: 1, borderColor: isDark ? '#444' : '#CCC', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={{ color: isDark ? '#AAA' : '#666', fontWeight: '600' }}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isSubmittingPassword}
                  onPress={async () => {
                    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
                      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các thông tin.');
                      return;
                    }
                    if (newPasswordInput.length < 6) {
                      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
                      return;
                    }
                    if (newPasswordInput !== confirmPasswordInput) {
                      Alert.alert('Lỗi', 'Mật khẩu xác nhận không trùng khớp.');
                      return;
                    }
                    setIsSubmittingPassword(true);
                    try {
                      const res = await changePassword(currentPasswordInput, newPasswordInput);
                      if (res.success) {
                        Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
                        setIsChangePasswordModalVisible(false);
                        setCurrentPasswordInput('');
                        setNewPasswordInput('');
                        setConfirmPasswordInput('');
                      } else {
                        Alert.alert('Thất bại', res.message || 'Không thể đổi mật khẩu.');
                      }
                    } catch (e: any) {
                      Alert.alert('Lỗi', e.message || 'Đã xảy ra lỗi.');
                    } finally {
                      setIsSubmittingPassword(false);
                    }
                  }}
                  style={{ flex: 1.5, height: 46, borderRadius: 10, backgroundColor: '#0084FF', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>
                    {isSubmittingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Hướng dẫn tuyển dụng */}
        <Modal
          visible={isGuideModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsGuideModalVisible(false)}
        >
          <View style={styles.modalOverlayCenter}>
            <View style={[styles.passwordModalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', maxHeight: '80%' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitleText, { color: isDark ? '#FFF' : '#11181C' }]}>💡 Mẹo tuyển dụng hiệu quả</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setIsGuideModalVisible(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#AAA' : '#687076'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0084FF', marginBottom: 4 }}>1. Viết tiêu đề rõ ràng, cụ thể</Text>
                <Text style={{ fontSize: 13, color: isDark ? '#CCC' : '#444', lineHeight: 20, marginBottom: 12 }}>
                  Nên bao gồm tên vị trí + cấp bậc + địa điểm. Ví dụ: "Lập trình viên React Native (Junior / Senior) - Q.7, TP.HCM".
                </Text>

                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0084FF', marginBottom: 4 }}>2. Mức lương minh bạch</Text>
                <Text style={{ fontSize: 13, color: isDark ? '#CCC' : '#444', lineHeight: 20, marginBottom: 12 }}>
                  Các tin tuyển dụng có khoảng lương rõ ràng (Ví dụ: 15 - 25 triệu) nhận được nhiều hơn 60% lượt ứng tuyển so với "Thỏa thuận".
                </Text>

                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0084FF', marginBottom: 4 }}>3. Yêu cầu & Mô tả công việc chi tiết</Text>
                <Text style={{ fontSize: 13, color: isDark ? '#CCC' : '#444', lineHeight: 20, marginBottom: 12 }}>
                  Liệt kê từ 3-5 trách nhiệm chính và 3-5 kỹ năng bắt buộc giúp con AI chấm điểm Match Score ứng viên đạt độ chính xác cao nhất.
                </Text>

                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0084FF', marginBottom: 4 }}>4. Phản hồi ứng viên nhanh chóng</Text>
                <Text style={{ fontSize: 13, color: isDark ? '#CCC' : '#444', lineHeight: 20, marginBottom: 12 }}>
                  Phê duyệt hoặc gửi Email cho ứng viên trong vòng 48h để giữ chân các ứng viên tài năng.
                </Text>
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsGuideModalVisible(false)}
                style={{ height: 44, borderRadius: 10, backgroundColor: '#0084FF', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Đã hiểu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  profileHeaderBg: {
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
    position: 'relative',
    zIndex: 2,
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
    position: 'absolute',
    left: 64,
    right: 64,
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
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
  empProfileCard: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  empHeroSection: {
    height: 118,
    width: '100%',
    position: 'relative',
  },
  empBannerImage: {
    width: '100%',
    height: '100%',
  },
  empLogoWrapper: {
    position: 'absolute',
    bottom: -38,
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
    marginTop: 48,
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  empCompanyName: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 25,
    flexShrink: 1,
  },
  empLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 6,
    gap: 4,
    paddingHorizontal: 12,
  },
  empLocationText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    flexShrink: 1,
  },
  empStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  empStatCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 0,
  },
  empStatValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  empStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '700',
    textAlign: 'center',
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
  empEmptyJobsBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  empEmptyJobsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  empEmptyJobsText: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 17,
    textAlign: 'center',
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

  // Custom Branch Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  branchModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveBranchBtn: {
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  saveBranchBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
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
  industryOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
});
