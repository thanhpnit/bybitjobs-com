import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface CvPdfViewerModalProps {
  visible: boolean;
  onClose: () => void;
  cvUrl: string;
  cvName?: string;
  fullName?: string;
  desiredJob?: string;
  phone?: string;
  email?: string;
}

// Hàm hỗ trợ tạo nội dung CV động dựa trên công việc mong muốn
function getCVDataByJob(desiredJob: string = '') {
  const jobLower = desiredJob.toLowerCase();
  
  if (
    jobLower.includes('lập trình') || 
    jobLower.includes('developer') || 
    jobLower.includes('engineer') || 
    jobLower.includes('dev') || 
    jobLower.includes('phần mềm') || 
    jobLower.includes('cntt') || 
    jobLower.includes('tech') || 
    jobLower.includes('web') || 
    jobLower.includes('mobile')
  ) {
    return {
      introduction: "Lập trình viên năng động với kinh nghiệm phát triển các ứng dụng di động và web hiệu năng cao. Thành thạo nhiều công nghệ hiện đại và luôn hướng tới trải nghiệm người dùng tốt nhất.",
      experience: [
        {
          role: "Senior Mobile Developer",
          company: "TechVibe Solutions",
          duration: "2024 - Hiện tại",
          description: "Phát triển ứng dụng di động tuyển dụng BybitJobs sử dụng React Native, tối ưu hóa tốc độ tải trang thêm 30% và cải thiện trải nghiệm người dùng trên iOS & Android.",
          isCurrent: true
        },
        {
          role: "Frontend Developer",
          company: "VNG Corporation",
          duration: "2022 - 2024",
          description: "Xây dựng các giao diện web responsive cho các sản phẩm giải trí lớn, phối hợp chặt chẽ với đội ngũ UI/UX thiết kế trải nghiệm tối ưu.",
          isCurrent: false
        }
      ],
      skills: ["React Native", "ReactJS", "TypeScript", "NodeJS", "Firebase", "Git", "RESTful API"],
      education: "Đại học Bách Khoa TP.HCM - Kỹ thuật Phần mềm (2018 - 2022)"
    };
  }
  
  if (
    jobLower.includes('thiết kế') || 
    jobLower.includes('design') || 
    jobLower.includes('ux') || 
    jobLower.includes('ui') || 
    jobLower.includes('đồ họa') || 
    jobLower.includes('figma')
  ) {
    return {
      introduction: "Nhà thiết kế sản phẩm sáng tạo, tập trung vào việc kiến tạo những trải nghiệm người dùng trực quan, tinh tế và giải quyết hiệu quả các bài toán kinh doanh của doanh nghiệp.",
      experience: [
        {
          role: "UI/UX Designer",
          company: "Innovate Studio",
          duration: "2024 - Hiện tại",
          description: "Nghiên cứu hành vi người dùng, thiết kế wireframes, prototypes và hoàn thiện giao diện cho các sản phẩm Smart Home IoT.",
          isCurrent: true
        },
        {
          role: "Graphic Designer",
          company: "Media Plus Agency",
          duration: "2022 - 2024",
          description: "Thực hiện hơn 100+ chiến dịch quảng cáo kỹ thuật số, thiết kế ấn phẩm truyền thông cho nhiều thương hiệu lớn.",
          isCurrent: false
        }
      ],
      skills: ["Figma", "Adobe XD", "Photoshop", "Illustrator", "Wireframing", "Prototyping", "User Research"],
      education: "Đại học Mỹ thuật TP.HCM - Thiết kế Đồ họa (2018 - 2022)"
    };
  }
  
  if (
    jobLower.includes('marketing') || 
    jobLower.includes('mkt') || 
    jobLower.includes('seo') || 
    jobLower.includes('content') || 
    jobLower.includes('truyền thông') || 
    jobLower.includes('quảng cáo')
  ) {
    return {
      introduction: "Chuyên viên Marketing sáng tạo, nhạy bén với xu hướng thị trường, thế mạnh về lên chiến lược nội dung đa kênh và tối ưu hóa tỷ lệ chuyển đổi.",
      experience: [
        {
          role: "Marketing Specialist",
          company: "BrandGrowth Agency",
          duration: "2024 - Hiện tại",
          description: "Lên kế hoạch và triển khai các chiến dịch SEO, Social Media giúp tăng lượt tiếp cận tự nhiên thêm 80% và tối ưu hóa phễu chuyển đổi.",
          isCurrent: true
        },
        {
          role: "Content Creator",
          company: "VCCorp",
          duration: "2022 - 2024",
          description: "Quản lý và sáng tạo nội dung truyền thông cho các trang thông tin lớn, thu hút hàng triệu lượt xem mỗi tháng.",
          isCurrent: false
        }
      ],
      skills: ["SEO/SEM", "Content Strategy", "Google Analytics", "Social Media", "Copywriting", "Creative Writing"],
      education: "Đại học Kinh tế Quốc dân - Quản trị Marketing (2018 - 2022)"
    };
  }

  if (
    jobLower.includes('bán hàng') || 
    jobLower.includes('sales') || 
    jobLower.includes('tư vấn') || 
    jobLower.includes('chăm sóc') || 
    jobLower.includes('customer') || 
    jobLower.includes('kinh doanh')
  ) {
    return {
      introduction: "Chuyên viên tư vấn bán hàng tận tâm, có kỹ năng giao tiếp và thuyết phục tốt, luôn nỗ lực vượt chỉ tiêu doanh số và mang lại sự hài lòng cao nhất cho khách hàng.",
      experience: [
        {
          role: "Account Executive",
          company: "FPT Telecom",
          duration: "2024 - Hiện tại",
          description: "Tư vấn và ký kết hợp đồng dịch vụ viễn thông cho khách hàng doanh nghiệp vừa và nhỏ, luôn đạt vượt 110% KPI doanh số tháng.",
          isCurrent: true
        },
        {
          role: "Sales Associate",
          company: "VinGroup",
          duration: "2022 - 2024",
          description: "Tiếp đón khách hàng tại showroom, tư vấn giải pháp phù hợp và duy trì quan hệ thân thiết với nhóm khách hàng trung thành.",
          isCurrent: false
        }
      ],
      skills: ["Sales & Consultant", "Customer Service", "Negotiation", "Communication", "CRM Tools", "Presentation"],
      education: "Đại học Thương mại - Quản trị Kinh doanh (2018 - 2022)"
    };
  }

  if (
    jobLower.includes('nhà hàng') || 
    jobLower.includes('f&b') || 
    jobLower.includes('phục vụ') || 
    jobLower.includes('barista') || 
    jobLower.includes('pha chế') || 
    jobLower.includes('cà phê') || 
    jobLower.includes('coffee') || 
    jobLower.includes('dịch vụ')
  ) {
    return {
      introduction: "Nhân viên ngành dịch vụ F&B chuyên nghiệp, có tay nghề pha chế tốt và tác phong phục vụ chu đáo, thân thiện, làm việc tốt dưới áp lực cao.",
      experience: [
        {
          role: "Shift Leader / Barista",
          company: "The Coffee House",
          duration: "2024 - Hiện tại",
          description: "Pha chế các đồ uống tiêu chuẩn, điều phối nhân viên ca làm và quản lý doanh thu quầy bar.",
          isCurrent: true
        },
        {
          role: "Server",
          company: "Golden Gate Group",
          duration: "2023 - 2024",
          description: "Tiếp đón và phục vụ khách hàng chu đáo theo quy trình chuyên nghiệp, giải quyết các phản hồi của khách hàng tại bàn.",
          isCurrent: false
        }
      ],
      skills: ["Customer Care", "Food & Beverage", "Barista Skills", "Teamwork", "Time Management", "Problem Solving"],
      education: "Trung cấp Du lịch & Khách sạn Saigontourist (2021 - 2023)"
    };
  }

  // Mặc định (Default)
  return {
    introduction: "Ứng viên nhiệt huyết, có khả năng thích nghi và học hỏi nhanh chóng. Mong muốn được cống hiến hết mình tại môi trường chuyên nghiệp để tạo lập giá trị bền vững.",
    experience: [
      {
        role: "Nhân viên Vận hành",
        company: "Công ty Cổ phần Công nghệ Việt",
        duration: "2024 - Hiện tại",
        description: "Tham gia hỗ trợ khách hàng, vận hành quy trình văn phòng và báo cáo tiến độ công việc nội bộ hàng tuần.",
        isCurrent: true
      },
      {
        role: "Cộng tác viên Dự án",
        company: "Nhiều đối tác liên kết",
        duration: "2022 - 2024",
        description: "Hỗ trợ các công việc nghiên cứu dữ liệu, tư vấn khách hàng qua điện thoại và ghi nhận thông tin hệ thống.",
        isCurrent: false
      }
    ],
    skills: ["Giao tiếp", "Làm việc nhóm", "Giải quyết vấn đề", "Tin học văn phòng", "Quản lý thời gian"],
    education: "Đại học Quốc gia TP.HCM (2018 - 2022)"
  };
}

