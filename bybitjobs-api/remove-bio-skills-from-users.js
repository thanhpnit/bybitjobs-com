const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function removeBioAndSkillsFromUsers() {
  console.log('🧹 Đang quét tất cả Document trong collection users trên Firestore để xóa bio và skills...');

  const usersSnap = await db.collection('users').get();
  console.log(`📌 Tìm thấy tổng cộng ${usersSnap.size} documents trong collection users.`);

  let updatedCount = 0;

  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    const docId = docSnap.id;

    // Delete bio, skills, gioi_thieu, ky_nang, skill fields completely using FieldValue.delete()
    const updatePayload = {
      bio: admin.firestore.FieldValue.delete(),
      skills: admin.firestore.FieldValue.delete(),
      gioi_thieu: admin.firestore.FieldValue.delete(),
      ky_nang: admin.firestore.FieldValue.delete(),
      skill: admin.firestore.FieldValue.delete()
    };

    await db.collection('users').doc(docId).update(updatePayload);
    updatedCount++;
    console.log(`✅ [${updatedCount}/${usersSnap.size}] Đã xóa bio & skills của user: ${docId} (${data.fullName || data.email})`);
  }

  console.log(`🎉 Hoàn tất xóa bio và skills trên ${updatedCount}/${usersSnap.size} users trong Firestore!`);
  process.exit(0);
}

removeBioAndSkillsFromUsers().catch((err) => {
  console.error('❌ Lỗi khi xóa bio và skills:', err);
  process.exit(1);
});

