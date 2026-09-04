// scripts/seed-50-full-data.cjs
// Script nạp hơn 50 bản ghi dữ liệu mẫu chuẩn hóa, phong phú và chuyên nghiệp vào Firestore cho BybitJobs

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  getDocs,
  deleteDoc
} = require('firebase/firestore');

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

// 1. DANH MỤC 8 NGÀNH NGHỀ CHUẨN
const industries = [
  { id: 'ind-1', name: 'Công nghệ thông tin (IT)', desc: 'Lập trình Mobile, Backend, Frontend, Cloud & AI', posts: 142, status: 'Active' },
  { id: 'ind-2', name: 'Marketing / Truyền thông', desc: 'Digital Marketing, Content Creator, Quản trị thương hiệu, SEO', posts: 98, status: 'Active' },
  { id: 'ind-3', name: 'Tài chính / Ngân hàng', desc: 'Kế toán tổng hợp, Kiểm toán, Chuyên viên phân tích đầu tư', posts: 76, status: 'Active' },
  { id: 'ind-4', name: 'Bán lẻ / Tiêu dùng', desc: 'Quản lý cửa hàng, Giám sát bán lẻ, Tư vấn bán hàng', posts: 110, status: 'Active' },
  { id: 'ind-5', name: 'Quản trị Nhân sự / Tuyển dụng', desc: 'Talent Acquisition, C&B Specialist, HR Generalist', posts: 55, status: 'Active' },
  { id: 'ind-6', name: 'Thiết kế / Sáng tạo nghệ thuật', desc: 'UI/UX Product Designer, Đồ họa 2D/3D, Video Editor', posts: 45, status: 'Active' },
  { id: 'ind-7', name: 'Du lịch / Khách sạn / F&B', desc: 'Quản lý nhà hàng, Bếp trưởng, Barista chuyên nghiệp', posts: 68, status: 'Active' },
  { id: 'ind-8', name: 'Logistics / Vận tải / Kho bãi', desc: 'Điều phối vận tải, Quản lý kho WMS, Xuất nhập khẩu', posts: 52, status: 'Active' }
];

// 2. DANH MỤC 10 KỸ NĂNG CHUẨN
const skills = [
  { id: 'sk-1', name: 'React Native & Flutter', category: 'Công nghệ thông tin (IT)', desc: 'Phát triển ứng dụng di động đa nền tảng', posts: 35, status: 'Active' },
  { id: 'sk-2', name: 'Node.js & Cloud Architecture', category: 'Công nghệ thông tin (IT)', desc: 'Xây dựng API Microservices và Cloud AWS/GCP', posts: 28, status: 'Active' },
  { id: 'sk-3', name: 'UI/UX Design (Figma)', category: 'Thiết kế / Sáng tạo nghệ thuật', desc: 'Thiết kế Design System và Prototype tương tác', posts: 20, status: 'Active' },
  { id: 'sk-4', name: 'Digital Marketing & Ads', category: 'Marketing / Truyền thông', desc: 'Chạy Performance Ads (Google, Meta, TikTok)', posts: 24, status: 'Active' },
  { id: 'sk-5', name: 'Talent Acquisition & Interviewing', category: 'Quản trị Nhân sự / Tuyển dụng', desc: 'Săn tìm ứng viên và phỏng vấn đánh giá', posts: 18, status: 'Active' },
  { id: 'sk-6', name: 'Financial Modeling & Analysis', category: 'Tài chính / Ngân hàng', desc: 'Phân tích báo cáo tài chính và thẩm định dự án', posts: 15, status: 'Active' },
  { id: 'sk-7', name: 'Store Management & Customer Care', category: 'Bán lẻ / Tiêu dùng', desc: 'Quản lý điểm bán và chăm sóc khách hàng', posts: 22, status: 'Active' },
  { id: 'sk-8', name: 'Barista & F&B Operations', category: 'Du lịch / Khách sạn / F&B', desc: 'Kỹ thuật pha chế và vận hành dịch vụ đồ uống', posts: 14, status: 'Active' },
  { id: 'sk-9', name: 'Logistics & Supply Chain', category: 'Logistics / Vận tải / Kho bãi', desc: 'Quản lý chuỗi cung ứng và điều phối kho vận', posts: 19, status: 'Active' },
  { id: 'sk-10', name: 'Python & AI Machine Learning', category: 'Công nghệ thông tin (IT)', desc: 'Xây dựng mô hình AI và xử lý dữ liệu lớn', posts: 30, status: 'Active' }
];

// 3. GÓI DỊCH VỤ TUYỂN DỤNG
const packages = [
  { id: 'starter', name: 'Starter (Cơ bản)', price: '0 VNĐ', priceNum: 0, period: '/ tháng', posts: '5 tin', maxPosts: 5, cvs: '50 / bài', maxCVs: 50, users: '1,240', badge: 'CƠ BẢN', color: '#6B7280', status: 'Active' },
  { id: 'pro', name: 'Pro (Doanh nghiệp ⭐)', price: '499.000 VNĐ', priceNum: 499000, period: '/ tháng', posts: '25 tin', maxPosts: 25, cvs: 'Không giới hạn', maxCVs: 9999, users: '856', badge: 'BÁN CHẠY NHẤT ⭐', isPopular: true, color: '#0066FF', status: 'Active' },
  { id: 'premium', name: 'Premium (VIP 👑)', price: '799.000 VNĐ', priceNum: 799000, period: '/ tháng', posts: 'Không giới hạn', maxPosts: 9999, cvs: 'Hỗ trợ 24/7', maxCVs: 9999, users: '142', badge: 'CAO CẤP ĐỘC QUYỀN 👑', isVip: true, color: '#D97706', status: 'Active' }
];

// 4. PHƯƠNG THỨC THANH TOÁN
const paymentMethods = [
  { id: 'pm-1', type: 'Chuyển khoản Ngân hàng (PayOS QR)', name: 'Vietcombank', accountName: 'CONG TY CP CONG NGHE BYBITJOBS', accountNumber: '1028 8888 9999', branch: 'Chi nhánh TP. Hồ Chí Minh', status: 'Đang dùng' },
  { id: 'pm-2', type: 'Ví điện tử', name: 'Ví MoMo Business', accountName: 'BYBITJOBS GLOBAL VIETNAM', accountNumber: '0988123456', branch: '', status: 'Đang dùng' }
];

