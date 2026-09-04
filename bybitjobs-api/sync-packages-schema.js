const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncPackagesSchema() {
  console.log('🔄 Đang đồng bộ hóa chuẩn ID gói dịch vụ (free, pro, premium) trên Firestore...');

  // 1. Xóa 'starter' cũ nếu có
  try {
    const starterDoc = await db.collection('packages').doc('starter').get();
    if (starterDoc.exists) {
      const data = starterDoc.data();
      await db.collection('packages').doc('free').set({ ...data, id: 'free' });
      await db.collection('packages').doc('starter').delete();
      console.log('✅ Đã chuyển gói starter -> free');
    }
  } catch (e) {}

  // 2. Đảm bảo 3 gói free, pro, premium tồn tại chuẩn trong Firestore
  const freePkg = {
    id: 'free',
    name: 'Gói MIỄN PHÍ',
    price: '0 VNĐ',
    priceNum: 0,
    period: '/ tháng',
    posts: '5 tin tuyển dụng',
    cvs: '10 CV ứng viên',
    users: '1,240',
    iconName: 'User',
    badge: 'CƠ BẢN STARTER',
    color: '#6B7280',
    maxPosts: 5,
    maxCVs: 10,
    status: 'Active'
  };

  const proDoc = await db.collection('packages').doc('pro').get();
  if (!proDoc.exists) {
    await db.collection('packages').doc('pro').set({
      id: 'pro',
      name: 'Gói PRO (Phổ Biến ⭐)',
      price: '499.000 VNĐ',
      priceNum: 499000,
      period: '/ 30 ngày',
      posts: '25 tin tuyển dụng',
      cvs: 'Không giới hạn CV',
      users: '856',
      iconName: 'Star',
      badge: 'BÁN CHẠY NHẤT ⭐',
      isPopular: true,
      color: '#0066FF',
      maxPosts: 25,
      maxCVs: 99999,
      status: 'Active'
    });
  }

  const premDoc = await db.collection('packages').doc('premium').get();
  if (!premDoc.exists) {
    await db.collection('packages').doc('premium').set({
      id: 'premium',
      name: 'Gói PREMIUM (VIP 👑)',
      price: '799.000 VNĐ',
      priceNum: 799000,
      period: '/ 30 ngày',
      posts: 'Không giới hạn',
      cvs: 'Không giới hạn CV',
      users: '142',
      iconName: 'Award',
      badge: 'ĐỘC QUYỀN TOP 1 👑',
      isVip: true,
      color: '#D97706',
      maxPosts: 9999,
      maxCVs: 99999,
      status: 'Active'
    });
  }

  const freeDoc = await db.collection('packages').doc('free').get();
  if (!freeDoc.exists) {
    await db.collection('packages').doc('free').set(freePkg);
  }

  console.log('🎉 Hoàn tất đồng bộ các gói dịch vụ trên Firestore!');
  process.exit(0);
}

syncPackagesSchema().catch((err) => {
  console.error('❌ Lỗi đồng bộ packages:', err);
  process.exit(1);
});

