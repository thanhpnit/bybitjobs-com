import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

type CompanySuggestion = {
  id: string;
  name: string;
  description?: string;
};

const COMPANY_KEYWORDS = [
  'công ty',
  'doanh nghiệp',
  'tập đoàn',
  'corporation',
  'company',
  'enterprise',
  'business',
  'inc.',
  'incorporated',
  'limited',
  'ltd',
  'plc',
  'jsc',
  'joint stock',
  'multinational',
  'conglomerate',
  'startup',
];

const looksLikeCompany = (suggestion: CompanySuggestion) => {
  const text = `${suggestion.name} ${suggestion.description || ''}`.toLowerCase();
  return COMPANY_KEYWORDS.some((keyword) => text.includes(keyword));
};

const buildCompanyAddressQuery = (companyId: string) => `
SELECT ?headquartersLabel ?locatedLabel ?countryLabel ?street WHERE {
  OPTIONAL {
    wd:${companyId} wdt:P159 ?headquarters.
    OPTIONAL { ?headquarters wdt:P6375 ?street. }
    OPTIONAL { ?headquarters wdt:P131 ?located. }
    OPTIONAL { ?headquarters wdt:P17 ?country. }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "vi,en". }
}
LIMIT 1
`;

const getCompanyAddress = async (companyId: string) => {
  if (!/^Q\d+$/.test(companyId)) return '';

  const response = await fetch(
    `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(buildCompanyAddressQuery(companyId))}`
  );
  const data = await response.json();
  const result = data?.results?.bindings?.[0];

  if (!result) return '';

  const parts = [
    result.street?.value,
    result.headquartersLabel?.value,
    result.locatedLabel?.value,
    result.countryLabel?.value,
  ].filter(Boolean);

  return Array.from(new Set(parts)).join(', ');
};