// 5. DANH SÁCH 10 DOANH NGHIỆP UY TÍN
const employers = [
  {
    id: '4Eh0EdVbfCgkOJvkg6jCYvmRBib2',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    taxId: '0316888999',
    phoneNumber: '028 7300 8888',
    address: 'Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    website: 'https://bybitjobs.com',
    industry: 'Công nghệ thông tin (IT)',
    scale: '250 - 500 nhân viên',
    description: 'Bybit Global là tập đoàn công nghệ tiên phong phát triển nền tảng kết nối nhân tài thông minh bằng AI hàng đầu Đông Nam Á.',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Premium',
    usedPosts: 4,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isPremium: true,
    isVerified: true,
    status: 'Active',
    branches: [
      { id: 'b1', name: 'Trụ sở TP.HCM', address: 'Quận 1, TP. Hồ Chí Minh' },
      { id: 'b2', name: 'Văn phòng Hà Nội', address: 'Quận Cầu Giấy, Hà Nội' }
    ]
  },
  {
    id: 'emp-fpt-01',
    companyName: 'Công ty Cổ phần FPT Software',
    taxId: '0101778163',
    phoneNumber: '024 7300 7575',
    address: 'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Cầu Giấy, Hà Nội',
    website: 'https://fptsoftware.com',
    industry: 'Công nghệ thông tin (IT)',
    scale: '10,000+ nhân viên',
    description: 'FPT Software là công ty xuất khẩu phần mềm và dịch vụ CNTT hàng đầu Việt Nam với mạng lưới khách hàng toàn cầu.',
    logo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Premium',
    usedPosts: 3,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isPremium: true,
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-vng-02',
    companyName: 'Công ty Cổ phần VNG (Zalo Corporation)',
    taxId: '0303518888',
    phoneNumber: '028 3962 3888',
    address: 'VNG Campus, Đường số 13, Khu chế xuất Tân Thuận, Quận 7, TP. HCM',
    website: 'https://vng.com.vn',
    industry: 'Công nghệ thông tin (IT)',
    scale: '3,000+ nhân viên',
    description: 'VNG là kỳ lân công nghệ hàng đầu Việt Nam sở hữu siêu ứng dụng Zalo, ZaloPay và nền tảng phát hành game số 1.',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Premium',
    usedPosts: 3,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isPremium: true,
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-vingroup-03',
    companyName: 'Tập đoàn Vingroup (VinFast & VinAI)',
    taxId: '0101245486',
    phoneNumber: '024 3974 9999',
    address: 'Số 7 Đường Bằng Lăng 1, KĐT Sinh thái Vinhomes Riverside, Long Biên, Hà Nội',
    website: 'https://vingroup.net',
    industry: 'Công nghệ thông tin (IT)',
    scale: '40,000+ nhân viên',
    description: 'Tập đoàn kinh tế tư nhân đa ngành hàng đầu Việt Nam tập trung vào Công nghệ, Công nghiệp xe điện và Dịch vụ.',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Pro',
    usedPosts: 2,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isPro: true,
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-shopee-04',
    companyName: 'Công ty TNHH Shopee Việt Nam',
    taxId: '0313333333',
    phoneNumber: '028 7300 1234',
    address: 'Tầng 17 Tòa nhà Saigon Centre 2, 67 Lê Lợi, Bến Nghé, Quận 1, TP. HCM',
    website: 'https://shopee.vn',
    industry: 'Marketing / Truyền thông',
    scale: '5,000+ nhân viên',
    description: 'Sàn thương mại điện tử và giải pháp thanh toán số hàng đầu tại khu vực Đông Nam Á.',
    logo: 'https://images.unsplash.com/photo-1556742049-0a67e55722c3?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Premium',
    usedPosts: 3,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isPremium: true,
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-tcb-05',
    companyName: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    taxId: '0100230800',
    phoneNumber: '024 3944 6368',
    address: 'Số 6 Quang Trung, Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
    website: 'https://techcombank.com.vn',
    industry: 'Tài chính / Ngân hàng',
    scale: '12,000+ nhân viên',
    description: 'Ngân hàng thương mại cổ phần hàng đầu Việt Nam tiên phong trong chuyển đổi số và cung cấp dịch vụ tài chính hiện đại.',
    logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Pro',
    usedPosts: 2,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isPro: true,
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-ghtk-06',
    companyName: 'Công ty Cổ phần Giao Hàng Tiết Kiệm (GHTK)',
    taxId: '0106181807',
    phoneNumber: '024 6296 2888',
    address: 'Tòa nhà GHTK Building, Số 8 Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội',
    website: 'https://ghtk.vn',
    industry: 'Logistics / Vận tải / Kho bãi',
    scale: '30,000+ nhân viên',
    description: 'Đơn vị vận chuyển công nghệ chuyên nghiệp phục vụ hàng triệu shop bán lẻ và khách hàng trên toàn quốc.',
    logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Pro',
    usedPosts: 2,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isPro: true,
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-tch-07',
    companyName: 'Công ty Cổ phần Seedcom (The Coffee House)',
    taxId: '0312868888',
    phoneNumber: '028 7108 7088',
    address: 'Tầng 6 Tòa nhà Toyota, 195 Điện Biên Phủ, Phường 15, Bình Thạnh, TP. HCM',
    website: 'https://thecoffeehouse.com',
    industry: 'Du lịch / Khách sạn / F&B',
    scale: '4,000+ nhân viên',
    description: 'Chuỗi không gian cà phê và trải nghiệm ẩm thực hiện đại gắn kết hàng triệu người trẻ Việt Nam.',
    logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Starter',
    usedPosts: 2,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-grab-08',
    companyName: 'Công ty TNHH Grab Việt Nam',
    taxId: '0312650437',
    phoneNumber: '028 7108 7108',
    address: 'Tòa nhà Mapletree Business Centre, 1060 Nguyễn Văn Linh, Tân Phong, Quận 7, TP. HCM',
    website: 'https://grab.com/vn',
    industry: 'Công nghệ thông tin (IT)',
    scale: '2,500+ nhân viên',
    description: 'Siêu ứng dụng hàng đầu Đông Nam Á cung cấp dịch vụ giao vận, di chuyển và tài chính số tiện lợi.',
    logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Premium',
    usedPosts: 2,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isPremium: true,
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-momo-09',
    companyName: 'Công ty Cổ phần Dịch vụ Di Động Trực Tuyến (MoMo)',
    taxId: '0305083506',
    phoneNumber: '028 5414 7667',
    address: 'Tầng M, Tòa nhà PetroVietnam Landmark, 69 Mai Chí Thọ, An Phú, TP. Thủ Đức, TP. HCM',
    website: 'https://momo.vn',
    industry: 'Tài chính / Ngân hàng',
    scale: '2,000+ nhân viên',
    description: 'Kỳ lân Fintech hàng đầu Việt Nam phát triển Siêu ứng dụng tài chính số 1 phục vụ hơn 31 triệu người dùng.',
    logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Premium',
    usedPosts: 2,
    packageExpiresAt: '2026-12-31T23:59:59.000Z',
    isPremium: true,
    isVerified: true,
    status: 'Active'
  }
];

