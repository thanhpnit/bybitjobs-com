// scripts/seed-pro-data.cjs
// Script nạp thêm dữ liệu mẫu chất lượng cao cho GÓI PRO (Doanh nghiệp Pro ⭐) vào Firebase Firestore

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  getDocs
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

// 1. Cập nhật các Nhà tuyển dụng sở hữu GÓI PRO
const proEmployers = [
  {
    id: 'emp-tcb-05',
    companyName: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    taxId: '0100230800',
    phoneNumber: '1800 588 822',
    address: '6 Quang Trung, Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
    website: 'https://techcombank.com',
    industry: 'Tài chính / Ngân hàng',
    scale: '12,000+ nhân viên',
    description: 'Ngân hàng số hàng đầu Việt Nam tiên phong áp dụng công nghệ dữ liệu lớn, AI và thanh toán số.',
    logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Pro',
    usedPosts: 5,
    packageExpiresAt: '2027-12-31T23:59:59.000Z',
    isPro: true,
    isPremium: false,
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-ghtk-06',
    companyName: 'Công ty Cổ phần Giao Hàng Tiết Kiệm (GHTK)',
    taxId: '0106181807',
    phoneNumber: '1900 6092',
    address: 'Tòa nhà VTV, Số 8 Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội',
    website: 'https://giaohangtietkiem.vn',
    industry: 'Logistics / Vận tải / Kho bãi',
    scale: '30,000+ nhân viên',
    description: 'Doanh nghiệp bưu chính công nghệ top 1 Việt Nam phủ sóng 63 tỉnh thành với hệ thống điều vận tự động hiện đại.',
    logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Pro',
    usedPosts: 4,
    packageExpiresAt: '2027-12-31T23:59:59.000Z',
    isPro: true,
    isPremium: false,
    isVerified: true,
    status: 'Active'
  },
  {
    id: 'emp-shopee-04',
    companyName: 'Công ty TNHH Shopee Việt Nam',
    taxId: '0313426177',
    phoneNumber: '1900 1221',
    address: 'Tầng 17 Tòa nhà Saigon Centre 2, 67 Lê Lợi, Bến Nghé, Quận 1, TP. HCM',
    website: 'https://shopee.vn',
    industry: 'Bán lẻ / Tiêu dùng',
    scale: '5,000+ nhân viên',
    description: 'Sàn thương mại điện tử số 1 Đông Nam Á và Việt Nam, mang đến trải nghiệm mua sắm trực tuyến vượt trội.',
    logo: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1000&auto=format&fit=crop&q=80',
    currentPackage: 'Pro',
    usedPosts: 4,
    packageExpiresAt: '2027-12-31T23:59:59.000Z',
    isPro: true,
    isPremium: false,
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
    currentPackage: 'Pro',
    usedPosts: 3,
    packageExpiresAt: '2027-12-31T23:59:59.000Z',
    isPro: true,
    isPremium: false,
    isVerified: true,
    status: 'Active'
  }
];

