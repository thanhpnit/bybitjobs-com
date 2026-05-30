import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Khởi tạo biến môi trường
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Khởi tạo Firebase Admin SDK
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('⚠️ Lỗi khởi tạo Firebase Admin SDK:', error);
  }
} else {
  console.warn('⚠️ CẢNH BÁO: Không tìm thấy file serviceAccountKey.json ở thư mục gốc của API.');
  console.warn('⚠️ API danh sách người dùng sẽ không hoạt động cho đến khi bạn cung cấp file này.');
}

// API kiểm tra trạng thái Server
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'BybitJobs API is running!' });
});

// API lấy danh sách người dùng từ Firebase Auth
app.get('/api/users', async (req: Request, res: Response): Promise<any> => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin chưa được khởi tạo. Thiếu serviceAccountKey.json' });
  }

  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    
    // Sắp xếp người dùng từ cũ nhất đến mới nhất theo thời gian tạo để sinh ID tuần tự ổn định
    const sortedUsers = listUsersResult.users.sort((a, b) => {
      return new Date(a.metadata.creationTime).getTime() - new Date(b.metadata.creationTime).getTime();
    });

    // Chuyển đổi dữ liệu Firebase sang định dạng mà Web Admin đang dùng
    const users = sortedUsers.map((userRecord, index) => ({
      id: String(index).padStart(6, '0'), // Mã USER ID 6 số tuần tự (ví dụ: "000000", "000001")
      uid: userRecord.uid, // Giữ nguyên UID Firebase để thực hiện thao tác xóa/khóa
      name: userRecord.displayName || 'Người dùng App',
      email: userRecord.email || '',
      phone: userRecord.phoneNumber || 'Chưa có',
      job: 'Ứng viên (Mobile App)',
      status: userRecord.disabled 
        ? 'Bị khóa' 
        : (userRecord.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'),
      date: new Date(userRecord.metadata.creationTime).toLocaleDateString('vi-VN')
    }));

    return res.status(200).json(users);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    return res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu Firebase', details: error.message });
  }
});

// API xóa người dùng khỏi Firebase Auth
app.delete('/api/users/:uid', async (req: Request, res: Response): Promise<any> => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin chưa được khởi tạo. Thiếu serviceAccountKey.json' });
  }

  const { uid } = req.params;
  if (!uid) {
    return res.status(400).json({ error: 'Thiếu UID người dùng.' });
  }

  try {
    await admin.auth().deleteUser(uid as string);
    console.log(`🔥 Đã xóa vĩnh viễn người dùng có UID: ${uid}`);
    return res.status(200).json({ success: true, message: `Đã xóa vĩnh viễn người dùng có UID: ${uid}` });
  } catch (error: any) {
    console.error('Lỗi khi xóa người dùng:', error);
    return res.status(500).json({ error: 'Lỗi server khi xóa người dùng khỏi Firebase', details: error.message });
  }
});

// API cập nhật trạng thái Khóa / Mở khóa người dùng
app.put('/api/users/:uid/status', async (req: Request, res: Response): Promise<any> => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin chưa được khởi tạo. Thiếu serviceAccountKey.json' });
  }

  const { uid } = req.params;
  const { disabled } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'Thiếu UID người dùng.' });
  }
  if (typeof disabled !== 'boolean') {
    return res.status(400).json({ error: 'Trạng thái disabled phải là boolean.' });
  }

  try {
    // Cập nhật trạng thái disabled trong Firebase Auth
    await admin.auth().updateUser(uid as string, { disabled });
    console.log(`🔥 Đã cập nhật trạng thái khóa cho người dùng ${uid} thành: ${disabled}`);
    return res.status(200).json({ success: true, message: `Cập nhật trạng thái người dùng thành công.` });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
    return res.status(500).json({ error: 'Lỗi server khi cập nhật trạng thái người dùng', details: error.message });
  }
});

// API xác minh tài khoản người dùng
app.post('/api/users/:uid/verify', async (req: Request, res: Response): Promise<any> => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin chưa được khởi tạo. Thiếu serviceAccountKey.json' });
  }

  const { uid } = req.params;
  if (!uid) {
    return res.status(400).json({ error: 'Thiếu UID người dùng.' });
  }

  try {
    // Cập nhật trạng thái emailVerified thành true trong Firebase Auth
    await admin.auth().updateUser(uid as string, { emailVerified: true });
    console.log(`🔥 Đã xác minh thành công tài khoản người dùng có UID: ${uid}`);
    return res.status(200).json({ success: true, message: `Xác minh tài khoản thành công.` });
  } catch (error: any) {
    console.error('Lỗi khi xác minh tài khoản người dùng:', error);
    return res.status(500).json({ error: 'Lỗi server khi xác minh tài khoản', details: error.message });
  }
});

// API lấy mã USER ID tuần tự (6 số) của một người dùng dựa vào UID
app.get('/api/users/:uid/seq', async (req: Request, res: Response): Promise<any> => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin chưa được khởi tạo.' });
  }

  const { uid } = req.params;
  if (!uid) {
    return res.status(400).json({ error: 'Thiếu UID người dùng.' });
  }

  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    
    // Sắp xếp người dùng từ cũ nhất đến mới nhất theo creationTime
    const sortedUsers = listUsersResult.users.sort((a, b) => {
      return new Date(a.metadata.creationTime).getTime() - new Date(b.metadata.creationTime).getTime();
    });

    // Tìm vị trí của người dùng hiện tại trong hàng đợi tạo
    const index = sortedUsers.findIndex(u => u.uid === uid);
    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng trên Firebase.' });
    }

    const seqId = String(index).padStart(6, '0');
    return res.status(200).json({ seqId });
  } catch (error: any) {
    console.error('Lỗi khi lấy mã USER ID tuần tự:', error);
    return res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