export default function CvPdfViewerModal({
  visible,
  onClose,
  cvUrl,
  cvName = 'CV_Tai_Lieu.pdf',
  fullName = 'Người dùng',
  desiredJob = 'Ứng viên',
  phone = 'Chưa cập nhật',
  email = 'Chưa cập nhật',
}: CvPdfViewerModalProps) {
  const [loadError, setLoadError] = React.useState(false);
  const [key, setKey] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<'pdf' | 'html'>(cvUrl && cvUrl.startsWith('http') ? 'pdf' : 'html');

  React.useEffect(() => {
    if (visible) {
      setLoadError(false);
      setViewMode(cvUrl && cvUrl.startsWith('http') ? 'pdf' : 'html');
    }
  }, [visible, cvUrl]);

  // Kiểm tra xem có nên render dạng HTML CV mẫu hay không
  const shouldRenderHtml = () => {
    const url = cvUrl || '';
    const isLocalUri = url.startsWith('content://') || url.startsWith('file://');
    const isMockFilename = !url.startsWith('http://') && !url.startsWith('https://');
    
    // Trên Android, WebView thô không hỗ trợ file cục bộ/mock qua Google Docs Viewer nên ta sẽ render HTML CV cực kỳ đẹp mắt
    if (Platform.OS === 'android') {
      return isLocalUri || isMockFilename || url === '';
    }
    // Trên iOS, WebView kết xuất PDF thô và local PDF cực kỳ tốt, nên chỉ render HTML nếu không có file thực tế
    return url === '';
  };

  const renderHtmlSource = shouldRenderHtml();

  // Tạo tài liệu HTML CV
  const getHtmlContent = () => {
    const data = getCVDataByJob(desiredJob);
    
    const experienceHtml = data.experience.map(exp => `
      <div class="exp-item">
        <div class="exp-header">
          <span>${exp.role}</span>
          <span style="font-weight: 500; font-size: 12px; color: #8E8E93;">${exp.duration}</span>
        </div>
        <div class="exp-company">${exp.company}</div>
        <div class="exp-desc">${exp.description}</div>
      </div>
    `).join('');

    const skillsHtml = data.skills.map(skill => `
      <span class="skill-tag">${skill}</span>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 16px;
            color: #333;
            background-color: #f4f5f7;
          }
          .cv-card {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
            border-top: 6px solid #0084ff;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .name {
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 6px 0;
            color: #111;
          }
          .title {
            font-size: 14px;
            color: #0084ff;
            font-weight: 600;
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .contact {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 12px;
            font-size: 12px;
            color: #687076;
          }
          .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #0084ff;
            border-bottom: 2px solid #ebf5ff;
            padding-bottom: 6px;
            margin-top: 24px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .intro {
            font-size: 13px;
            line-height: 1.6;
            color: #444;
          }
          .exp-item {
            margin-bottom: 14px;
          }
          .exp-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 13px;
            color: #111;
          }
          .exp-company {
            color: #0084ff;
            font-size: 12px;
            margin-top: 2px;
            font-weight: 500;
          }
          .exp-desc {
            font-size: 12px;
            color: #666;
            line-height: 1.5;
            margin-top: 4px;
          }
          .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
          }
          .skill-tag {
            background: #ebf5ff;
            color: #0084ff;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            margin-top: 32px;
            font-size: 10px;
            color: #8E8E93;
            border-top: 1px solid #eee;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="cv-card">
          <div class="header">
            <div class="name">${fullName}</div>
            <div class="title">${desiredJob}</div>
            <div class="contact">
              <span>📞 ${phone}</span>
              <span>✉️ ${email}</span>
            </div>
          </div>
          
          <div class="section-title">Giới thiệu bản thân</div>
          <div class="intro">${data.introduction}</div>
          
          <div class="section-title">Kinh nghiệm làm việc</div>
          ${experienceHtml}
          
          <div class="section-title">Kỹ năng chính</div>
          <div class="skills">
            ${skillsHtml}
          </div>
          
          <div class="section-title">Học vấn</div>
          <div class="intro">${data.education}</div>
          
          <div class="footer">
            Tệp tin CV gốc: ${cvName} <br>
            Bảo mật bởi hệ thống BybitJobs © 2026
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Trả về dữ liệu WebView nguồn
  const webViewSource = React.useMemo(() => {
    if (viewMode === 'pdf' && cvUrl) {
      if (Platform.OS === 'android') {
        return { uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(cvUrl)}` };
      }
      return { uri: cvUrl };
    }
    return { html: getHtmlContent() };
  }, [viewMode, cvUrl, cvName, fullName, desiredJob, phone, email]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.title, { flex: 1, marginHorizontal: 8 }]} numberOfLines={1}>
            {cvName || 'Hồ sơ CV Ứng viên'}
          </Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* In-App Tab Switcher */}
        {cvUrl ? (
          <View style={{ flexDirection: 'row', backgroundColor: '#0066CC', padding: 3, marginHorizontal: 16, marginBottom: 8, borderRadius: 10 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setViewMode('pdf')}
              style={{
                flex: 1,
                paddingVertical: 7,
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor: viewMode === 'pdf' ? '#FFFFFF' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: viewMode === 'pdf' ? '#0084FF' : '#E0F2FE' }}>
                📑 Tệp PDF Gốc
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setViewMode('html')}
              style={{
                flex: 1,
                paddingVertical: 7,
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor: viewMode === 'html' ? '#FFFFFF' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: viewMode === 'html' ? '#0084FF' : '#E0F2FE' }}>
                📄 Bản Hồ Sơ Chuẩn
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* WebView Container */}
        <View style={styles.container}>
          <WebView
            key={`${key}-${viewMode}`}
            source={webViewSource}
            style={styles.webview}
            scalesPageToFit={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            originWhitelist={['*']}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0084FF" />
                <Text style={styles.loadingText}>Đang tải tài liệu CV trực tiếp...</Text>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0084FF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0084FF',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#11181C',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0084FF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