export default function RecruiterRegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { registerEmployer } = useAuth();

  // Input states
  const [companyName, setCompanyName] = React.useState('');
  const [taxId, setTaxId] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [companySuggestions, setCompanySuggestions] = React.useState<CompanySuggestion[]>([]);
  const [isSearchingCompany, setIsSearchingCompany] = React.useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = React.useState(false);
  const [isLoadingCompanyAddress, setIsLoadingCompanyAddress] = React.useState(false);

  React.useEffect(() => {
    const keyword = companyName.trim();

    if (keyword.length < 1 || !showCompanySuggestions) {
      setCompanySuggestions([]);
      setIsSearchingCompany(false);
      return;
    }

    let isActive = true;
    setIsSearchingCompany(true);

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`http://160.250.246.119:4000/api/companies/suggest?q=${encodeURIComponent(keyword)}`);
        const suggestions = await response.json();

        if (!isActive) return;

        setCompanySuggestions(Array.isArray(suggestions) ? suggestions : []);
      } catch {
        if (isActive) {
          setCompanySuggestions([]);
        }
      } finally {
        if (isActive) {
          setIsSearchingCompany(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [companyName, showCompanySuggestions]);

  const handleSelectCompanySuggestion = (suggestion: CompanySuggestion) => {
    setCompanyName(suggestion.name);
    setCompanySuggestions([]);
    setShowCompanySuggestions(false);
    if (suggestion.description) {
      setAddress(suggestion.description);
    }
  };

  const handleRegister = () => {
    // 1. Validation Logic
    if (!companyName.trim()) {
      Alert.alert('Cảnh báo', 'Tên công ty/Tổ chức không được để trống.');
      return;
    }
    if (!taxId.trim()) {
      Alert.alert('Cảnh báo', 'Mã số thuế bắt buộc phải điền.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Cảnh báo', 'Số điện thoại liên hệ không được để trống.');
      return;
    }
    if (isLoadingCompanyAddress) {
      Alert.alert('Cảnh báo', 'Vui lòng đợi hệ thống lấy địa chỉ công ty.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Cảnh báo', 'Vui lòng chọn công ty từ danh sách gợi ý để tự lấy địa chỉ.');
      return;
    }

    // 2. Perform Mock Registration & Role Upgrade
    registerEmployer({
      companyName,
      taxId,
      phoneNumber: phone,
      address,
    });

    // 3. Show Success & Redirect to Candidate Profile Screen
    Alert.alert(
      'Đăng ký thành công',
      'Yêu cầu đăng ký tài khoản tuyển dụng của bạn đã được gửi thành công. Vui lòng đợi Admin phê duyệt thông tin để có thể sử dụng giao diện tuyển dụng.',
      [
        {
          text: 'Đồng ý',
          onPress: () => {
            router.replace('/(tabs)/profile');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F5F7FA' }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.navBar, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#11181C'} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
          Đăng ký Nhà tuyển dụng
        </Text>
        <View style={styles.navPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Card Wrapper */}
          <View style={[styles.formCard, isDark && styles.formCardDark]}>
            {/* Header Text */}
            <Text style={styles.headerTitle}>Tạo hồ sơ doanh nghiệp</Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? '#9BA1A6' : '#687076' }]}>
              Điền thông tin dưới đây để bắt đầu đăng tin và tìm kiếm ứng viên phù hợp trên hệ thống của chúng tôi.
            </Text>

            {/* Input fields */}
            {/* Input 1: Company Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFF' : '#11181C' }]}>
                Tên công ty/Tổ chức
              </Text>
              <View style={[styles.inputWrapper, { borderColor: isDark ? '#2C2C2E' : '#D1D5DB', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                <Ionicons name="business-outline" size={20} color="#8E8E93" style={styles.leftIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Ví dụ: Công ty TNHH ABC"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  value={companyName}
                  onFocus={() => setShowCompanySuggestions(true)}
                  onChangeText={(text) => {
                    setCompanyName(text);
                    setAddress('');
                    setShowCompanySuggestions(true);
                  }}
                />
                {isSearchingCompany && (
                  <ActivityIndicator size="small" color="#0084FF" />
                )}
              </View>
              {showCompanySuggestions && companySuggestions.length > 0 && (
                <View style={[styles.suggestionBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#D1D5DB' }]}>
                  {companySuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      activeOpacity={0.75}
                      style={[styles.suggestionItem, { borderBottomColor: isDark ? '#2C2C2E' : '#EEF0F3' }]}
                      onPress={() => handleSelectCompanySuggestion(suggestion)}
                    >
                      <Ionicons name="business" size={18} color="#0084FF" style={styles.suggestionIcon} />
                      <View style={styles.suggestionTextWrap}>
                        <Text numberOfLines={1} style={[styles.suggestionName, { color: isDark ? '#FFF' : '#11181C' }]}>
                          {suggestion.name}
                        </Text>
                        {!!suggestion.description && (
                          <Text numberOfLines={1} style={styles.suggestionDesc}>
                            {suggestion.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Input 2: Tax Code */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Mã số thuế
                </Text>
                <Text style={styles.requiredStar}> *</Text>
              </View>
              <View style={[styles.inputWrapper, { borderColor: isDark ? '#2C2C2E' : '#D1D5DB', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                <Ionicons name="card-outline" size={20} color="#8E8E93" style={styles.leftIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Nhập mã số thuế doanh nghiệp"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  keyboardType="numeric"
                  value={taxId}
                  onChangeText={setTaxId}
                />
              </View>
              <Text style={styles.subtext}>Thông tin bắt buộc để xác thực doanh nghiệp.</Text>
            </View>

            {/* Input 3: Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFF' : '#11181C' }]}>
                Số điện thoại liên hệ
              </Text>
              <View style={[styles.inputWrapper, { borderColor: isDark ? '#2C2C2E' : '#D1D5DB', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                <Ionicons name="call-outline" size={20} color="#8E8E93" style={styles.leftIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Số điện thoại người đại diện hoặc công ty"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Input 4: Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#FFF' : '#11181C' }]}>
                Địa chỉ công ty
              </Text>
              <View style={[styles.textareaWrapper, { borderColor: isDark ? '#2C2C2E' : '#D1D5DB', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                <Ionicons name="location-outline" size={20} color="#8E8E93" style={[styles.leftIcon, { marginTop: 2 }]} />
                <TextInput
                  style={[styles.textareaInput, { color: isDark ? '#FFF' : '#11181C' }]}
                  placeholder="Chọn công ty ở trên để tự lấy địa chỉ"
                  placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                  editable={false}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={address}
                />
                {isLoadingCompanyAddress && (
                  <ActivityIndicator size="small" color="#0084FF" style={styles.addressLoading} />
                )}
              </View>
              <Text style={styles.subtext}>Địa chỉ được tự động lấy theo công ty đã chọn.</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }]} />

            {/* Large Blue Submit Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRegister}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Xác nhận đăng ký</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={styles.submitIcon} />
            </TouchableOpacity>

            {/* Terms and Privacy Notes */}
            <Text style={[styles.noteText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
              Bằng việc xác nhận đăng ký, bạn đồng ý với{' '}
              <Text style={styles.linkText}>Điều khoản dịch vụ</Text> và{' '}
              <Text style={styles.linkText}>Chính sách bảo mật</Text> của chúng tôi.
            </Text>
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
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  navPlaceholder: {
    width: 32,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  formCardDark: {
    backgroundColor: '#1C1C1E',
    shadowOpacity: 0.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0084FF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  suggestionBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionDesc: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  subtext: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  textareaWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 100,
  },
  textareaInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 80,
  },
  addressLoading: {
    marginLeft: 8,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#0084FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    width: '100%',
    elevation: 3,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  submitIcon: {
    marginLeft: 8,
  },
  noteText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 10,
  },
  linkText: {
    color: '#0084FF',
    fontWeight: '700',
  },
});