// 6. DANH SÁCH 25 TIN TUYỂN DỤNG ĐA DẠNG NGÀNH NGHỀ
const jobs = [
  // Nhóm Công nghệ thông tin (IT)
  {
    id: 'job-bybit-01',
    title: 'Senior React Native / Mobile Engineer',
    industry: 'Công nghệ thông tin (IT)',
    salary: '30 - 45 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh (Hybrid)',
    experience: '3 - 5 năm kinh nghiệm',
    description: 'Chịu trách nhiệm thiết kế kiến trúc kỹ thuật và phát triển ứng dụng BybitJobs trên nền tảng iOS & Android.\n- Tối ưu hiệu năng render danh sách việc làm và tính năng AI Gemini gợi ý ứng viên.\n- Tích hợp cổng thanh toán PayOS và bảo mật JWT token.\n- Phối hợp với Product Manager và UI/UX Designer hoàn thiện các tính năng cốt lõi.',
    requirements: '- Tối thiểu 3 năm kinh nghiệm thực chiến React Native, TypeScript, Redux Toolkit.\n- Nắm vững Mobile Architecture, offline sync và memory optimization.\n- Có kinh nghiệm phát hành app lên App Store và Google Play.',
    deadline: '30/12/2026',
    isOpen: true,
    employerId: '4Eh0EdVbfCgkOJvkg6jCYvmRBib2',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    posterName: 'Tập đoàn Công nghệ Bybit Global',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'job-bybit-02',
    title: 'Backend Node.js & Cloud Architect',
    industry: 'Công nghệ thông tin (IT)',
    salary: '25 - 40 triệu',
    location: 'Cầu Giấy, Hà Nội',
    experience: '2 - 4 năm kinh nghiệm',
    description: 'Thiết kế và xây dựng hệ thống RESTful API tốc độ cao, xử lý hàng triệu request mỗi ngày.\n- Tích hợp Google Gemini AI phân tích CV ứng viên và tạo Job Description tự động.\n- Quản trị CSDL Cloud Firestore, Redis Cache và đảm bảo 99.9% uptime hệ thống.',
    requirements: '- Từ 2-4 năm kinh nghiệm Node.js, Express, TypeScript.\n- Thành thạo Firebase Firestore, NoSQL và Cloud Services (GCP/AWS).\n- Hiểu biết về bảo mật hệ thống (Rate limit, CORS, OWASP).',
    deadline: '28/12/2026',
    isOpen: true,
    employerId: '4Eh0EdVbfCgkOJvkg6jCYvmRBib2',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    posterName: 'Tập đoàn Công nghệ Bybit Global',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'job-fpt-03',
    title: 'Fullstack JavaScript Developer (React + Node.js)',
    industry: 'Công nghệ thông tin (IT)',
    salary: '20 - 35 triệu',
    location: 'Cầu Giấy, Hà Nội',
    experience: '2 - 3 năm kinh nghiệm',
    description: 'Tham gia dự án chuyển đổi số quy mô lớn cho khách hàng tài chính tại Nhật Bản và Singapore.\n- Xây dựng Web Portal bằng Next.js và Microservices Backend trên nền Docker/Kubernetes.',
    requirements: '- 2 năm kinh nghiệm ReactJS, Node.js, TypeScript.\n- Thành thạo Git workflow, Docker và tư duy giải quyết vấn đề linh hoạt.',
    deadline: '25/12/2026',
    isOpen: true,
    employerId: 'emp-fpt-01',
    companyName: 'Công ty Cổ phần FPT Software',
    posterName: 'FPT Software Recruitment',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'job-fpt-04',
    title: 'Kỹ sư Trí Tuệ Nhân Tạo & Machine Learning (AI Engineer)',
    industry: 'Công nghệ thông tin (IT)',
    salary: '35 - 55 triệu',
    location: 'Quận 9, TP. Thủ Đức, TP. HCM',
    experience: '3+ năm kinh nghiệm',
    description: 'Nghiên cứu và triển khai các mô hình Large Language Model (LLM), Computer Vision và Recommendation Systems.\n- Huấn luyện mô hình AI phân tích hồ sơ và tối ưu hóa hệ thống Matching tự động.',
    requirements: '- Tốt nghiệp Đại học chuyên ngành Khoa học Dữ liệu, CNTT hoặc Toán tin.\n- Thành thạo Python, PyTorch/TensorFlow, OpenCV và xử lý NLP.\n- Có bài báo khoa học hoặc giải thưởng AI là lợi thế lớn.',
    deadline: '31/12/2026',
    isOpen: true,
    employerId: 'emp-fpt-01',
    companyName: 'Công ty Cổ phần FPT Software',
    posterName: 'FPT Software Recruitment',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'job-vng-05',
    title: 'Senior DevOps & Site Reliability Engineer (SRE)',
    industry: 'Công nghệ thông tin (IT)',
    salary: '35 - 50 triệu',
    location: 'Quận 7, TP. Hồ Chí Minh',
    experience: '4+ năm kinh nghiệm',
    description: 'Quản trị hạ tầng Cloud khổng lồ phục vụ hơn 75 triệu người dùng Zalo.\n- Thiết lập đường ống CI/CD tự động, giám sát hạ tầng Prometheus/Grafana và xử lý sự cố 24/7.',
    requirements: '- Kinh nghiệm chuyên sâu về Linux, Kubernetes, Terraform, AWS/GCP.\n- Kỹ năng scripting tốt với Python hoặc Golang.',
    deadline: '20/12/2026',
    isOpen: true,
    employerId: 'emp-vng-02',
    companyName: 'Công ty Cổ phần VNG (Zalo Corporation)',
    posterName: 'VNG Careers',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },

  // Nhóm Thiết kế & UI/UX
  {
    id: 'job-vng-06',
    title: 'UI/UX Product Designer (Design System Lead)',
    industry: 'Thiết kế / Sáng tạo nghệ thuật',
    salary: '22 - 35 triệu',
    location: 'Quận 7, TP. Hồ Chí Minh',
    experience: '2 - 4 năm kinh nghiệm',
    description: 'Thiết kế trải nghiệm người dùng cho ứng dụng ZaloPay và nền tảng Gaming.\n- Xây dựng Design System chuẩn mực, nghiên cứu hành vi người dùng và làm việc trực tiếp với Product Manager.',
    requirements: '- Thành thạo Figma, Auto-layout, Variants, Variables và Design Tokens.\n- Có tư duy User-Centric Design và Portfolio sản phẩm thực tế.',
    deadline: '22/12/2026',
    isOpen: true,
    employerId: 'emp-vng-02',
    companyName: 'Công ty Cổ phần VNG (Zalo Corporation)',
    posterName: 'VNG Careers',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: 'job-shopee-07',
    title: 'Chuyên viên Thiết kế Đồ họa & Motion 3D (Graphic Designer)',
    industry: 'Thiết kế / Sáng tạo nghệ thuật',
    salary: '16 - 25 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh',
    experience: '1 - 3 năm kinh nghiệm',
    description: 'Sáng tạo các ấn phẩm truyền thông, Banner sự kiện Mega Sale 11.11, 12.12 và Video quảng cáo 3D Motion.',
    requirements: '- Thành thạo Adobe Photoshop, Illustrator, After Effects, Premiere Pro, Blender/Cinema 4D.\n- Năng động, bắt trend mạng xã hội nhanh nhạy.',
    deadline: '18/12/2026',
    isOpen: true,
    employerId: 'emp-shopee-04',
    companyName: 'Công ty TNHH Shopee Việt Nam',
    posterName: 'Shopee HR Team',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },

  // Nhóm Marketing / Truyền thông
  {
    id: 'job-shopee-08',
    title: 'Digital Marketing & Growth Performance Lead',
    industry: 'Marketing / Truyền thông',
    salary: '25 - 40 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh',
    experience: '3+ năm kinh nghiệm',
    description: 'Hoạch định chiến lược và tối ưu hóa ngân sách Performance Marketing hàng tỷ đồng đa kênh (Meta, Google, TikTok Ads).\n- Phân tích phễu chuyển đổi (Conversion Funnel) và tăng trưởng lượt cài đặt ứng dụng.',
    requirements: '- Kinh nghiệm quản lý ngân sách quảng cáo số lớn (> 500 triệu/tháng).\n- Kỹ năng phân tích số liệu xuất sắc với GA4, AppsFlyer, SQL cơ bản.',
    deadline: '24/12/2026',
    isOpen: true,
    employerId: 'emp-shopee-04',
    companyName: 'Công ty TNHH Shopee Việt Nam',
    posterName: 'Shopee HR Team',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: 'job-bybit-09',
    title: 'Content Creator & Social Media Marketing Executive',
    industry: 'Marketing / Truyền thông',
    salary: '12 - 18 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh',
    experience: '1 - 2 năm kinh nghiệm',
    description: 'Sáng tạo nội dung video ngắn TikTok, bài viết Facebook Fanpage và tổ chức các minigame tương tác thu hút người tìm việc trẻ.',
    requirements: '- Khả năng viết lách cuốn hút, nắm bắt trào lưu giới trẻ (Gen Z).\n- Kỹ năng quay dựng video bằng CapCut/Premiere cơ bản.',
    deadline: '26/12/2026',
    isOpen: true,
    employerId: '4Eh0EdVbfCgkOJvkg6jCYvmRBib2',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    posterName: 'Tập đoàn Công nghệ Bybit Global',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString()
  },
  {
    id: 'job-grab-10',
    title: 'Brand Marketing Manager (Food & Mart)',
    industry: 'Marketing / Truyền thông',
    salary: '35 - 55 triệu',
    location: 'Quận 7, TP. Hồ Chí Minh',
    experience: '4+ năm kinh nghiệm',
    description: 'Chịu trách nhiệm xây dựng chiến lược truyền thông thương hiệu cho dịch vụ GrabFood & GrabMart tại Việt Nam.',
    requirements: '- Tối thiểu 4 năm kinh nghiệm Brand Marketing tại các công ty FMCG hoặc Tech App.\n- Tiếng Anh lưu loát, kỹ năng quản trị dự án xuất sắc.',
    deadline: '15/12/2026',
    isOpen: true,
    employerId: 'emp-grab-08',
    companyName: 'Công ty TNHH Grab Việt Nam',
    posterName: 'Grab Talent Acquisition',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },

  // Nhóm Nhân sự / Tuyển dụng
  {
    id: 'job-vin-11',
    title: 'Chuyên viên Tuyển dụng & Thu hút Tài năng (Talent Acquisition)',
    industry: 'Quản trị Nhân sự / Tuyển dụng',
    salary: '16 - 24 triệu',
    location: 'Nam Từ Liêm, Hà Nội',
    experience: '2 - 3 năm kinh nghiệm',
    description: 'Săn đón và tuyển chọn các nhân sự cấp cao cho khối sản xuất xe điện VinFast và nghiên cứu VinAI.\n- Tổ chức phỏng vấn chuyên nghiệp, đàm phán mức lương đãi ngộ và quản lý trải nghiệm ứng viên.',
    requirements: '- Tốt nghiệp Đại học Quản trị Nhân sự, Ngoại thương, Kinh tế.\n- 2 năm kinh nghiệm Headhunt hoặc Recruiter khối ngành Kỹ thuật/Công nghệ.',
    deadline: '20/12/2026',
    isOpen: true,
    employerId: 'emp-vingroup-03',
    companyName: 'Tập đoàn Vingroup (VinFast & VinAI)',
    posterName: 'Vingroup HRBP',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 11 * 86400000).toISOString()
  },
  {
    id: 'job-fpt-12',
    title: 'Chuyên viên Đào tạo & Phát triển Nhân lực (L&D Specialist)',
    industry: 'Quản trị Nhân sự / Tuyển dụng',
    salary: '15 - 22 triệu',
    location: 'Cầu Giấy, Hà Nội',
    experience: '1 - 3 năm kinh nghiệm',
    description: 'Xây dựng lộ trình đào tạo chuyên môn kỹ thuật, kỹ năng mềm và kỹ năng lãnh đạo cho nhân viên FPT Software.',
    requirements: '- Kỹ năng thuyết trình lôi cuốn, xây dựng giáo án bài giảng chuyên nghiệp.\n- Tiếng Anh giao tiếp thành thạo.',
    deadline: '28/12/2026',
    isOpen: true,
    employerId: 'emp-fpt-01',
    companyName: 'Công ty Cổ phần FPT Software',
    posterName: 'FPT Software Recruitment',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
  },

  // Nhóm Tài chính / Ngân hàng
  {
    id: 'job-tcb-13',
    title: 'Chuyên viên Phân tích Dữ liệu Tài chính Doanh nghiệp',
    industry: 'Tài chính / Ngân hàng',
    salary: '20 - 32 triệu',
    location: 'Hoàn Kiếm, Hà Nội',
    experience: '2 - 4 năm kinh nghiệm',
    description: 'Lập báo cáo phân tích hiệu quả tài chính, theo dõi dòng tiền và dự báo chi phí hoạt động ngân hàng.\n- Xây dựng Dashboard báo cáo quản trị bằng Power BI / Tableau cho Ban Lãnh đạo.',
    requirements: '- Tốt nghiệp Tài chính - Ngân hàng, Kế toán, Kiểm toán (CFA level 1 là điểm cộng).\n- Tư duy định lượng tốt, thành thạo Excel nâng cao và SQL.',
    deadline: '22/12/2026',
    isOpen: true,
    employerId: 'emp-tcb-05',
    companyName: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    posterName: 'Techcombank Careers',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 13 * 86400000).toISOString()
  },
  {
    id: 'job-momo-14',
    title: 'Chuyên viên Quản lý Rủi ro Tín dụng & Phòng chống Gian lận (Risk Analyst)',
    industry: 'Tài chính / Ngân hàng',
    salary: '22 - 35 triệu',
    location: 'TP. Thủ Đức, TP. HCM',
    experience: '2+ năm kinh nghiệm',
    description: 'Phân tích các giao dịch bất thường, xây dựng mô hình chấm điểm tín dụng (Credit Scoring) cho các sản phẩm Ví Trả Sau MoMo.',
    requirements: '- Kinh nghiệm phân tích rủi ro tại các tổ chức Fintech hoặc Ngân hàng bán lẻ.\n- Sử dụng thành thạo Python, SQL để khai thác tập dữ liệu lớn.',
    deadline: '25/12/2026',
    isOpen: true,
    employerId: 'emp-momo-09',
    companyName: 'Công ty Cổ phần Dịch vụ Di Động Trực Tuyến (MoMo)',
    posterName: 'MoMo Talent Acquisition',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },

  // Nhóm Logistics / Vận tải / Kho bãi
  {
    id: 'job-ghtk-15',
    title: 'Trưởng nhóm Điều phối Vận tải & Quản trị Kho Hub',
    industry: 'Logistics / Vận tải / Kho bãi',
    salary: '16 - 25 triệu',
    location: 'Tân Bình, TP. Hồ Chí Minh',
    experience: '2 - 3 năm kinh nghiệm',
    description: 'Quản lý toàn bộ tiến độ xuất nhập hàng hóa, phân luồng tuyến giao hàng nội thành và điều phối đội ngũ 150+ tài xế giao nhận.',
    requirements: '- 2 năm kinh nghiệm điều hành kho vận hoặc giao hàng nhanh e-Commerce.\n- Quyết đoán, kỹ năng xử lý tình huống giao trễ và tinh thần trách nhiệm cao.',
    deadline: '24/12/2026',
    isOpen: true,
    employerId: 'emp-ghtk-06',
    companyName: 'Công ty Cổ phần Giao Hàng Tiết Kiệm (GHTK)',
    posterName: 'GHTK Recruitment',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'job-ghtk-16',
    title: 'Chuyên viên Tối ưu hóa Tuyến đường & Chuỗi Cung ứng',
    industry: 'Logistics / Vận tải / Kho bãi',
    salary: '18 - 28 triệu',
    location: 'Nam Từ Liêm, Hà Nội',
    experience: '2+ năm kinh nghiệm',
    description: 'Sử dụng thuật toán định tuyến để giảm thiểu chi phí xăng dầu, rút ngắn thời gian giao hàng và nâng cao tỷ lệ giao thành công (Delivery Success Rate > 99%).',
    requirements: '- Tốt nghiệp chuyên ngành Logistics, Quản trị Chuỗi cung ứng hoặc Hệ thống Thông tin Quản lý.',
    deadline: '19/12/2026',
    isOpen: true,
    employerId: 'emp-ghtk-06',
    companyName: 'Công ty Cổ phần Giao Hàng Tiết Kiệm (GHTK)',
    posterName: 'GHTK Recruitment',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 16 * 86400000).toISOString()
  },

  // Nhóm F&B / Khách sạn / Du lịch
  {
    id: 'job-tch-17',
    title: 'Quản lý Cửa hàng Chuỗi Cà phê (Store Manager)',
    industry: 'Du lịch / Khách sạn / F&B',
    salary: '14 - 20 triệu + Thưởng Doanh số',
    location: 'Bình Thạnh, TP. Hồ Chí Minh',
    experience: '1 - 2 năm kinh nghiệm',
    description: 'Chịu trách nhiệm toàn diện về doanh thu, kiểm soát cost nguyên vật liệu và đảm bảo chất lượng phục vụ chuẩn mực tại cửa hàng The Coffee House.',
    requirements: '- 1 năm kinh nghiệm làm Cửa hàng trưởng/phó chuỗi F&B.\n- Kỹ năng gắn kết đội ngũ, giao tiếp tận tâm và chịu được áp lực cao.',
    deadline: '20/12/2026',
    isOpen: true,
    employerId: 'emp-tch-07',
    companyName: 'Công ty Cổ phần Seedcom (The Coffee House)',
    posterName: 'The Coffee House HR',
    status: 'Đã duyệt',
    packageTier: 'FREE',
    isPremium: false,
    isPro: false,
    createdAt: new Date(Date.now() - 17 * 86400000).toISOString()
  },
  {
    id: 'job-tch-18',
    title: 'Giám sát Vận hành Dịch vụ Khách hàng (Shift Supervisor)',
    industry: 'Du lịch / Khách sạn / F&B',
    salary: '9 - 13 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh',
    experience: 'Dưới 1 năm kinh nghiệm',
    description: 'Phân ca làm việc, đào tạo nhân viên Barista và xử lý các phản hồi của khách hàng tại quầy phục vụ.',
    requirements: '- Yêu thích ngành dịch vụ F&B, tác phong nhanh nhẹn, hòa đồng.',
    deadline: '18/12/2026',
    isOpen: true,
    employerId: 'emp-tch-07',
    companyName: 'Công ty Cổ phần Seedcom (The Coffee House)',
    posterName: 'The Coffee House HR',
    status: 'Đã duyệt',
    packageTier: 'FREE',
    isPremium: false,
    isPro: false,
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString()
  },

  // Nhóm Bán lẻ / Tiêu dùng
  {
    id: 'job-grab-19',
    title: 'Key Account Executive (Phát triển Đối tác Doanh nghiệp)',
    industry: 'Bán lẻ / Tiêu dùng',
    salary: '15 - 25 triệu + Thưởng Hoa hồng',
    location: 'Quận 7, TP. Hồ Chí Minh',
    experience: '1 - 3 năm kinh nghiệm',
    description: 'Tìm kiếm, đàm phán và ký kết hợp tác với các chuỗi nhà hàng, siêu thị lớn gia nhập hệ sinh thái GrabFood & GrabMart.',
    requirements: '- Khả năng giao tiếp, đàm phán B2B xuất sắc, tư duy thương mại sắc bén.',
    deadline: '22/12/2026',
    isOpen: true,
    employerId: 'emp-grab-08',
    companyName: 'Công ty TNHH Grab Việt Nam',
    posterName: 'Grab Talent Acquisition',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 19 * 86400000).toISOString()
  },
  {
    id: 'job-vin-20',
    title: 'Giám sát Bán lẻ Showroom Xe Điện VinFast',
    industry: 'Bán lẻ / Tiêu dùng',
    salary: '18 - 30 triệu + Thưởng Doanh số',
    location: 'Hà Đông, Hà Nội',
    experience: '2+ năm kinh nghiệm',
    description: 'Quản lý chỉ tiêu doanh số điểm bán, đào tạo tư vấn viên bán hàng và tổ chức sự kiện lái thử xe điện cho khách hàng.',
    requirements: '- Kinh nghiệm bán lẻ ô tô, bất động sản hoặc hàng cao cấp.',
    deadline: '26/12/2026',
    isOpen: true,
    employerId: 'emp-vingroup-03',
    companyName: 'Tập đoàn Vingroup (VinFast & VinAI)',
    posterName: 'Vingroup HRBP',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },

  // Thêm 5 Tin Trạng thái Khác nhau (Đã Đóng / Chờ Duyệt) để phục vụ Test Dashboard & Filter
  {
    id: 'job-bybit-closed-21',
    title: 'Frontend ReactJS Intern (Đã đủ số lượng tuyển)',
    industry: 'Công nghệ thông tin (IT)',
    salary: '6 - 9 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh',
    experience: 'Không yêu cầu kinh nghiệm',
    description: 'Vị trí thực tập sinh phát triển giao diện Web Admin BybitJobs.',
    requirements: 'Biết cơ bản về HTML, CSS, JavaScript, ReactJS.',
    deadline: '01/09/2026',
    isOpen: false, // Tin Đã Đóng
    employerId: '4Eh0EdVbfCgkOJvkg6jCYvmRBib2',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    posterName: 'Tập đoàn Công nghệ Bybit Global',
    status: 'Đã đóng',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    id: 'job-momo-22',
    title: 'Senior QA / Automation Tester (Selenium / Appium)',
    industry: 'Công nghệ thông tin (IT)',
    salary: '20 - 32 triệu',
    location: 'TP. Thủ Đức, TP. HCM',
    experience: '2 - 4 năm kinh nghiệm',
    description: 'Viết kịch bản kiểm thử tự động cho các luồng thanh toán và quét mã QR trên ứng dụng MoMo.',
    requirements: 'Kinh nghiệm với Java/Python, Selenium, Appium, Postman API Testing.',
    deadline: '29/12/2026',
    isOpen: true,
    employerId: 'emp-momo-09',
    companyName: 'Công ty Cổ phần Dịch vụ Di Động Trực Tuyến (MoMo)',
    posterName: 'MoMo Talent Acquisition',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'job-shopee-23',
    title: 'Chuyên viên Quản trị Gian hàng & Hỗ trợ Khách hàng VIP',
    industry: 'Bán lẻ / Tiêu dùng',
    salary: '10 - 16 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh',
    experience: '1 năm kinh nghiệm',
    description: 'Tư vấn và giải quyết khiếu nại cho các nhà bán hàng Shopee Mall.',
    requirements: 'Giao tiếp hòa nhã, kỹ năng xử lý tình huống khéo léo.',
    deadline: '27/12/2026',
    isOpen: true,
    employerId: 'emp-shopee-04',
    companyName: 'Công ty TNHH Shopee Việt Nam',
    posterName: 'Shopee HR Team',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'job-fpt-24',
    title: 'Kỹ sư Cầu nối Tiếng Nhật (BrSE - N2/N1)',
    industry: 'Công nghệ thông tin (IT)',
    salary: '35 - 60 triệu',
    location: 'Cầu Giấy, Hà Nội',
    experience: '3+ năm kinh nghiệm',
    description: 'Làm việc trực tiếp với khách hàng Nhật Bản, phân tích yêu cầu phần mềm và chuyển giao cho đội ngũ phát triển tại Việt Nam.',
    requirements: 'Tiếng Nhật N2 cứng trở lên, có kinh nghiệm lập trình phần mềm.',
    deadline: '31/12/2026',
    isOpen: true,
    employerId: 'emp-fpt-01',
    companyName: 'Công ty Cổ phần FPT Software',
    posterName: 'FPT Software Recruitment',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'job-bybit-25',
    title: 'AI Prompt Engineer & Data Specialist',
    industry: 'Công nghệ thông tin (IT)',
    salary: '22 - 38 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh',
    experience: '1 - 3 năm kinh nghiệm',
    description: 'Thiết kế cấu trúc Prompt chất lượng cao cho Gemini AI hỗ trợ tạo CV, phân tích mức lương và tư vấn lộ trình sự nghiệp thông minh.',
    requirements: 'Tư duy logic, hiểu biết về LLMs, Python và khả năng đánh giá đầu ra của mô hình AI.',
    deadline: '30/12/2026',
    isOpen: true,
    employerId: '4Eh0EdVbfCgkOJvkg6jCYvmRBib2',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    posterName: 'Tập đoàn Công nghệ Bybit Global',
    status: 'Đã duyệt',
    packageTier: 'PREMIUM',
    isPremium: true,
    isPro: false,
    createdAt: new Date().toISOString()
  }
];

