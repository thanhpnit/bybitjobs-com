// scripts/seed-clean-demo-data.cjs
// Script dọn sạch dữ liệu rác trên Firestore và nạp dữ liệu demo chuẩn hóa cho BybitJobs

const { initializeApp } = require('c:/Users/LENOVO/Desktop/bybitjobs-com/bybitjobs-mobile-app/node_modules/firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp
} = require('c:/Users/LENOVO/Desktop/bybitjobs-com/bybitjobs-mobile-app/node_modules/firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAJrjqkcxdI7N4tc5H6vF-FnVcCyv3NsLc",
  authDomain: "bybitjobs.firebaseapp.com",
  projectId: "bybitjobs",
  storageBucket: "bybitjobs.firebasestorage.app",
  messagingSenderId: "811135097267",
  appId: "1:811135097267:web:dab5c4e8ea4dee79cd93c6",
  measurementId: "G-9K2536WERT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to delete all documents in a collection
async function clearCollection(colName) {
  try {
    const snapshot = await getDocs(collection(db, colName));
    console.log(`🧹 Đang xóa sạch collection [${colName}] (${snapshot.size} bản ghi)...`);
    let deletedCount = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, colName, docSnap.id));
      deletedCount++;
    }
    console.log(`✅ Đã xóa ${deletedCount} bản ghi khỏi [${colName}].`);
  } catch (error) {
    console.warn(`⚠️ Lỗi khi xóa collection [${colName}]:`, error.message);
  }
}

// 1. DANH MỤC NGÀNH NGHỀ CHUẨN
const standardIndustries = [
  { id: 'ind-1', name: 'Công nghệ thông tin (IT)', desc: 'Lập trình viên, Kiểm thử phần mềm, Quản trị hệ thống & Cloud', posts: 142, status: 'Active' },
  { id: 'ind-2', name: 'Marketing / Truyền thông', desc: 'Digital Marketing, Content Creator, Quản trị thương hiệu, SEO/SEM', posts: 98, status: 'Active' },
  { id: 'ind-3', name: 'Tài chính / Ngân hàng', desc: 'Kế toán tổng hợp, Kiểm toán, Chuyên viên phân tích tài chính', posts: 76, status: 'Active' },
  { id: 'ind-4', name: 'Bán lẻ / Tiêu dùng', desc: 'Quản lý cửa hàng, Nhân viên bán hàng, Giám sát bán lẻ', posts: 110, status: 'Active' },
  { id: 'ind-5', name: 'Quản trị Nhân sự / Tuyển dụng', desc: 'Chuyên viên tuyển dụng Talent Acquisition, C&B, HR Generalist', posts: 55, status: 'Active' },
  { id: 'ind-6', name: 'Thiết kế / Sáng tạo nghệ thuật', desc: 'UI/UX Product Designer, Đồ họa truyền thông, Video Motion Editor', posts: 45, status: 'Active' },
  { id: 'ind-7', name: 'Du lịch / Khách sạn / F&B', desc: 'Quản lý nhà hàng, Bếp trưởng, Pha chế Barista, Chăm sóc khách hàng', posts: 68, status: 'Active' },
  { id: 'ind-8', name: 'Logistics / Vận tải / Kho bãi', desc: 'Điều phối logistics quốc tế, Quản lý kho vận, Xuất nhập khẩu', posts: 52, status: 'Active' }
];

