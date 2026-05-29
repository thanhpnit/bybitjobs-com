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
    
    // Chuyển đổi dữ liệu Firebase sang định dạng mà Web Admin đang dùng
    const users = listUsersResult.users.map((userRecord) => ({
      id: userRecord.uid.substring(0, 8), // Lấy một phần UID cho ngắn gọn
      name: userRecord.displayName || 'Người dùng App',
      email: userRecord.email || '',
      phone: userRecord.phoneNumber || 'Chưa có',
      job: 'Ứng viên (Mobile App)',
      status: userRecord.disabled ? 'Bị khóa' : 'Đã xác thực',
      date: new Date(userRecord.metadata.creationTime).toLocaleDateString('vi-VN')
    }));

    return res.status(200).json(users);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    return res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu Firebase', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