// 7. DANH SÁCH 15 HỒ SƠ ỨNG TUYỂN MẪU ĐẦY ĐỦ
const applications = [
  {
    id: 'app-demo-01',
    jobId: 'job-bybit-01',
    jobTitle: 'Senior React Native / Mobile Engineer',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    jobLocation: 'Quận 1, TP. Hồ Chí Minh (Hybrid)',
    jobSalary: '30 - 45 triệu',
    candidateId: 'cand-thanh-01',
    applicantName: 'Phạm Ngọc Thanh',
    applicantEmail: 'thanhpnit@gmail.com',
    applicantPhone: '0988 123 456',
    cvName: 'CV_PhamNgocThanh_SeniorMobile.pdf',
    cvSize: '0.8 MB',
    cvUploadTime: 'Vừa xong',
    cvUrl: 'https://bybitjobs.com/sample-cv.pdf',
    message: 'Kính gửi Ban Tuyển dụng Bybit Global, tôi có hơn 3 năm kinh nghiệm chuyên sâu với React Native, TypeScript và tối ưu hiệu năng app di động. Rất mong có cơ hội đồng hành cùng dự án!',
    status: 'Approved',
    matchScore: 95,
    appliedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'app-demo-02',
    jobId: 'job-bybit-01',
    jobTitle: 'Senior React Native / Mobile Engineer',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    jobLocation: 'Quận 1, TP. Hồ Chí Minh (Hybrid)',
    jobSalary: '30 - 45 triệu',
    candidateId: 'cand-nhan-02',
    applicantName: 'Lê Thiện Nhân',
    applicantEmail: 'nhan.le@gmail.com',
    applicantPhone: '0912 345 678',
    cvName: 'CV_LeThienNhan_Frontend.pdf',
    cvSize: '0.5 MB',
    cvUploadTime: 'Hôm qua',
    cvUrl: '',
    message: 'Tôi là lập trình viên đam mê Mobile App, từng hoàn thiện 4 dự án Expo đa nền tảng và mong muốn được ứng tuyển.',
    status: 'Pending',
    matchScore: 88,
    appliedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'app-demo-03',
    jobId: 'job-bybit-02',
    jobTitle: 'Backend Node.js & Cloud Architect',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    jobLocation: 'Cầu Giấy, Hà Nội',
    jobSalary: '25 - 40 triệu',
    candidateId: 'cand-sang-03',
    applicantName: 'Lê Hoàng Sang',
    applicantEmail: 'lechilinh02410@gmail.com',
    applicantPhone: '0988 080 649',
    cvName: 'CV_LeHoangSang_Backend.pdf',
    cvSize: '0.6 MB',
    cvUploadTime: '2 ngày trước',
    cvUrl: '',
    message: 'Tôi có kinh nghiệm thiết kế API Node.js, tích hợp cơ sở dữ liệu NoSQL Firestore và muốn cống hiến cho Bybit Global.',
    status: 'Pending',
    matchScore: 92,
    appliedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'app-demo-04',
    jobId: 'job-bybit-09',
    jobTitle: 'Content Creator & Social Media Marketing Executive',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    jobLocation: 'Quận 1, TP. Hồ Chí Minh',
    jobSalary: '12 - 18 triệu',
    candidateId: 'cand-khoa-04',
    applicantName: 'Đoàn Nguyễn Anh Khoa',
    applicantEmail: 'khoa.doan@gmail.com',
    applicantPhone: '0977 888 999',
    cvName: 'CV_AnhKhoa_Media.pdf',
    cvSize: '0.7 MB',
    cvUploadTime: '3 ngày trước',
    cvUrl: '',
    message: 'Em có kinh nghiệm sáng tạo nội dung video ngắn TikTok đạt triệu view và quản lý Fanpage cộng đồng.',
    status: 'Approved',
    matchScore: 85,
    appliedAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'app-demo-05',
    jobId: 'job-vin-11',
    jobTitle: 'Chuyên viên Tuyển dụng & Thu hút Tài năng (Talent Acquisition)',
    companyName: 'Tập đoàn Vingroup (VinFast & VinAI)',
    jobLocation: 'Nam Từ Liêm, Hà Nội',
    jobSalary: '16 - 24 triệu',
    candidateId: 'cand-thao-05',
    applicantName: 'Nguyễn Phương Thảo',
    applicantEmail: 'thao.nguyen.hr@gmail.com',
    applicantPhone: '0934 567 890',
    cvName: 'CV_PhuongThao_HRBP.pdf',
    cvSize: '0.4 MB',
    cvUploadTime: 'Vừa xong',
    cvUrl: '',
    message: 'Tôi có hơn 2 năm kinh nghiệm làm Headhunt khối IT và mong muốn gia nhập đội ngũ nhân sự VinFast.',
    status: 'Pending',
    matchScore: 89,
    appliedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'app-demo-06',
    jobId: 'job-vng-06',
    jobTitle: 'UI/UX Product Designer (Design System Lead)',
    companyName: 'Công ty Cổ phần VNG (Zalo Corporation)',
    jobLocation: 'Quận 7, TP. Hồ Chí Minh',
    jobSalary: '22 - 35 triệu',
    candidateId: 'cand-minh-06',
    applicantName: 'Trần Văn Minh',
    applicantEmail: 'minh.design@gmail.com',
    applicantPhone: '0945 111 222',
    cvName: 'CV_TranMinh_ProductDesign.pdf',
    cvSize: '1.2 MB',
    cvUploadTime: '4 ngày trước',
    cvUrl: '',
    message: 'Đính kèm Portfolio thiết kế ZaloPay Redesign trên Figma với đầy đủ User Research và Prototyping.',
    status: 'Approved',
    matchScore: 94,
    appliedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'app-demo-07',
    jobId: 'job-tcb-13',
    jobTitle: 'Chuyên viên Phân tích Dữ liệu Tài chính Doanh nghiệp',
    companyName: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    jobLocation: 'Hoàn Kiếm, Hà Nội',
    jobSalary: '20 - 32 triệu',
    candidateId: 'cand-nam-07',
    applicantName: 'Hoàng Thành Nam',
    applicantEmail: 'nam.hoang.finance@gmail.com',
    applicantPhone: '0966 333 444',
    cvName: 'CV_ThanhNam_CFA.pdf',
    cvSize: '0.6 MB',
    cvUploadTime: '2 ngày trước',
    cvUrl: '',
    message: 'Đã đỗ chứng chỉ CFA Level 1, có 2 năm kinh nghiệm phân tích báo cáo tài chính tại công ty chứng khoán.',
    status: 'Pending',
    matchScore: 91,
    appliedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'app-demo-08',
    jobId: 'job-ghtk-15',
    jobTitle: 'Trưởng nhóm Điều phối Vận tải & Quản trị Kho Hub',
    companyName: 'Công ty Cổ phần Giao Hàng Tiết Kiệm (GHTK)',
    jobLocation: 'Tân Bình, TP. Hồ Chí Minh',
    jobSalary: '16 - 25 triệu',
    candidateId: 'cand-tuan-08',
    applicantName: 'Nguyễn Văn Tuấn',
    applicantEmail: 'tuan.logistics@gmail.com',
    applicantPhone: '0918 555 666',
    cvName: 'CV_VanTuan_Logistics.pdf',
    cvSize: '0.5 MB',
    cvUploadTime: '3 ngày trước',
    cvUrl: '',
    message: 'Tôi từng quản lý kho Hub 500m2 với đội ngũ 80 tài xế, nắm vững quy trình xử lý đơn hàng cao điểm.',
    status: 'Pending',
    matchScore: 86,
    appliedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'app-demo-09',
    jobId: 'job-tch-17',
    jobTitle: 'Quản lý Cửa hàng Chuỗi Cà phê (Store Manager)',
    companyName: 'Công ty Cổ phần Seedcom (The Coffee House)',
    jobLocation: 'Bình Thạnh, TP. Hồ Chí Minh',
    jobSalary: '14 - 20 triệu + Thưởng Doanh số',
    candidateId: 'cand-hang-09',
    applicantName: 'Đặng Thu Hằng',
    applicantEmail: 'hang.dang.fnb@gmail.com',
    applicantPhone: '0982 777 888',
    cvName: 'CV_ThuHang_StoreManager.pdf',
    cvSize: '0.4 MB',
    cvUploadTime: '1 tuần trước',
    cvUrl: '',
    message: '2 năm kinh nghiệm làm Cửa hàng phó tại chuỗi Highlands Coffee, có kỹ năng đào tạo Barista và quản lý doanh thu.',
    status: 'Approved',
    matchScore: 90,
    appliedAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'app-demo-10',
    jobId: 'job-bybit-25',
    jobTitle: 'AI Prompt Engineer & Data Specialist',
    companyName: 'Tập đoàn Công nghệ Bybit Global',
    jobLocation: 'Quận 1, TP. Hồ Chí Minh',
    jobSalary: '22 - 38 triệu',
    candidateId: 'cand-duc-10',
    applicantName: 'Phạm Minh Đức',
    applicantEmail: 'duc.pham.ai@gmail.com',
    applicantPhone: '0971 222 333',
    cvName: 'CV_MinhDuc_AIEngineer.pdf',
    cvSize: '0.9 MB',
    cvUploadTime: 'Vừa xong',
    cvUrl: '',
    message: 'Có kinh nghiệm fine-tune LLM, viết system prompt tối ưu cho Gemini và Claude.',
    status: 'Pending',
    matchScore: 96,
    appliedAt: new Date().toISOString()
  }
];

