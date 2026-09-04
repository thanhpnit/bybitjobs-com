// scripts/clear-test-data.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function clearCollection(colName) {
  const snapshot = await getDocs(collection(db, colName));
  console.log(`🧹 Đang dọn dẹp collection [${colName}] (${snapshot.size} bản ghi)...`);
  let count = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, colName, docSnap.id));
    count++;
  }
  console.log(`✅ Đã xóa ${count} bản ghi khỏi [${colName}].`);
}

async function run() {
  console.log('⚠️ Bắt đầu dọn dẹp dữ liệu thử nghiệm trên Firestore...');
  
  // Dọn các collection thử nghiệm phát sinh trong quá trình test
  await clearCollection('applications');
  await clearCollection('invitations');
  await clearCollection('notifications');
  await clearCollection('savedJobs');
  await clearCollection('viewedJobs');
  
  console.log('\n✨ Đã dọn dẹp các dữ liệu đơn ứng tuyển, thông báo và lịch sử test thành công!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Lỗi khi dọn dẹp dữ liệu:', err);
  process.exit(1);
});
