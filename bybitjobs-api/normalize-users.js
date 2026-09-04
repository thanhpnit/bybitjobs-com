const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

function parseCreationDate(existing, authUser) {
  const authTime = authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime).toISOString() : new Date().toISOString();
  let raw = existing.createdAt || existing.ngay_tao;
  if (!raw) return authTime;
  if (typeof raw === 'string' && raw !== '[object Object]') return raw;
  if (typeof raw?.toDate === 'function') return raw.toDate().toISOString();
  if (typeof raw?._seconds === 'number') return new Date(raw._seconds * 1000).toISOString();
  if (typeof raw?.seconds === 'number') return new Date(raw.seconds * 1000).toISOString();
  if (raw instanceof Date) return raw.toISOString();
  return authTime;
}

async function cleanAndStandardizeUsers() {
  console.log('🧹 Đang làm sạch và chuẩn hóa danh sách trường Tiếng Anh duy nhất cho Firestore users...');

  const listUsersResult = await admin.auth().listUsers(1000);
  const authUsers = listUsersResult.users;
  console.log(`📌 Tìm thấy tổng cộng ${authUsers.length} tài khoản trong Firebase Authentication.`);

  const usersSnap = await db.collection('users').get();
  const firestoreDocs = {};
  usersSnap.forEach(docSnap => {
    firestoreDocs[docSnap.id] = docSnap.data();
  });

  let count = 0;

  for (const authUser of authUsers) {
    const uid = authUser.uid;
    const existing = firestoreDocs[uid] || {};

    const resolvedName = existing.fullName || existing.ho_ten || authUser.displayName || (authUser.email ? authUser.email.split('@')[0] : 'Người dùng App');
    const resolvedEmail = authUser.email || existing.email || null;
    const resolvedAvatar = authUser.avatar || existing.avatar || existing.anh_dai_dien || authUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=2563EB&color=fff`;

    // CHỈ DÙNG BỘ KHUNG TÊN TRƯỜNG CHUẨN TIẾNG ANH DUY NHẤT (SẠCH SẼ, KHÔNG LẶP TRƯỜNG TIẾNG VIỆT)
    const cleanUserDocument = {
      id: uid,
      email: resolvedEmail,
      fullName: resolvedName,
      phone: existing.phone || existing.so_dien_thoai || authUser.phoneNumber || null,
      avatar: resolvedAvatar,
      role: existing.role || existing.vai_tro || 'candidate',
      desiredJob: existing.desiredJob || existing.job || null,
      bio: existing.bio || existing.gioi_thieu || null,
      skills: Array.isArray(existing.skills) && existing.skills.length > 0 ? existing.skills : (Array.isArray(existing.ky_nang) ? existing.ky_nang : []),
      cvName: existing.cvName || null,
      cvSize: existing.cvSize || null,
      cvUploadTime: existing.cvUploadTime || null,
      cvUrl: existing.cvUrl || null,
      status: authUser.disabled ? 'disabled' : (existing.status === 'Hoạt động' ? 'active' : (existing.status || 'active')),
      createdAt: parseCreationDate(existing, authUser),
      expoPushToken: existing.expoPushToken || null,
      readNotificationIds: existing.readNotificationIds || [],
      deletedNotificationIds: existing.deletedNotificationIds || []
    };

    // Ghi đè toàn bộ document (không dùng merge) để xóa sạch các trường dư thừa cũ
    await db.collection('users').doc(uid).set(cleanUserDocument);
    count++;
    console.log(`✅ [${count}/${authUsers.length}] Đã làm sạch User: ${uid} | ${resolvedName}`);
  }

  console.log(`🎉 Đã xóa sạch các trường dư thừa và làm chuẩn hóa duy nhất bộ trường Tiếng Anh cho ${count} users!`);
  process.exit(0);
}

cleanAndStandardizeUsers().catch((err) => {
  console.error('❌ Lỗi làm sạch users:', err);
  process.exit(1);
});
