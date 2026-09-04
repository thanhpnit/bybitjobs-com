const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncRealReviewsToFirestore() {
  console.log('🔄 Đang làm sạch reviews mẫu và đồng bộ ĐÁNH GIÁ THỰC TẾ từ applications sang collection reviews...');

  // 1. Xóa các review mẫu trước đó trong collection 'reviews'
  const oldReviewsSnap = await db.collection('reviews').get();
  for (const docSnap of oldReviewsSnap.docs) {
    await db.collection('reviews').doc(docSnap.id).delete();
    console.log(`🗑️ Đã xóa review mẫu: ${docSnap.id}`);
  }

  // 2. Lấy tất cả bản ghi ứng tuyển có chứa đánh giá thực tế từ collection 'applications'
  const appsSnap = await db.collection('applications').get();
  let count = 0;

  for (const docSnap of appsSnap.docs) {
    const data = docSnap.data();
    const rating = Number(data.companyRating || 0);
    const comment = (data.companyComment || '').trim();

    if (rating > 0 || comment.length > 0) {
      const reviewDocId = docSnap.id;
      const realReview = {
        id: reviewDocId,
        appId: docSnap.id,
        userName: data.applicantName || data.candidateName || 'Người dùng',
        userEmail: data.applicantEmail || data.candidateEmail || 'Chưa cập nhật',
        companyName: data.companyName || 'Doanh nghiệp',
        jobTitle: data.jobTitle || 'Công việc đã ứng tuyển',
        rating: rating > 0 ? rating : 5,
        comment: comment,
        status: data.reviewStatus || 'Đã phê duyệt',
        createdAt: data.reviewedAt || data.appliedAt || new Date().toISOString()
      };

      await db.collection('reviews').doc(reviewDocId).set(realReview);
      count++;
      console.log(`✅ Đã đồng bộ Đánh giá thật: ${reviewDocId} | ${realReview.userName} -> ${realReview.companyName}`);
    }
  }

  console.log(`🎉 Hoàn tất đồng bộ ${count} đánh giá THỰC TẾ sang collection reviews trên Firestore!`);
  process.exit(0);
}

syncRealReviewsToFirestore().catch((err) => {
  console.error('❌ Lỗi đồng bộ reviews:', err);
  process.exit(1);
});