// 2. KỸ NĂNG CHUẨN
const standardSkills = [
  { id: 'sk-1', name: 'React Native & Flutter', desc: 'Phát triển ứng dụng di động đa nền tảng', category: 'Công nghệ thông tin', posts: 24, status: 'Active' },
  { id: 'sk-2', name: 'Node.js & Cloud Architecture', desc: 'Xây dựng kiến trúc API Microservices và Cloud', category: 'Công nghệ thông tin', posts: 18, status: 'Active' },
  { id: 'sk-3', name: 'UI/UX Design (Figma)', desc: 'Thiết kế hệ thống Design System và trải nghiệm người dùng', category: 'Thiết kế', posts: 15, status: 'Active' },
  { id: 'sk-4', name: 'Digital Marketing & Ads', desc: 'Thực thi Performance Ads (Meta, Google, TikTok)', category: 'Marketing', posts: 22, status: 'Active' },
  { id: 'sk-5', name: 'Talent Acquisition & Interviewing', desc: 'Kỹ năng tìm kiếm ứng viên và phỏng vấn đánh giá', category: 'Nhân sự', posts: 12, status: 'Active' },
  { id: 'sk-6', name: 'Financial Modeling & Analysis', desc: 'Phân tích báo cáo tài chính và thẩm định dự án', category: 'Tài chính', posts: 10, status: 'Active' },
  { id: 'sk-7', name: 'Store Management & Customer Care', desc: 'Kỹ năng quản lý điểm bán và dịch vụ khách hàng', category: 'Bán lẻ', posts: 16, status: 'Active' },
  { id: 'sk-8', name: 'Barista & F&B Operations', desc: 'Kỹ thuật pha chế và vận hành quầy dịch vụ ẩm thực', category: 'F&B', posts: 8, status: 'Active' }
];

// 3. GÓI DỊCH VỤ CHUẨN
const standardPackages = [
  {
    id: 'starter',
    name: 'Starter (Cơ bản)',
    price: '0 VNĐ',
    priceNum: 0,
    period: '/ tháng',
    posts: '5 tin',
    maxPosts: 5,
    cvs: '50 / bài',
    maxCVs: 50,
    users: '1,240',
    iconName: 'User',
    badge: 'CƠ BẢN',
    color: '#6B7280'
  },
  {
    id: 'pro',
    name: 'Pro (Doanh nghiệp ⭐)',
    price: '499.000 VNĐ',
    priceNum: 499000,
    period: '/ tháng',
    posts: '25 tin',
    maxPosts: 25,
    cvs: 'Không giới hạn',
    maxCVs: 9999,
    users: '856',
    iconName: 'Star',
    badge: 'BÁN CHẠY NHẤT ⭐',
    isPopular: true,
    color: '#0066FF'
  },
  {
    id: 'premium',
    name: 'Premium (VIP 👑)',
    price: '799.000 VNĐ',
    priceNum: 799000,
    period: '/ tháng',
    posts: 'Không giới hạn',
    maxPosts: 9999,
    cvs: 'Hỗ trợ 24/7',
    maxCVs: 9999,
    users: '142',
    iconName: 'Award',
    badge: 'CAO CẤP ĐỘC QUYỀN 👑',
    isVip: true,
    color: '#D97706'
  }
];

// 4. PHƯƠNG THỨC THANH TOÁN
const standardPaymentMethods = [
  {
    id: 'pm-1',
    type: 'Chuyển khoản Ngân hàng (PayOS QR)',
    name: 'Vietcombank',
    accountName: 'CONG TY CP CONG NGHE BYBITJOBS',
    accountNumber: '1028 8888 9999',
    branch: 'Chi nhánh TP. Hồ Chí Minh',
    status: 'Đang dùng'
  },
  {
    id: 'pm-2',
    type: 'Ví điện tử',
    name: 'Ví MoMo Business',
    accountName: 'BYBITJOBS GLOBAL VIETNAM',
    accountNumber: '0988123456',
    branch: '',
    status: 'Đang dùng'
  }
];