// 8. LƯỢT XEM VIỆC LÀM (viewedJobs) ĐỂ DASHBOARD THỐNG KÊ LƯỢT XEM
const viewedJobs = [
  { id: 'view-01', jobId: 'job-bybit-01', userId: 'cand-thanh-01', viewedAt: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: 'view-02', jobId: 'job-bybit-01', userId: 'cand-nhan-02', viewedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'view-03', jobId: 'job-bybit-01', userId: 'cand-sang-03', viewedAt: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'view-04', jobId: 'job-bybit-01', userId: 'cand-khoa-04', viewedAt: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 'view-05', jobId: 'job-bybit-02', userId: 'cand-thao-05', viewedAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'view-06', jobId: 'job-bybit-02', userId: 'cand-minh-06', viewedAt: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: 'view-07', jobId: 'job-bybit-09', userId: 'cand-nam-07', viewedAt: new Date(Date.now() - 7 * 3600000).toISOString() },
  { id: 'view-08', jobId: 'job-bybit-09', userId: 'cand-tuan-08', viewedAt: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: 'view-09', jobId: 'job-bybit-25', userId: 'cand-hang-09', viewedAt: new Date(Date.now() - 9 * 3600000).toISOString() },
  { id: 'view-10', jobId: 'job-bybit-25', userId: 'cand-duc-10', viewedAt: new Date(Date.now() - 10 * 3600000).toISOString() },
  { id: 'view-11', jobId: 'job-fpt-03', userId: 'cand-thanh-01', viewedAt: new Date(Date.now() - 11 * 3600000).toISOString() },
  { id: 'view-12', jobId: 'job-vng-06', userId: 'cand-nhan-02', viewedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: 'view-13', jobId: 'job-shopee-08', userId: 'cand-sang-03', viewedAt: new Date(Date.now() - 13 * 3600000).toISOString() },
  { id: 'view-14', jobId: 'job-tcb-13', userId: 'cand-khoa-04', viewedAt: new Date(Date.now() - 14 * 3600000).toISOString() },
  { id: 'view-15', jobId: 'job-ghtk-15', userId: 'cand-thao-05', viewedAt: new Date(Date.now() - 15 * 3600000).toISOString() }
];

