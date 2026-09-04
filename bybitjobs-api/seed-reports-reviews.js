const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedReportsAndReviews() {
  console.log('🔄 Đang tạo collection reports và reviews trên Firestore...');

  // 1. Khởi tạo dữ liệu collection reports (Báo cáo vi phạm)
  const reportsData = [
    {
      id: 'report-1',
      reporterName: 'Nguyễn Văn An',
      reporterEmail: 'an.nguyen@gmail.com',
      targetName: 'Công ty TNHH Bất Động Sản Alpha',
      targetType: 'Doanh nghiệp',
      reason: 'Đăng tin tuyển dụng sai sự thật, yêu cầu đóng tiền cọc 500k khi phỏng vấn',
      status: 'Chờ xử lý',
      createdAt: new Date('2026-08-28T09:30:00Z').toISOString()
    },
    {
      id: 'report-2',
      reporterName: 'Lê Thị Mai',
      reporterEmail: 'mai.le@gmail.com',
      targetName: 'Tuyển nhân viên nhập liệu online 500k/ngày',
      targetType: 'Tin tuyển dụng',
      reason: 'Dấu hiệu lừa đảo đa cấp, yêu cầu cung cấp mã OTP ngân hàng',
      status: 'Đã xử lý',
      createdAt: new Date('2026-08-25T14:15:00Z').toISOString()
    },
    {
      id: 'report-3',
      reporterName: 'Phạm Quốc Bảo',
      reporterEmail: 'bao.pham@gmail.com',
      targetName: 'Tập đoàn Công nghệ Beta',
      targetType: 'Doanh nghiệp',
      reason: 'Thái độ phỏng vấn không chuẩn mực, thu phí hồ sơ trái quy định',
      status: 'Chờ xử lý',
      createdAt: new Date('2026-09-01T11:20:00Z').toISOString()
    }
  ];

  for (const report of reportsData) {
    await db.collection('reports').doc(report.id).set(report);
    console.log(`✅ Đã tạo document trong collection 'reports': ${report.id}`);
  }

  // 2. Khởi tạo dữ liệu collection reviews (Đánh giá công ty)
  const reviewsData = [
    {
      id: 'review-1',
      userName: 'Nguyễn Văn An',
      userEmail: 'an.nguyen@gmail.com',
      companyName: 'Công ty TNHH Bybit Việt Nam',
      rating: 5,
      comment: 'Môi trường làm việc năng động, đồng nghiệp thân thiện, chế độ đãi ngộ vô cùng tốt!',
      status: 'Đã duyệt',
      createdAt: new Date('2026-08-29T10:00:00Z').toISOString()
    },
    {
      id: 'review-2',
      userName: 'Trần Thị Bình',
      userEmail: 'binh.tran@gmail.com',
      companyName: 'TechAsia Solutions',
      rating: 4,
      comment: 'Văn phòng hiện đại, lương thưởng đúng hạn nhưng deadline hơi gấp.',
      status: 'Đã duyệt',
      createdAt: new Date('2026-08-20T16:45:00Z').toISOString()
    },
    {
      id: 'review-3',
      userName: 'Lê Minh Cường',
      userEmail: 'cuong.le@gmail.com',
      companyName: 'Công ty Truyền thông AdMax',
      rating: 2,
      comment: 'Thường xuyên chậm lương, môi trường làm việc khá áp lực.',
      status: 'Chờ duyệt',
      createdAt: new Date('2026-09-02T08:15:00Z').toISOString()
    }
  ];

  for (const review of reviewsData) {
    await db.collection('reviews').doc(review.id).set(review);
    console.log(`✅ Đã tạo document trong collection 'reviews': ${review.id}`);
  }

  console.log('🎉 Hoàn tất khởi tạo 2 collection reports và reviews trên Firestore!');
  process.exit(0);
}

seedReportsAndReviews().catch(err => {
  console.error('❌ Lỗi khởi tạo reports và reviews:', err);
  process.exit(1);
});

