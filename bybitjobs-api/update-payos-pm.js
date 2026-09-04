const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updatePaymentMethodsToPayOS() {
  console.log('🔄 Đang cập nhật phương thức thanh toán sang PayOS theo ảnh chụp màn hình...');

  const payosMethod = {
    id: 'pm-1',
    name: 'Chuyển khoản Ngân hàng (PayOS QR)',
    type: 'Chuyển khoản Ngân hàng',
    accountName: 'PHAM NGOC THANH',
    accountNumber: 'V3CAS8896151989',
    branch: '970418 (MBBank)',
    status: 'Đang dùng'
  };

  // Cập nhật pm-1
  await db.collection('paymentMethods').doc('pm-1').set(payosMethod);

  // Xóa pm-2 nếu có
  try {
    await db.collection('paymentMethods').doc('pm-2').delete();
  } catch (e) {}

  console.log('✅ Đã cập nhật thành công pm-1 khớp với hình ảnh!');
  process.exit(0);
}

updatePaymentMethodsToPayOS().catch((err) => {
  console.error('❌ Lỗi cập nhật phương thức thanh toán:', err);
  process.exit(1);
});