// 9. THÔNG BÁO HỆ THỐNG (notifications)
const notifications = [
  {
    id: 'notif-01',
    title: 'Chào mừng bạn đến với BybitJobs! 🎉',
    body: 'Khám phá hơn 25 việc làm chất lượng cao và trải nghiệm công cụ AI gợi ý việc làm thông minh.',
    type: 'system',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif-02',
    title: 'Có hồ sơ ứng tuyển mới 📄',
    body: 'Ứng viên Phạm Ngọc Thanh vừa nộp hồ sơ vào vị trí Senior React Native Engineer của bạn.',
    type: 'application',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
  },
  {
    id: 'notif-03',
    title: 'Gói VIP Premium đã sẵn sàng 👑',
    body: 'Doanh nghiệp của bạn đang sở hữu gói Premium không giới hạn tin tuyển dụng và ưu tiên xuất hiện trang đầu.',
    type: 'package',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
  }
];

// HÀM THỰC THI NẠP DATA LÊN FIRESTORE
async function seedFullData() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU QUY TRÌNH NẠP TRÊN 50 BẢN GHI CHUẨN ĐẸP VÀO FIRESTORE');
  console.log('================================================================\n');

  // 1. Nạp Ngành nghề (8)
  console.log('1. Đang nạp danh mục Ngành nghề (industries)...');
  for (const ind of industries) {
    await setDoc(doc(db, 'industries', ind.id), ind, { merge: true });
  }
  console.log(`✅ Đã nạp ${industries.length} ngành nghề.`);

  // 2. Nạp Kỹ năng (10)
  console.log('\n2. Đang nạp danh mục Kỹ năng (skills)...');
  for (const sk of skills) {
    await setDoc(doc(db, 'skills', sk.id), sk, { merge: true });
  }
  console.log(`✅ Đã nạp ${skills.length} kỹ năng.`);

  // 3. Nạp Gói dịch vụ & Thanh toán (5)
  console.log('\n3. Đang nạp Gói dịch vụ & Phương thức thanh toán...');
  for (const pkg of packages) {
    await setDoc(doc(db, 'packages', pkg.id), pkg, { merge: true });
  }
  for (const pm of paymentMethods) {
    await setDoc(doc(db, 'paymentMethods', pm.id), pm, { merge: true });
  }
  console.log(`✅ Đã nạp ${packages.length} gói dịch vụ & ${paymentMethods.length} phương thức thanh toán.`);

  // 4. Nạp Doanh nghiệp (10)
  console.log('\n4. Đang nạp 10 Doanh nghiệp uy tín hàng đầu (employers)...');
  for (const emp of employers) {
    await setDoc(doc(db, 'employers', emp.id), emp, { merge: true });
  }
  console.log(`✅ Đã nạp ${employers.length} doanh nghiệp có đầy đủ Logo, Banner, MST.`);

  // 5. Nạp Việc làm (25)
  console.log('\n5. Đang nạp 25 Việc làm tuyển dụng đa dạng (jobs)...');
  for (const job of jobs) {
    await setDoc(doc(db, 'jobs', job.id), job, { merge: true });
  }
  console.log(`✅ Đã nạp ${jobs.length} tin tuyển dụng có đầy đủ Lương, Địa điểm, Yêu cầu, Trạng thái.`);

  // 6. Nạp Hồ sơ ứng tuyển (10)
  console.log('\n6. Đang nạp Hồ sơ ứng tuyển (applications)...');
  for (const appItem of applications) {
    await setDoc(doc(db, 'applications', appItem.id), appItem, { merge: true });
  }
  console.log(`✅ Đã nạp ${applications.length} đơn ứng tuyển mẫu có điểm Match Score.`);

  // 7. Nạp Lượt xem tin (15)
  console.log('\n7. Đang nạp Thống kê lượt xem (viewedJobs)...');
  for (const v of viewedJobs) {
    await setDoc(doc(db, 'viewedJobs', v.id), v, { merge: true });
  }
  console.log(`✅ Đã nạp ${viewedJobs.length} lượt xem việc làm cho Dashboard.`);

  // 8. Nạp Thông báo (3)
  console.log('\n8. Đang nạp Thông báo hệ thống (notifications)...');
  for (const notif of notifications) {
    await setDoc(doc(db, 'notifications', notif.id), notif, { merge: true });
  }
  console.log(`✅ Đã nạp ${notifications.length} thông báo.`);

  const totalRecords = industries.length + skills.length + packages.length + paymentMethods.length + employers.length + jobs.length + applications.length + viewedJobs.length + notifications.length;

  console.log('\n================================================================');
  console.log(`🎉 TỔNG CỘNG ĐÃ NẠP THÀNH CÔNG ${totalRecords} BẢN GHI ĐẦY ĐỦ VÀO FIRESTORE!`);
  console.log('================================================================\n');
  process.exit(0);
}

seedFullData().catch((err) => {
  console.error('❌ Lỗi nạp dữ liệu:', err);
  process.exit(1);
});