// 5. DANH SÁCH 8 VIỆC LÀM MẪU CHUẨN
const standardJobs = [
  {
    id: 'job-bybit-01',
    title: 'Senior React Native / Mobile Engineer',
    industry: 'Công nghệ thông tin (IT)',
    salary: '30 - 45 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh (Hybrid)',
    description: 'Chịu trách nhiệm thiết kế kiến trúc kỹ thuật và phát triển toàn diện ứng dụng BybitJobs trên nền tảng iOS và Android.\n- Tối ưu hiệu năng render danh sách việc làm và tính năng AI Matching kết nối ứng viên.\n- Tích hợp luồng thanh toán PayOS và mã hóa dữ liệu bảo mật cao cấp.\n- Hợp tác trực tiếp với Product Manager và UI/UX Designer để hoàn thiện các tính năng cốt lõi.',
    requirements: '- Tối thiểu 3 năm kinh nghiệm thực chiến với React Native, TypeScript, Redux Toolkit hoặc Zustand.\n- Nắm vững kiến trúc Mobile Architecture, tối ưu bộ nhớ đệm và offline persistence.\n- Có kinh nghiệm phát hành ứng dụng lên App Store và Google Play Store.\n- Tinh thần trách nhiệm cao, kỹ năng giải quyết vấn đề độc lập và làm việc nhóm hiệu quả.',
    deadline: '30/12/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 2,
    applicantsCount: 3,
    employerId: '4Eh0EdVbfCgkOJvkg6jCYvmRBib2',
    posterName: 'Tập đoàn Công nghệ Bybit Global',
    posterFullName: 'Trần Minh Tuấn (HR Director)',
    posterEmail: 'thanhpnit@gmail.com',
    status: 'Hoạt động',
    isPremium: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'job-bybit-02',
    title: 'Backend NodeJS & Cloud Architect',
    industry: 'Công nghệ thông tin (IT)',
    salary: '25 - 40 triệu',
    location: 'Cầu Giấy, Hà Nội',
    description: 'Thiết kế và duy trì hệ thống RESTful API / Microservices tốc độ cao phục vụ hàng triệu truy vấn mỗi ngày.\n- Tích hợp Gemini AI API cho tính năng gợi ý CV thông minh và tự động sinh Cover Letter.\n- Quản trị cơ sở dữ liệu Firestore, Redis Cache và đảm bảo 99.9% hệ số uptime.\n- Thiết lập quy trình CI/CD tự động hóa trên máy chủ Linux/VPS.',
    requirements: '- Từ 2-4 năm kinh nghiệm làm việc với Node.js, Express, TypeScript.\n- Thành thạo Firebase Admin SDK, NoSQL (Firestore/MongoDB) và Cloud services.\n- Hiểu biết sâu sắc về bảo mật Web/API (JWT, Rate Limiting, CORS, OWASP).\n- Khả năng đọc hiểu tài liệu tiếng Anh chuyên ngành tốt.',
    deadline: '28/12/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 1,
    applicantsCount: 2,
    employerId: '4Eh0EdVbfCgkOJvkg6jCYvmRBib2',
    posterName: 'Tập đoàn Công nghệ Bybit Global',
    posterFullName: 'Trần Minh Tuấn (HR Director)',
    posterEmail: 'thanhpnit@gmail.com',
    status: 'Hoạt động',
    isPremium: true,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'job-fpt-03',
    title: 'UI/UX Product Designer (Design System & App)',
    industry: 'Thiết kế / Sáng tạo nghệ thuật',
    salary: '20 - 32 triệu',
    location: 'Quận 7, TP. Hồ Chí Minh',
    description: 'Nghiên cứu hành vi người dùng, xây dựng User Journey và vẽ Wireframe/Prototype chi tiết trên Figma.\n- Chuẩn hóa hệ thống Design System đồng bộ giữa Mobile App và Web Admin Portal.\n- Thực hiện Usability Testing và cải thiện tỷ lệ chuyển đổi (Conversion Rate) ứng tuyển của người tìm việc.',
    requirements: '- Tối thiểu 2 năm kinh nghiệm làm Product Designer / UI-UX cho các ứng dụng B2C hoặc SaaS.\n- Thành thạo Figma, Auto-layout, Variants, Tokens và Component System.\n- Có tư duy lấy người dùng làm trung tâm (User-Centric Design) và khiếu thẩm mỹ hiện đại.\n- Bắt buộc đính kèm Portfolio khi ứng tuyển.',
    deadline: '25/12/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 1,
    applicantsCount: 4,
    employerId: 'emp-shopee-01',
    posterName: 'Shopee Việt Nam Technology Lab',
    posterFullName: 'Nguyễn Bích Ngọc (Design Lead)',
    posterEmail: 'recruitment@shopee.vn',
    status: 'Hoạt động',
    isPremium: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'job-vng-04',
    title: 'Digital Marketing & Growth Performance Lead',
    industry: 'Marketing / Truyền thông',
    salary: '22 - 35 triệu',
    location: 'Quận 7, TP. Hồ Chí Minh',
    description: 'Hoạch định chiến lược và phân bổ ngân sách Performance Marketing đa kênh (Google Ads, Meta Ads, TikTok Ads).\n- Phối hợp với đội ngũ sáng tạo nội dung sản xuất video ngắn viral và bài viết truyền thông thương hiệu.\n- Đo lường chỉ số ROI, CAC, LTV và tối ưu hóa phễu chuyển đổi người dùng tải app.',
    requirements: '- Có từ 3 năm kinh nghiệm chạy quảng cáo số ngân sách lớn (> 200 triệu/tháng).\n- Kỹ năng phân tích dữ liệu chuyên sâu với Google Analytics 4, AppsFlyer hoặc Mixpanel.\n- Năng động, nhạy bén với xu hướng công nghệ số và thị trường nhân sự Việt Nam.',
    deadline: '31/12/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 2,
    applicantsCount: 5,
    employerId: 'emp-vng-02',
    posterName: 'VNG Corporation (Zalo & Digital Media)',
    posterFullName: 'Hoàng Quốc Dũng (Head of Growth)',
    posterEmail: 'talent@vng.com.vn',
    status: 'Hoạt động',
    isPremium: true,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: 'job-vin-05',
    title: 'Chuyên viên Tuyển dụng & Thu hút Tài năng (HR Talent Acquisition)',
    industry: 'Quản trị Nhân sự / Tuyển dụng',
    salary: '15 - 22 triệu',
    location: 'Nam Từ Liêm, Hà Nội',
    description: 'Chủ động tìm kiếm và săn đón các ứng viên tiềm năng cho các khối ngành Công nghệ, Tài chính và Vận hành.\n- Tổ chức các buổi phỏng vấn sàng lọc, đánh giá năng lực ứng viên và đề xuất mức đãi ngộ phù hợp.\n- Xây dựng quan hệ hợp tác với các trường đại học hàng đầu và tham gia ngày hội việc làm (Job Fair).',
    requirements: '- Tốt nghiệp Đại học chuyên ngành Quản trị Nhân sự, Luật, Kinh tế hoặc liên quan.\n- Tối thiểu 1.5 - 2 năm kinh nghiệm làm tuyển dụng (Headhunter hoặc In-house recruiter).\n- Kỹ năng giao tiếp xuất sắc, phong thái tự tin và kỹ năng đàm phán thuyết phục.',
    deadline: '20/12/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 2,
    applicantsCount: 1,
    employerId: 'emp-vingroup-03',
    posterName: 'Tập đoàn Vingroup (HR Excellence Center)',
    posterFullName: 'Phan Thu Trang (Senior HRBP)',
    posterEmail: 'tuyendung@vingroup.net',
    status: 'Hoạt động',
    isPremium: false,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'job-tcb-06',
    title: 'Chuyên viên Phân tích Dữ liệu Tài chính Doanh nghiệp',
    industry: 'Tài chính / Ngân hàng',
    salary: '18 - 28 triệu',
    location: 'Hoàn Kiếm, Hà Nội',
    description: 'Phân tích báo cáo tài chính định kỳ, theo dõi dòng tiền và dự báo chi phí vận hành doanh nghiệp.\n- Xây dựng mô hình định giá và báo cáo dashboard tài chính cho Ban Tổng Giám đốc bằng Power BI / Excel nâng cao.\n- Tham gia đánh giá rủi ro tài chính và đề xuất các giải pháp tối ưu hóa vốn lưu động.',
    requirements: '- Tốt nghiệp chuyên ngành Tài chính - Ngân hàng, Kế toán, Kiểm toán (CFA level 1 hoặc ACCA là lợi thế).\n- 2 năm kinh nghiệm tại các ngân hàng thương mại, quỹ đầu tư hoặc công ty tài chính lớn.\n- Thành thạo kỹ năng phân tích định lượng và tư duy logic chặt chẽ.',
    deadline: '22/12/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 1,
    applicantsCount: 2,
    employerId: 'emp-tcb-04',
    posterName: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    posterFullName: 'Lê Hoàng Long (Finance Manager)',
    posterEmail: 'careers@techcombank.com.vn',
    status: 'Hoạt động',
    isPremium: true,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: 'job-tch-07',
    title: 'Quản lý Cửa hàng Chuỗi Cà phê (Store Manager)',
    industry: 'Du lịch / Khách sạn / F&B',
    salary: '14 - 18 triệu + Thưởng KPI',
    location: 'Bình Thạnh, TP. Hồ Chí Minh',
    description: 'Chịu trách nhiệm toàn diện về doanh thu, chất lượng phục vụ và chi phí vận hành tại điểm bán.\n- Đào tạo kỹ năng pha chế, quy chuẩn vệ sinh an toàn thực phẩm và phong cách phục vụ chu đáo cho đội ngũ nhân viên.\n- Kiểm soát nguyên vật liệu đầu vào, quản lý hàng tồn kho và xử lý phản hồi của khách hàng kịp thời.',
    requirements: '- Tối thiểu 1 năm kinh nghiệm ở vị trí Cửa hàng phó hoặc Cửa hàng trưởng tại các chuỗi F&B / Nhà hàng.\n- Khả năng sắp xếp ca làm việc khoa học, quản trị nhân sự và giải quyết sự cố phát sinh.\n- Đam mê ngành dịch vụ, trung thực, chịu được áp lực công việc cao.',
    deadline: '18/12/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 2,
    applicantsCount: 4,
    employerId: 'emp-tch-05',
    posterName: 'The Coffee House Việt Nam',
    posterFullName: 'Vũ Thanh Hằng (Khu vực HCM)',
    posterEmail: 'hr@thecoffeehouse.vn',
    status: 'Hoạt động',
    isPremium: false,
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString()
  },
  {
    id: 'job-ghtk-08',
    title: 'Trưởng nhóm Điều phối Vận tải & Quản lý Kho Hub',
    industry: 'Logistics / Vận tải / Kho bãi',
    salary: '16 - 24 triệu',
    location: 'Tân Bình, TP. Hồ Chí Minh',
    description: 'Giám sát tiến độ giao nhận hàng hóa nội thành và liên tỉnh qua hệ thống quản trị TMS/WMS.\n- Điều phối đội ngũ tài xế giao hàng và nhân viên bốc dỡ đảm bảo chỉ số đúng giờ (On-Time Delivery > 98%).\n- Tối ưu tuyến đường vận tải, giảm thiểu chi phí hao hụt và xử lý khiếu nại giao trễ nhanh chóng.',
    requirements: '- Có từ 2 năm kinh nghiệm quản lý kho hàng hoặc điều phối giao nhận tại các công ty Chuyển phát nhanh / E-commerce.\n- Tác phong quyết đoán, kỹ năng điều hành nhóm và xử lý tình huống linh hoạt.\n- Sẵn sàng làm việc theo ca điều phối linh hoạt khi có đơn hàng cao điểm.',
    deadline: '24/12/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 3,
    applicantsCount: 2,
    employerId: 'emp-ghtk-06',
    posterName: 'Công ty Cổ phần Giao Hàng Tiết Kiệm (GHTK)',
    posterFullName: 'Đỗ Quang Vinh (Operations Director)',
    posterEmail: 'tuyendung@ghtk.vn',
    status: 'Hoạt động',
    isPremium: false,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

// 6. CÁC HỒ SƠ ỨNG VIÊN VÀ ĐƠN ỨNG TUYỂN MẪU
const standardApplications = [
  {
    id: 'app-demo-01',
    jobId: 'job-bybit-01',
    jobTitle: 'Senior React Native / Mobile Engineer',
    jobCompany: 'Tập đoàn Công nghệ Bybit Global',
    jobLocation: 'Quận 1, TP. Hồ Chí Minh (Hybrid)',
    jobSalary: '30 - 45 triệu',
    candidateId: 'fdTxTvP92aMrU1gtz4apoMj6fYg1',
    applicantName: 'Phạm Ngọc Thanh',
    applicantEmail: 'thanh.nguyen@gmail.com',
    applicantPhone: '0988 123 456',
    appliedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: 'Đã duyệt',
    reviewStatus: 'Đã duyệt',
    message: 'Kính gửi Quý công ty, tôi có hơn 3 năm kinh nghiệm chuyên sâu với React Native, TypeScript và tối ưu hiệu năng app di động. Tôi rất mong muốn được cống hiến năng lực để đưa BybitJobs phát triển bứt phá!',
    coverLetter: 'Kính gửi Quý công ty Bybit Global,\n\nTôi là Phạm Ngọc Thanh, Kỹ sư Mobile với hơn 3 năm kinh nghiệm chuyên sâu về React Native, TypeScript và kiến trúc Microservices. Qua tìm hiểu, tôi rất ấn tượng với sứ mệnh số hóa thị trường tuyển dụng của BybitJobs.\n\nVới thế mạnh về tối ưu render, tích hợp AI SDK và quy trình kiểm thử tự động, tôi tin tưởng sẽ đóng góp tích cực vào sự phát triển ổn định của sản phẩm.\n\nTrân trọng cảm ơn Quý công ty đã xem xét hồ sơ!',
    companyRating: 5,
    companyComment: 'Ứng viên có kỹ năng chuyên môn rất phù hợp, thái độ cầu thị và kinh nghiệm thực chiến vững vàng.'
  },
  {
    id: 'app-demo-02',
    jobId: 'job-bybit-01',
    jobTitle: 'Senior React Native / Mobile Engineer',
    jobCompany: 'Tập đoàn Công nghệ Bybit Global',
    jobLocation: 'Quận 1, TP. Hồ Chí Minh (Hybrid)',
    jobSalary: '30 - 45 triệu',
    candidateId: 'fYzojWVQdYc6y4O2JbGsUHTh98C2',
    applicantName: 'Lê Thiện Nhân',
    applicantEmail: 'nhan.le@gmail.com',
    applicantPhone: '0912 345 678',
    appliedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'Pending',
    reviewStatus: 'Chờ duyệt',
    message: 'Tôi là lập trình viên đam mê công nghệ di động, có kinh nghiệm hoàn thiện 4 dự án Expo / React Native đa nền tảng và mong muốn ứng tuyển vị trí này.',
    coverLetter: 'Kính gửi Bộ phận Tuyển dụng Bybit Global,\n\nTôi là Lê Thiện Nhân, tốt nghiệp ngành Khoa học Máy tính. Tôi đã từng phát triển và phát hành nhiều ứng dụng di động trên nền tảng React Native.\n\nTôi hy vọng có cơ hội trao đổi trực tiếp trong buổi phỏng vấn sắp tới.\n\nXin cảm ơn!'
  },
  {
    id: 'app-demo-03',
    jobId: 'job-fpt-03',
    jobTitle: 'UI/UX Product Designer (Design System & App)',
    jobCompany: 'Shopee Việt Nam Technology Lab',
    jobLocation: 'Quận 7, TP. Hồ Chí Minh',
    jobSalary: '20 - 32 triệu',
    candidateId: 'xYmxzPwNPoejeROMq5Pp9rnXeHn2',
    applicantName: 'Nguyễn Phương Thảo',
    applicantEmail: 'thao.nguyen.ux@gmail.com',
    applicantPhone: '0934 567 890',
    appliedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'Đã duyệt',
    reviewStatus: 'Đã phê duyệt',
    message: 'Chào Shopee Team, tôi đã gửi kèm link Figma Portfolio trong CV và rất hy vọng có cơ hội cùng team xây dựng sản phẩm tuyệt vời.',
    coverLetter: 'Kính gửi Shopee Team,\n\nTôi là Phương Thảo, Product Designer với hơn 3 năm kinh nghiệm thiết kế trải nghiệm người dùng cho các nền tảng thương mại điện tử. Rất mong được tham gia phỏng vấn.',
    companyRating: 5,
    companyComment: 'Portfolio thiết kế rất chỉn chu, màu sắc và typography cực kỳ hiện đại.'
  }
];

// 7. THÔNG BÁO HỆ THỐNG MẪU CHUẨN
const standardNotifications = [
  {
    id: 'notif-demo-01',
    title: 'Chào mừng bạn đến với BybitJobs! 🎉',
    message: 'Cảm ơn bạn đã đồng hành cùng nền tảng tìm việc & tuyển dụng thông minh BybitJobs. Hãy hoàn thiện hồ sơ để đón nhận cơ hội việc làm tốt nhất.',
    type: 'system',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    targetRole: 'all',
    isRead: false
  },
  {
    id: 'notif-demo-02',
    title: 'Hồ sơ ứng tuyển của bạn đã được tiếp nhận',
    message: 'Nhà tuyển dụng Tập đoàn Công nghệ Bybit Global đã xem hồ sơ ứng tuyển vị trí Senior React Native của bạn.',
    type: 'application',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    targetRole: 'candidate',
    isRead: true
  },
  {
    id: 'notif-demo-03',
    title: 'Kích hoạt Gói Tuyển dụng VIP thành công 👑',
    message: 'Doanh nghiệp của bạn đã kích hoạt thành công Gói Premium. Bây giờ bạn có thể đăng tin không giới hạn và nhận huy hiệu uy tín độc quyền.',
    type: 'package',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    targetRole: 'employer',
    isRead: false
  },
  {
    id: 'notif-demo-04',
    title: 'Tính năng AI Advisor & Trợ lý CV đã sẵn sàng 🤖',
    message: 'Trải nghiệm ngay trợ lý trí tuệ nhân tạo Gemini AI giúp bạn tối ưu hóa CV và phân tích độ phù hợp với từng vị trí việc làm chỉ trong 3 giây.',
    type: 'feature',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    targetRole: 'all',
    isRead: true
  }
];

// 8. HỒ SƠ CHÍNH CỦA BẠN (thanhpnit@gmail.com)
const masterEmployerProfile = {
  company: 'Tập đoàn Công nghệ Bybit Global',
  companyName: 'Tập đoàn Công nghệ Bybit Global',
  email: 'thanhpnit@gmail.com',
  phone: '0988 123 456',
  phoneNumber: '0988 123 456',
  taxId: '0316888999',
  address: 'Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  industry: 'Công nghệ thông tin (IT)',
  scale: '250 - 500 nhân viên',
  description: 'Bybit Global là tập đoàn công nghệ tiên phong cung cấp giải pháp chuyển đổi số và nền tảng kết nối nhân tài thông minh bằng AI hàng đầu Đông Nam Á.',
  status: 'Xác thực',
  isVerified: true,
  isPremium: true,
  current_package: 'Premium',
  package: 'premium',
  packageTier: 'premium',
  packageName: 'Gói PREMIUM (VIP 👑)',
  postsLimit: 'Không giới hạn',
  usedPosts: 2,
  rating: 5,
  totalReviews: 12,
  reviewCount: 12,
  website: 'https://bybitjobs.com',
  createdAt: new Date('2026-01-15T08:00:00.000Z').toISOString(),
  updatedAt: new Date().toISOString()
};

const masterCandidateProfile = {
  fullName: 'Phạm Ngọc Thanh',
  name: 'Phạm Ngọc Thanh',
  email: 'thanhpnit@gmail.com',
  emailOrPhone: 'thanhpnit@gmail.com',
  phone: '0988 123 456',
  desiredJob: 'Senior Mobile Engineer / Tech Lead',
  industry: 'Công nghệ thông tin (IT)',
  skills: ['React Native', 'TypeScript', 'Node.js', 'System Architecture', 'Firebase / GCP'],
  bio: 'Kỹ sư phần mềm đam mê xây dựng sản phẩm công nghệ chất lượng cao, tối ưu hiệu năng và trải nghiệm người dùng xuất sắc.',
  experience: [
    {
      role: 'Senior React Native Engineer',
      company: 'Bybit Global Technology',
      duration: '2024 - Nay',
      description: 'Chủ trì thiết kế kiến trúc Mobile App BybitJobs, tích hợp luồng AI Gemini và hệ thống thanh toán PayOS.'
    }
  ],
  role: 'candidate',
  isVerified: true
};

async function executeMigration() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU QUY TRÌNH DỌN SẠCH & NẠP DATA CHUẨN FIRESTORE');
  console.log('====================================================\n');

  // BƯỚC 1: Xóa sạch các collection rác / dữ liệu test cũ
  console.log('--- BƯỚC 1: DỌN SẠCH CÁC COLLECTION RÁC & LỊCH SỬ TEST ---');
  await clearCollection('jobs');
  await clearCollection('job_posts');
  await clearCollection('applications');
  await clearCollection('invitations');
  await clearCollection('notifications');
  await clearCollection('savedJobs');
  await clearCollection('viewedJobs');
  await clearCollection('orders');
  await clearCollection('transactions');
  await clearCollection('feedbacks');
  await clearCollection('reports');
  await clearCollection('test');
  await clearCollection('cvs');

  // Xóa danh mục test 05 "Bán hàng rong" trong industries nếu còn
  try {
    await deleteDoc(doc(db, 'industries', '05'));
    console.log('✅ Đã loại bỏ danh mục lỗi thời [05 - Bán hàng rong]');
  } catch (e) {}

  // BƯỚC 2: Cập nhật Danh mục Ngành nghề & Kỹ năng chuẩn
  console.log('\n--- BƯỚC 2: NẠP DANH MỤC NGÀNH NGHỀ & KỸ NĂNG CHUẨN ---');
  for (const ind of standardIndustries) {
    await setDoc(doc(db, 'industries', ind.id), ind, { merge: true });
  }
  console.log(`✅ Đã nạp ${standardIndustries.length} ngành nghề trọng điểm chuẩn.`);

  for (const sk of standardSkills) {
    await setDoc(doc(db, 'skills', sk.id), sk, { merge: true });
  }
  console.log(`✅ Đã nạp ${standardSkills.length} kỹ năng chuyên môn chuẩn.`);

  // BƯỚC 3: Cập nhật Gói dịch vụ & Phương thức thanh toán chuẩn
  console.log('\n--- BƯỚC 3: CHUẨN HÓA GÓI DỊCH VỤ & PHƯƠNG THỨC THANH TOÁN ---');
  for (const pkg of standardPackages) {
    await setDoc(doc(db, 'packages', pkg.id), pkg, { merge: true });
  }
  console.log(`✅ Đã chuẩn hóa 3 gói dịch vụ: Starter, Pro (499k), Premium (799k).`);

  for (const pm of standardPaymentMethods) {
    await setDoc(doc(db, 'paymentMethods', pm.id), pm, { merge: true });
  }
  console.log(`✅ Đã chuẩn hóa tài khoản nhận thanh toán Vietcombank & MoMo.`);

  // BƯỚC 4: Nạp 8 Tin Tuyển Dụng Chuẩn Đẹp
  console.log('\n--- BƯỚC 4: NẠP 8 VIỆC LÀM MẪU CHUẨN ĐA NGÀNH NGHỀ ---');
  for (const job of standardJobs) {
    await setDoc(doc(db, 'jobs', job.id), job);
    console.log(`  * Đã nạp việc làm: [${job.title}] - ${job.posterName} (${job.salary})`);
  }

  // BƯỚC 5: Nạp Đơn Ứng Tuyển & Thông Báo Mẫu
  console.log('\n--- BƯỚC 5: NẠP ĐƠN ỨNG TUYỂN & THÔNG BÁO HỆ THỐNG MẪU ---');
  for (const appItem of standardApplications) {
    await setDoc(doc(db, 'applications', appItem.id), appItem);
  }
  console.log(`✅ Đã nạp ${standardApplications.length} đơn ứng tuyển mẫu với trạng thái và cover letter đẹp.`);

  for (const notif of standardNotifications) {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  }
  console.log(`✅ Đã nạp ${standardNotifications.length} thông báo hệ thống lịch sự.`);

  // BƯỚC 6: Chuẩn hóa Hồ sơ Tài khoản Chủ (thanhpnit@gmail.com)
  console.log('\n--- BƯỚC 6: CHUẨN HÓA HỒ SƠ TÀI KHOẢN MASTER (thanhpnit@gmail.com) ---');
  const masterUID = '4Eh0EdVbfCgkOJvkg6jCYvmRBib2';
  await setDoc(doc(db, 'employers', masterUID), masterEmployerProfile, { merge: true });
  await setDoc(doc(db, 'users', masterUID), masterCandidateProfile, { merge: true });
  console.log(`✅ Đã đồng bộ hồ sơ UID [${masterUID}]: Nhà tuyển dụng VIP & Ứng viên Senior chuyên nghiệp.`);

  console.log('\n====================================================');
  console.log('🎉🎉 HOÀN THÀNH TẤT CẢ! CƠ SỞ DỮ LIỆU ĐÃ SẴN SÀNG CHO DEMO!');
  console.log('====================================================\n');
  process.exit(0);
}

executeMigration().catch((err) => {
  console.error('❌ Lỗi trong quá trình chạy migration:', err);
  process.exit(1);
});
