const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function forceCleanAllUsersInFirestore() {
  console.log('🧹 Đang quét 100% tất cả Document trong collection users trên Firestore...');

  const usersSnap = await db.collection('users').get();
  console.log(`📌 Tìm thấy tổng cộng ${usersSnap.size} documents trong collection users.`);

  let cleanedCount = 0;

  for (const docSnap of usersSnap.docs) {
    const existing = docSnap.data();
    const docId = docSnap.id;

    const resolvedName = existing.fullName || existing.ho_ten || (existing.email ? existing.email.split('@')[0] : 'Người dùng App');
    const resolvedEmail = existing.email || null;
    const resolvedPhone = existing.phone || existing.so_dien_thoai || existing.phoneNumber || null;
    const resolvedAvatar = existing.avatar || existing.anh_dai_dien || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=2563EB&color=fff`;

    // CHỈ GIỮ DUY NHẤT BỘ 18 TRƯỜNG CHUẨN TIẾNG ANH (XOÁ SẠCH BẤT KỲ TRƯỜNG TIẾNG VIỆT NÀO)
    const cleanDoc = {
      id: docId,
      email: resolvedEmail,
      fullName: resolvedName,
      phone: resolvedPhone,
      avatar: resolvedAvatar,
      role: existing.role || existing.vai_tro || 'candidate',
      desiredJob: existing.desiredJob || existing.job || null,
      bio: existing.bio || existing.gioi_thieu || null,
      skills: Array.isArray(existing.skills) && existing.skills.length > 0 ? existing.skills : (Array.isArray(existing.ky_nang) ? existing.ky_nang : []),
      cvName: existing.cvName || null,
      cvSize: existing.cvSize || null,
      cvUploadTime: existing.cvUploadTime || null,
      cvUrl: existing.cvUrl || null,
      status: existing.status === 'disabled' || existing.status === 'Bị khóa' ? 'disabled' : 'active',
      createdAt: typeof existing.createdAt === 'string' && existing.createdAt !== '[object Object]' ? existing.createdAt : (existing.ngay_tao && typeof existing.ngay_tao === 'string' ? existing.ngay_tao : new Date().toISOString()),
      expoPushToken: existing.expoPushToken || null,
      readNotificationIds: Array.isArray(existing.readNotificationIds) ? existing.readNotificationIds : [],
      deletedNotificationIds: Array.isArray(existing.deletedNotificationIds) ? existing.deletedNotificationIds : []
    };

    // Dùng set mà KHÔNG dùng merge để xóa bỏ hoàn toàn tất cả các key rác/tiếng Việt cũ
    await db.collection('users').doc(docId).set(cleanDoc);
    cleanedCount++;
    console.log(`✅ [${cleanedCount}/${usersSnap.size}] Đã ép chuẩn hóa 100%: ${docId} (${resolvedName})`);
  }

  console.log(`🎉 Đã xử lý xong toàn bộ ${cleanedCount}/${usersSnap.size} documents trong Firestore!`);
  process.exit(0);
}

forceCleanAllUsersInFirestore().catch((err) => {
  console.error('❌ Lỗi làm sạch users:', err);
  process.exit(1);
});

