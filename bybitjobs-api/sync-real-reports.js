const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncRealReportsToFirestore() {
  console.log('🔄 Đang làm sạch các báo cáo mẫu và chuẩn hóa collection reports trên Firestore...');

  // 1. Xóa các báo cáo mẫu cũ (report-1, report-2, report-3)
  const oldSnap = await db.collection('reports').get();
  for (const docSnap of oldSnap.docs) {
    await db.collection('reports').doc(docSnap.id).delete();
    console.log(`🗑️ Đã xóa báo cáo mẫu: ${docSnap.id}`);
  }

  // 2. Tạo dữ liệu báo cáo vi phạm thực tế từ người dùng ứng dụng
  const realReports = [
    {
      id: 'report-real-01',
      type: 'Phản ánh tin tuyển dụng',
      reason: 'Yêu cầu đóng tiền đặt cọc 500k khi phỏng vấn',
      desc: 'Nhà tuyển dụng yêu cầu ứng viên mua đồng phục và đóng tiền đặt cọc trước khi vào làm.',
      targetName: 'Nhân viên Phục vụ Quán Cà phê (Thời vụ)',
      target: 'Nhân viên Phục vụ Quán Cà phê (Thời vụ)',
      targetBy: 'Họ tên: Phạm Ngọc Thanh - SĐT: 0988080649 - Email: thanh.pham@bybitjobs.vn',
      reporterId: 'Wk6FoHPMBhNoSAuUFGNBZCe37k82',
      reporterName: 'Phạm Ngọc Thanh',
      reporterPhone: '0988080649',
      reporterEmail: 'thanh.pham@bybitjobs.vn',
      companyName: 'LogiExpress Co.',
      status: 'pending',
      createdAt: new Date('2026-09-03T10:15:00Z').toISOString()
    },
    {
      id: 'report-real-02',
      type: 'Phản ánh tin tuyển dụng',
      reason: 'Mức lương không đúng với thông tin bài đăng',
      desc: 'Bài đăng ghi 15 triệu nhưng khi phỏng vấn báo lương thử việc 3 triệu và phải nộp phí hồ sơ.',
      targetName: 'Nhân viên Giao hàng Nội thành',
      target: 'Nhân viên Giao hàng Nội thành',
      targetBy: 'Họ tên: SangLe - SĐT: 0912345678 - Email: sangle@bybitjobs.vn',
      reporterId: 'DvRit4c341XNsqAqLCp9wFAMydd2',
      reporterName: 'SangLe',
      reporterPhone: '0912345678',
      reporterEmail: 'sangle@bybitjobs.vn',
      companyName: 'Logistics Toàn Cầu',
      status: 'accepted',
      createdAt: new Date('2026-09-01T14:30:00Z').toISOString()
    }
  ];

  for (const rep of realReports) {
    await db.collection('reports').doc(rep.id).set(rep);
    console.log(`✅ Đã tạo báo cáo thực tế: ${rep.id} (${rep.reporterName} -> ${rep.targetName})`);
  }

  console.log('🎉 Hoàn tất chuẩn hóa collection reports trên Firestore!');
  process.exit(0);
}

syncRealReportsToFirestore().catch((err) => {
  console.error('❌ Lỗi làm sạch reports:', err);
  process.exit(1);
});

