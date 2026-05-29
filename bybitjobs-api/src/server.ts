import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';

// Khởi tạo biến môi trường
dotenv.config();

// Khởi tạo Firebase Admin SDK
// Lưu ý: Cần thêm Firebase Service Account Key vào file .env hoặc mount volume trong Docker
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
  console.log('🔥 Firebase Admin SDK initialized successfully');
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK initialization warning:', error);
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API kiểm tra trạng thái Server
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'BybitJobs API is running!' });
});

// Import các routes (Sẽ tạo sau)
// import authRoutes from './routes/auth.routes';
// app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