// 2. DANH SÁCH TIN TUYỂN DỤNG GÓI PRO (Đa dạng ngành nghề, đầy đủ > 8 tin để test Xem thêm)
const proJobs = [
  {
    id: 'job-pro-01',
    title: 'Chuyên viên Phân tích Dữ liệu Tài chính Doanh nghiệp',
    industry: 'Tài chính / Ngân hàng',
    salary: '22 - 35 triệu',
    location: 'Hoàn Kiếm, Hà Nội',
    experience: '2 - 4 năm kinh nghiệm',
    description: 'Lập báo cáo phân tích hiệu quả tài chính, theo dõi dòng tiền và dự báo chi phí hoạt động ngân hàng.\n- Xây dựng Dashboard báo cáo quản trị bằng Power BI / Tableau cho Ban Lãnh đạo.\n- Phối hợp với khối công nghệ phân tích hành vi thanh toán số của khách hàng.',
    requirements: '- Tốt nghiệp Tài chính - Ngân hàng, Kế toán, Kiểm toán (CFA level 1 là điểm cộng).\n- Tư duy định lượng tốt, thành thạo Excel nâng cao và SQL.\n- Khả năng đọc hiểu tài liệu và phân tích chỉ số tài chính xuất sắc.',
    deadline: '28/12/2026',
    isOpen: true,
    employerId: 'emp-tcb-05',
    companyName: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    posterName: 'Techcombank Talent Acquisition',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'job-pro-02',
    title: 'Trưởng nhóm Điều phối Vận tải & Quản trị Kho Hub',
    industry: 'Logistics / Vận tải / Kho bãi',
    salary: '18 - 26 triệu',
    location: 'Tân Bình, TP. Hồ Chí Minh',
    experience: '2 - 3 năm kinh nghiệm',
    description: 'Quản lý toàn bộ tiến độ xuất nhập hàng hóa, phân luồng tuyến giao hàng nội thành và điều phối đội ngũ 150+ tài xế giao nhận.\n- Tối ưu hóa thời gian xử lý đơn hàng tại kho trung chuyển Hub.\n- Giám sát chỉ số SLA giao hàng đúng hẹn đạt trên 98.5%.',
    requirements: '- 2 năm kinh nghiệm điều hành kho vận hoặc giao hàng nhanh e-Commerce.\n- Quyết đoán, kỹ năng xử lý tình huống phát sinh và tinh thần trách nhiệm cao.',
    deadline: '30/12/2026',
    isOpen: true,
    employerId: 'emp-ghtk-06',
    companyName: 'Công ty Cổ phần Giao Hàng Tiết Kiệm (GHTK)',
    posterName: 'GHTK Recruitment',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'job-pro-03',
    title: 'Senior E-Commerce Category Operations Specialist',
    industry: 'Bán lẻ / Tiêu dùng',
    salary: '25 - 38 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh',
    experience: '3+ năm kinh nghiệm',
    description: 'Quản lý và phát triển ngành hàng Điện tử & Gia dụng trên sàn Shopee Mall.\n- Hoạch định chiến lược khuyến mãi các ngày Mega Sale 9.9, 11.11, 12.12.\n- Phân tích dữ liệu doanh thu GMV và xu hướng tiêu dùng trực tuyến.',
    requirements: '- Tốt nghiệp Đại học chuyên ngành Kinh tế, Quản trị Kinh doanh, Marketing.\n- Tối thiểu 3 năm kinh nghiệm trong lĩnh vực E-Commerce / FMCG.\n- Tiếng Anh giao tiếp thành thạo, khả năng đàm phán hợp tác thương hiệu tốt.',
    deadline: '25/12/2026',
    isOpen: true,
    employerId: 'emp-shopee-04',
    companyName: 'Công ty TNHH Shopee Việt Nam',
    posterName: 'Shopee Vietnam HR Team',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'job-pro-04',
    title: 'Quản lý Cửa hàng Chuỗi Cà phê (Store Manager)',
    industry: 'Du lịch / Khách sạn / F&B',
    salary: '16 - 24 triệu',
    location: 'Bình Thạnh, TP. Hồ Chí Minh',
    experience: '2+ năm kinh nghiệm',
    description: 'Chịu trách nhiệm toàn diện về doanh số, chất lượng dịch vụ và quản trị vận hành điểm bán The Coffee House.\n- Đào tạo và phát triển đội ngũ 20+ Barista và nhân viên phục vụ bàn.\n- Quản lý định mức nguyên vật liệu (Cost control) và vệ sinh an toàn thực phẩm.',
    requirements: '- 2 năm kinh nghiệm quản lý cửa hàng F&B, chuỗi cà phê hoặc thức ăn nhanh.\n- Kỹ năng lãnh đạo, giải quyết khiếu nại khách hàng và quản trị ca làm việc linh hoạt.',
    deadline: '26/12/2026',
    isOpen: true,
    employerId: 'emp-tch-07',
    companyName: 'Công ty Cổ phần Seedcom (The Coffee House)',
    posterName: 'The Coffee House Recruitment',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'job-pro-05',
    title: 'Kỹ sư Tối ưu hóa Tuyến đường & Thuật toán Vận tải (Routing Engineer)',
    industry: 'Logistics / Vận tải / Kho bãi',
    salary: '20 - 32 triệu',
    location: 'Nam Từ Liêm, Hà Nội',
    experience: '2 - 4 năm kinh nghiệm',
    description: 'Xây dựng thuật toán phân chia đơn hàng tự động và tối ưu lộ trình xe tải liên tỉnh.\n- Giảm thiểu chi phí tiêu hao nhiên liệu và tăng tốc độ giao vận chặng cuối.\n- Làm việc trực tiếp với đội ngũ Data Science để tối ưu bài toán giao nhận hàng hóa.',
    requirements: '- Thành thạo Python, C++ hoặc Java và các thuật toán đồ thị, tối ưu hóa tuyến đường (VRP).\n- Đam mê giải quyết bài toán logistics thực tế quy mô hàng triệu đơn mỗi ngày.',
    deadline: '29/12/2026',
    isOpen: true,
    employerId: 'emp-ghtk-06',
    companyName: 'Công ty Cổ phần Giao Hàng Tiết Kiệm (GHTK)',
    posterName: 'GHTK Recruitment',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'job-pro-06',
    title: 'Chuyên viên Tư vấn Tài chính Doanh nghiệp SME & FDI',
    industry: 'Tài chính / Ngân hàng',
    salary: '18 - 30 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh',
    experience: '1 - 3 năm kinh nghiệm',
    description: 'Phát triển khách hàng doanh nghiệp vừa và nhỏ (SME), tư vấn các gói vay vốn kinh doanh, bảo lãnh thanh toán quốc tế và dịch vụ quản trị dòng tiền.',
    requirements: '- Tốt nghiệp Đại học chuyên ngành Tài chính, Ngân hàng, Ngoại thương.\n- Giao tiếp lưu loát, ngoại hình sáng, khả năng đàm phán và thuyết phục xuất sắc.',
    deadline: '31/12/2026',
    isOpen: true,
    employerId: 'emp-tcb-05',
    companyName: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    posterName: 'Techcombank Careers',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: 'job-pro-07',
    title: 'Giám sát Vận hành Chuỗi Cung ứng Thương mại Điện tử',
    industry: 'Bán lẻ / Tiêu dùng',
    salary: '17 - 25 triệu',
    location: 'Củ Chi, TP. Hồ Chí Minh',
    experience: '2+ năm kinh nghiệm',
    description: 'Giám sát tiến độ đóng gói, hoàn tất đơn hàng (Fulfillment Center) Shopee Xpress.\n- Đảm bảo hàng hóa được phân loại và xuất kho đúng tiêu chuẩn đóng gói an toàn.',
    requirements: '- Kỹ năng tổ chức công việc theo ca, quản trị kho hàng lớn.\n- Sử dụng thành thạo phần mềm WMS và Excel báo cáo sản lượng.',
    deadline: '27/12/2026',
    isOpen: true,
    employerId: 'emp-shopee-04',
    companyName: 'Công ty TNHH Shopee Việt Nam',
    posterName: 'Shopee Logistics Talent',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'job-pro-08',
    title: 'Chuyên viên Đào tạo & Quản lý Chất lượng Barista (QA Trainer)',
    industry: 'Du lịch / Khách sạn / F&B',
    salary: '15 - 22 triệu',
    location: 'Quận 3, TP. Hồ Chí Minh',
    experience: '2 - 3 năm kinh nghiệm',
    description: 'Xây dựng tiêu chuẩn pha chế đồ uống cà phê, trà sữa và kiểm định chất lượng định kỳ tại các cửa hàng khu vực miền Nam.',
    requirements: '- Có chứng chỉ Barista SCA hoặc kinh nghiệm đào tạo pha chế tại các chuỗi F&B chuyên nghiệp.\n- Tận tâm, yêu thích sáng tạo công thức nước uống mới.',
    deadline: '30/12/2026',
    isOpen: true,
    employerId: 'emp-tch-07',
    companyName: 'Công ty Cổ phần Seedcom (The Coffee House)',
    posterName: 'The Coffee House HRBP',
    status: 'Đã duyệt',
    packageTier: 'PRO',
    isPro: true,
    isPremium: false,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  }
];

async function seedProData() {
  console.log('🚀 Bắt đầu nạp dữ liệu GÓI PRO vào Firebase Firestore...');

  // 1. Cập nhật Doanh nghiệp Pro
  console.log('📦 Đang cập nhật 4 Doanh nghiệp Gói Pro...');
  for (const emp of proEmployers) {
    await setDoc(doc(db, 'employers', emp.id), emp, { merge: true });
    console.log(`  ✅ Đã cập nhật Doanh nghiệp Pro: ${emp.companyName}`);
  }

  // 2. Nạp Tin tuyển dụng Gói Pro
  console.log('💼 Đang nạp 8 Tin tuyển dụng Gói Pro...');
  for (const job of proJobs) {
    await setDoc(doc(db, 'jobs', job.id), job, { merge: true });
    console.log(`  ✅ Đã nạp Tin Pro [${job.id}]: ${job.title} (${job.companyName})`);
  }

  console.log('\n🎉 HOÀN TẤT NẠP DỮ LIỆU GÓI PRO THÀNH CÔNG 100%!');
  process.exit(0);
}

seedProData().catch((err) => {
  console.error('❌ Lỗi nạp dữ liệu Pro:', err);
  process.exit(1);
});
