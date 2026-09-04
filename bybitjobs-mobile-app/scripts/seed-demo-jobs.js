// scripts/seed-demo-jobs.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAJrjqkcxdI7N4tc5H6vF-FnVcCyv3NsLc",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "bybitjobs.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "bybitjobs",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "bybitjobs.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "811135097267",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:811135097267:web:dab5c4e8ea4dee79cd93c6",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9K2536WERT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const demoJobs = [
  {
    title: 'Senior Frontend Engineer (React / React Native)',
    industry: 'Công nghệ thông tin',
    salary: '25 - 40 triệu',
    location: 'Quận 1, TP. Hồ Chí Minh (Hybrid)',
    description: 'Chịu trách nhiệm thiết kế kiến trúc và phát triển ứng dụng di động đa nền tảng và cổng portal người dùng BybitJobs.',
    requirements: 'Tối thiểu 3 năm kinh nghiệm với React Native, TypeScript, Redux/Zustand. Có kinh nghiệm tối ưu hiệu năng và deploy lên App Store/Google Play.',
    deadline: '30/11/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 2,
    applicantsCount: 0,
    posterName: 'Công ty Cổ phần Công nghệ BybitJobs',
    posterFullName: 'Trần Minh Tuấn (HR Director)',
    status: 'Hoạt động',
    isPremium: true,
    createdAt: new Date().toISOString()
  },
  {
    title: 'Chuyên viên Tuyển dụng & Đào tạo (HR Recruitment)',
    industry: 'Nhân sự',
    salary: '14 - 20 triệu',
    location: 'Cầu Giấy, Hà Nội',
    description: 'Tìm kiếm nguồn ứng viên tiềm năng cho các vị trí Tech, Sales, Marketing. Tổ chức phỏng vấn và quản lý quy trình Onboarding.',
    requirements: '1-2 năm kinh nghiệm tuyển dụng mảng Công nghệ hoặc Dịch vụ. Kỹ năng giao tiếp và đàm phán xuất sắc.',
    deadline: '25/11/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 1,
    applicantsCount: 0,
    posterName: 'Tập đoàn Đầu tư & Phát triển Nguồn nhân lực Bybit',
    posterFullName: 'Lê Hoàng Yến (HR Manager)',
    status: 'Hoạt động',
    isPremium: false,
    createdAt: new Date().toISOString()
  },
  {
    title: 'Digital Marketing & Growth Specialist',
    industry: 'Marketing / Truyền thông',
    salary: '18 - 28 triệu',
    location: 'Quận 3, TP. Hồ Chí Minh',
    description: 'Lên kế hoạch và thực thi các chiến dịch Performance Marketing (Meta Ads, Google Ads, TikTok Ads) nhằm tăng trưởng người dùng nền tảng.',
    requirements: 'Có từ 2 năm kinh nghiệm chạy ads đa kênh. Am hiểu SEO, App Store Optimization (ASO) là lợi thế lớn.',
    deadline: '28/11/2026',
    isOpen: true,
    type: 'Toàn thời gian',
    requiredCount: 2,
    applicantsCount: 0,
    posterName: 'Bybit Media & Growth Lab',
    posterFullName: 'Nguyễn Quốc Bảo (Head of Marketing)',
    status: 'Hoạt động',
    isPremium: true,
    createdAt: new Date().toISOString()
  }
];

async function seedJobs() {
  console.log('🚀 Đang kiểm tra danh sách jobs hiện có trên Firestore...');
  const snapshot = await getDocs(collection(db, 'jobs'));
  console.log(`📊 Số lượng việc làm hiện có trên Firestore: ${snapshot.size}`);

  console.log('✨ Đang thêm các công việc mẫu chuẩn vào Firestore...');
  for (const job of demoJobs) {
    const docRef = await addDoc(collection(db, 'jobs'), job);
    console.log(`✅ Đã thêm việc làm: [${job.title}] - ID: ${docRef.id}`);
  }

  console.log('\n🎉 Đã nạp dữ liệu mẫu sạch thành công! Bạn có thể mở app để kiểm tra.');
  process.exit(0);
}

seedJobs().catch((err) => {
  console.error('❌ Lỗi khi nạp dữ liệu mẫu:', err);
  process.exit(1);
});
