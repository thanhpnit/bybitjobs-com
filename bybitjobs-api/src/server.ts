import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { PayOS } from '@payos/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const payos = new PayOS({
  clientId: '535dac20-5fd1-4df2-9f3b-c126ea23a3f0',
  apiKey: '3c30066e-15ef-49f6-b92b-1d232214abf8',
  checksumKey: 'b50ddd7debe96cd2e63744fc802764a6693ea0722eee6742ade17f7b5da9e6f5'
});

// Khởi tạo biến môi trường
dotenv.config();

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

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

    // Lấy thêm thông tin từ Firestore (ví dụ: công việc mong muốn)
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').get();
    const firestoreUsers: Record<string, any> = {};
    usersSnapshot.forEach(doc => {
      firestoreUsers[doc.id] = doc.data();
    });

    // Chuyển đổi dữ liệu Firebase sang định dạng mà Web Admin đang dùng
    const users = sortedUsers.map((userRecord, index) => ({
      id: String(index).padStart(6, '0'), // Mã USER ID 6 số tuần tự (ví dụ: "000000", "000001")
      uid: userRecord.uid, // Giữ nguyên UID Firebase để thực hiện thao tác xóa/khóa
      name: userRecord.displayName || 'Người dùng App',
      email: userRecord.email || '',
      phone: userRecord.phoneNumber || firestoreUsers[userRecord.uid]?.phone || 'Chưa cập nhật',
      job: firestoreUsers[userRecord.uid]?.job || 'Ứng viên (Mobile App)',
      status: userRecord.disabled 
        ? (firestoreUsers[userRecord.uid]?.disabledByUser ? 'Tự vô hiệu hóa' : 'Bị khóa')
        : (userRecord.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'),
      date: new Date(userRecord.metadata.creationTime).toLocaleDateString('vi-VN')
    }));

    return res.status(200).json(users);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    return res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu Firebase', details: error.message });
  }
});

// API cập nhật công việc mong muốn
app.put('/api/users/:uid/job', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  const { job } = req.body;
  if (!uid || !job) {
    return res.status(400).json({ error: 'Thiếu thông tin uid hoặc job' });
  }

  try {
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({ job }, { merge: true });
    return res.status(200).json({ success: true, message: 'Cập nhật thành công' });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật công việc:', error);
    return res.status(500).json({ error: 'Lỗi server khi lưu dữ liệu', details: error.message });
  }
});

// API cập nhật số điện thoại người dùng
app.put('/api/users/:uid/phone', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  const { phone } = req.body;
  if (!uid || !phone) {
    return res.status(400).json({ error: 'Thiếu thông tin uid hoặc phone' });
  }

  try {
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({ phone }, { merge: true });
    return res.status(200).json({ success: true, message: 'Cập nhật số điện thoại thành công' });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật số điện thoại:', error);
    return res.status(500).json({ error: 'Lỗi server khi lưu dữ liệu', details: error.message });
  }
});

// API cập nhật CV người dùng
app.put('/api/users/:uid/cv', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  const { cvName, cvSize, cvUploadTime } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'Thiếu thông tin uid' });
  }

  try {
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({ cvName, cvSize, cvUploadTime }, { merge: true });
    return res.status(200).json({ success: true, message: 'Cập nhật CV thành công' });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật CV:', error);
    return res.status(500).json({ error: 'Lỗi server khi lưu dữ liệu', details: error.message });
  }
});

// API lấy thông tin chi tiết một người dùng (bao gồm job, phone và cv)
app.get('/api/users/:uid', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  try {
    const userRecord = await admin.auth().getUser(uid);
    const db = admin.firestore();
    const doc = await db.collection('users').doc(uid).get();
    const job = doc.exists ? doc.data()?.job : 'Ứng viên (Mobile App)';
    const phone = doc.exists ? doc.data()?.phone : undefined;
    const cvName = doc.exists ? doc.data()?.cvName : undefined;
    const cvSize = doc.exists ? doc.data()?.cvSize : undefined;
    const cvUploadTime = doc.exists ? doc.data()?.cvUploadTime : undefined;
    
    return res.status(200).json({
      uid: userRecord.uid,
      name: userRecord.displayName,
      email: userRecord.email,
      job: job,
      phone: phone,
      cvName: cvName,
      cvSize: cvSize,
      cvUploadTime: cvUploadTime
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// API xóa người dùng khỏi Firebase Auth
app.delete('/api/users/:uid', async (req: Request, res: Response): Promise<any> => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin chưa được khởi tạo. Thiếu serviceAccountKey.json' });
  }

  const uid = req.params.uid as string;
  if (!uid) {
    return res.status(400).json({ error: 'Thiếu UID người dùng.' });
  }

  try {
    const db = admin.firestore();
    
    // Xóa tài khoản khỏi Firebase Auth
    await admin.auth().deleteUser(uid as string);
    
    // Xóa thông tin doanh nghiệp trong Firestore
    await db.collection('employers').doc(uid).delete();
    
    // Xóa thông tin bổ sung user (ví dụ công việc mong muốn) trong Firestore
    await db.collection('users').doc(uid).delete();
    
    // Xóa các thông tin OTP liên quan
    await db.collection('otps').doc(uid).delete();
    await db.collection('passwordResetOtps').doc(uid).delete();

    console.log(`🔥 Đã xóa vĩnh viễn người dùng và các dữ liệu liên quan có UID: ${uid}`);
    return res.status(200).json({ success: true, message: `Đã xóa vĩnh viễn người dùng và các dữ liệu liên quan có UID: ${uid}` });
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
  const { disabled, disabledByUser } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'Thiếu UID người dùng.' });
  }
  if (typeof disabled !== 'boolean') {
    return res.status(400).json({ error: 'Trạng thái disabled phải là boolean.' });
  }

  try {
    // Cập nhật trạng thái disabled trong Firebase Auth
    await admin.auth().updateUser(uid as string, { disabled });

    // Đồng bộ trạng thái vô hiệu hóa lên Firestore
    const db = admin.firestore();
    if (disabled) {
      await db.collection('users').doc(uid as string).set({
        disabled: true,
        disabledByUser: !!disabledByUser
      }, { merge: true });
    } else {
      await db.collection('users').doc(uid as string).set({
        disabled: false,
        disabledByUser: false
      }, { merge: true });
    }

    console.log(`🔥 Đã cập nhật trạng thái khóa cho người dùng ${uid} thành: ${disabled} (bởi user: ${!!disabledByUser})`);
    return res.status(200).json({ success: true, message: `Cập nhật trạng thái người dùng thành công.` });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
    return res.status(500).json({ error: 'Lỗi server khi cập nhật trạng thái người dùng', details: error.message });
  }
});

// API gửi OTP xác minh
app.post('/api/users/:uid/send-otp', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  const { email } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'Thiếu thông tin uid hoặc email.' });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    const db = admin.firestore();
    await db.collection('otps').doc(uid).set({ otp, expiresAt });

    await transporter.sendMail({
      from: `"BybitJobs Admin" <${process.env.EMAIL_USER || 'no-reply@bybitjobs.com'}>`,
      to: email,
      subject: 'Mã xác minh tài khoản BybitJobs',
      html: `<h3>Xin chào!</h3><p>Mã xác minh tài khoản của bạn là: <strong style="font-size:24px;">${otp}</strong></p><p>Mã này sẽ hết hạn trong vòng 5 phút.</p>`
    });

    return res.status(200).json({ success: true, message: 'Đã gửi mã OTP qua email.' });
  } catch (error: any) {
    console.error('Lỗi khi gửi OTP:', error);
    return res.status(500).json({ error: 'Lỗi server khi gửi OTP', details: error.message });
  }
});

// API xác minh tài khoản người dùng bằng OTP
app.post('/api/users/:uid/verify', async (req: Request, res: Response): Promise<any> => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin chưa được khởi tạo. Thiếu serviceAccountKey.json' });
  }

  const uid = req.params.uid as string;
  const { otp } = req.body;

  if (!uid || !otp) {
    return res.status(400).json({ error: 'Thiếu UID người dùng hoặc mã OTP.' });
  }

  try {
    const db = admin.firestore();
    const otpDoc = await db.collection('otps').doc(uid).get();
    
    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'Mã OTP không tồn tại hoặc chưa được gửi.' });
    }

    const otpData = otpDoc.data();
    if (Date.now() > (otpData?.expiresAt || 0)) {
      return res.status(400).json({ error: 'Mã OTP đã hết hạn.' });
    }

    if (otpData?.otp !== otp) {
      return res.status(400).json({ error: 'Mã OTP không chính xác.' });
    }

    // Xóa mã OTP sau khi dùng
    await db.collection('otps').doc(uid).delete();

    // Cập nhật trạng thái emailVerified thành true trong Firebase Auth
    await admin.auth().updateUser(uid, { emailVerified: true });

    // Tạo thông báo xác minh thành công trong Firestore
    try {
      await db.collection('notifications').add({
        target: uid,
        title: 'Xác thực tài khoản thành công',
        body: 'Chúc mừng! Tài khoản của bạn đã được xác thực chính chủ và cấp tích xanh.',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (notifError) {
      console.error('Lỗi tạo thông báo xác thực:', notifError);
    }

    console.log(`🔥 Đã xác minh thành công tài khoản người dùng có UID: ${uid}`);
    return res.status(200).json({ success: true, message: `Xác minh tài khoản thành công.` });
  } catch (error: any) {
    console.error('Lỗi khi xác minh tài khoản người dùng:', error);
    return res.status(500).json({ error: 'Lỗi server khi xác minh tài khoản', details: error.message });
  }
});

// API gửi OTP quên mật khẩu qua email
app.post('/api/auth/forgot-password/send-otp', async (req: Request, res: Response): Promise<any> => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin chưa được khởi tạo. Thiếu serviceAccountKey.json' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Thiếu email.' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const db = admin.firestore();
    await db.collection('passwordResetOtps').doc(userRecord.uid).set({
      otp,
      email: normalizedEmail,
      uid: userRecord.uid,
      expiresAt
    });

    await transporter.sendMail({
      from: `"BybitJobs Admin" <${process.env.EMAIL_USER || 'no-reply@bybitjobs.com'}>`,
      to: normalizedEmail,
      subject: 'Mã OTP đặt lại mật khẩu BybitJobs',
      html: `<h3>Xin chào!</h3><p>Mã OTP đặt lại mật khẩu của bạn là: <strong style="font-size:24px;">${otp}</strong></p><p>Mã này sẽ hết hạn trong vòng 5 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>`
    });

    return res.status(200).json({ success: true, message: 'Đã gửi mã OTP đặt lại mật khẩu qua email.' });
  } catch (error: any) {
    console.error('Lỗi gửi OTP quên mật khẩu:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }
    return res.status(500).json({ error: 'Lỗi server khi gửi OTP quên mật khẩu', details: error.message });
  }
});

// API xác nhận OTP quên mật khẩu và đổi mật khẩu
app.post('/api/auth/forgot-password/reset', async (req: Request, res: Response): Promise<any> => {
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin chưa được khởi tạo. Thiếu serviceAccountKey.json' });
  }

  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Thiếu email, mã OTP hoặc mật khẩu mới.' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    const db = admin.firestore();
    const otpRef = db.collection('passwordResetOtps').doc(userRecord.uid);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ error: 'Mã OTP không tồn tại hoặc chưa được gửi.' });
    }

    const otpData = otpDoc.data();
    if (otpData?.email !== normalizedEmail) {
      return res.status(400).json({ error: 'Email không khớp với mã OTP.' });
    }
    if (Date.now() > (otpData?.expiresAt || 0)) {
      return res.status(400).json({ error: 'Mã OTP đã hết hạn.' });
    }
    if (otpData?.otp !== String(otp).trim()) {
      return res.status(400).json({ error: 'Mã OTP không chính xác.' });
    }

    await admin.auth().updateUser(userRecord.uid, { password: String(newPassword) });
    await otpRef.delete();

    return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' });
  } catch (error: any) {
    console.error('Lỗi đổi mật khẩu bằng OTP:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }
    return res.status(500).json({ error: 'Lỗi server khi đổi mật khẩu', details: error.message });
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

// --- NEW RECRUITER DATA TYPES & REST APIS ---

interface JobItem {
  id: string;
  title: string;
  industry: string;
  salary: string;
  location: string;
  description: string;
  requirements: string;
  deadline: string;
  isOpen: boolean;
  createdAt: string;
}

interface CandidateItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone: string;
  location: string;
  jobType: string;
  skills: string[];
  portfolio: string;
  education: string;
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
    isCurrent?: boolean;
  }[];
  rating: number;
  reviewsCount: number;
  yearsOfExp: number;
}

interface ApplicationItem {
  id: string;
  candidateId: string;
  jobId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
}

let jobs: JobItem[] = [
  {
    id: 'job-1',
    title: 'Thiết kế logo quán cafe',
    industry: 'Thiết kế đồ họa',
    salary: 'Thỏa thuận',
    location: 'Phú Nhuận, TP.HCM',
    description: 'Chào các bạn, mình đang cần tìm một bạn thiết kế logo cho quán cafe phong cách tối giản. Logo cần thể hiện được sự ấm cúng và hiện đại.',
    requirements: '- Có ít nhất 1 năm kinh nghiệm thiết kế thương hiệu.\n- Giao file gốc chất lượng cao.\n- Có khả năng chỉnh sửa 2-3 lần.',
    deadline: '11/30/2026',
    isOpen: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'job-2',
    title: 'Giao hàng nhanh nội thành',
    industry: 'Vận chuyển',
    salary: '300k/ngày',
    location: 'Quận 7, TP.HCM',
    description: 'Cần tuyển nhân viên giao hàng bằng xe máy khu vực Quận 7 và lân cận. Rành đường thành phố, trung thực, chịu khó.',
    requirements: '- Có bằng lái xe máy.\n- Có điện thoại thông minh.\n- Chăm chỉ, đúng giờ.',
    deadline: '05/20/2026',
    isOpen: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'job-3',
    title: 'Dọn dẹp căn hộ 2PN',
    industry: 'Dịch vụ gia đình',
    salary: '150k/giờ',
    location: 'Bình Thạnh, TP.HCM',
    description: 'Cần tìm người dọn dẹp, lau chùi căn hộ chung cư 2 phòng ngủ sạch sẽ, gọn gàng vào cuối tuần.',
    requirements: '- Có kinh nghiệm dọn dẹp căn hộ.\n- Trung thực, cẩn thận.\n- Có mặt đúng giờ.',
    deadline: '06/15/2026',
    isOpen: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'job-4',
    title: 'Lập trình viên React Native',
    industry: 'Công nghệ thông tin',
    salary: 'Cạnh tranh',
    location: 'Cầu Giấy, Hà Nội',
    description: 'Tuyển dụng kỹ sư lập trình di động React Native xây dựng các ứng dụng chất lượng cao cho khách hàng quốc tế.',
    requirements: '- 2+ năm kinh nghiệm React Native.\n- Hiểu biết về Firebase, Redux, RESTful APIs.\n- Tinh thần làm việc đội nhóm tốt.',
    deadline: '07/15/2026',
    isOpen: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

let candidates: CandidateItem[] = [
  {
    id: 'candidate-1',
    name: 'Nguyễn Văn An',
    role: 'Chuyên viên thiết kế UI/UX & Đồ họa',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    email: 'an.nguyen@example.com',
    phone: '0987 *** 456',
    location: 'Quận 7, TP. Hồ Chí Minh',
    jobType: 'Toàn thời gian / Freelance',
    skills: ['Figma', 'Adobe Suite', 'UI Design', 'Prototyping', 'HTML/CSS'],
    portfolio: 'behance.net/an-design',
    education: 'ĐH Mỹ Thuật TP.HCM',
    rating: 4.9,
    reviewsCount: 12,
    yearsOfExp: 4,
    experience: [
      {
        role: 'Senior UI Designer',
        company: 'TechVibe Solutions',
        duration: '2021 - Hiện tại',
        description: 'Dẫn dắt đội ngũ thiết kế xây dựng hệ thống Design System cho 3 sản phẩm Fintech cốt lõi. Tăng trải nghiệm người dùng thêm 25% dựa trên chỉ số CSAT.',
        isCurrent: true
      },
      {
        role: 'Graphic Designer',
        company: 'Media Plus Agency',
        duration: '2018 - 2021',
        description: 'Thực hiện hơn 100+ chiến dịch quảng cáo kỹ thuật số cho các thương hiệu lớn như Vinamilk, Grab.'
      }
    ]
  },
  {
    id: 'candidate-2',
    name: 'Nguyễn Thu Thủy',
    role: 'Chuyên viên Marketing',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    email: 'thuy.marketing@example.com',
    phone: '0912 *** 789',
    location: 'Quận 1, TP. HCM',
    jobType: 'Toàn thời gian',
    skills: ['SEO/SEM', 'Content Strategy', 'Data Analysis', 'Social Media'],
    portfolio: 'linkedin.com/in/thuy-mkt',
    education: 'ĐH Kinh tế Quốc dân',
    rating: 4.9,
    reviewsCount: 8,
    yearsOfExp: 5,
    experience: [
      {
        role: 'Marketing Lead',
        company: 'BrandGrowth',
        duration: '2022 - Hiện tại',
        description: 'Quản lý ngân sách marketing 500tr/tháng, tăng trưởng lượng khách hàng tiềm năng lên 40%.',
        isCurrent: true
      },
      {
        role: 'Content Specialist',
        company: 'AdMax Agency',
        duration: '2019 - 2022',
        description: 'Lên kế hoạch nội dung cho hơn 15 dự án lớn, tăng tỷ lệ tiếp cận organic thêm 50%.'
      }
    ]
  },
  {
    id: 'candidate-3',
    name: 'Trần Minh Quân',
    role: 'Lập trình viên React Native',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    email: 'quan.dev@example.com',
    phone: '0945 *** 123',
    location: 'Cầu Giấy, Hà Nội',
    jobType: 'Toàn thời gian / Từ xa',
    skills: ['React Native', 'Firebase', 'TypeScript', 'Redux', 'NodeJS'],
    portfolio: 'github.com/quandev',
    education: 'ĐH Bách Khoa Hà Nội',
    rating: 4.8,
    reviewsCount: 15,
    yearsOfExp: 3,
    experience: [
      {
        role: 'Mobile Developer',
        company: 'AppStudio',
        duration: '2021 - Hiện tại',
        description: 'Xây dựng 4 ứng dụng di động iOS/Android bằng React Native đạt hơn 100k lượt tải.',
        isCurrent: true
      },
      {
        role: 'Frontend Developer',
        company: 'SoftTech JSC',
        duration: '2020 - 2021',
        description: 'Phát triển giao diện các trang quản lý ERP phức tạp bằng ReactJS và Ant Design.'
      }
    ]
  },
  {
    id: 'candidate-4',
    name: 'Lê Kim Anh',
    role: 'Thiết kế UI/UX & Brand',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    email: 'kimanh.design@example.com',
    phone: '0938 *** 654',
    location: 'Quận 3, TP. Hồ Chí Minh',
    jobType: 'Toàn thời gian',
    skills: ['Figma', 'Product Design', 'Illustrator', 'Branding'],
    portfolio: 'dribbble.com/kimanh',
    education: 'ĐH Kiến trúc TP.HCM',
    rating: 5.0,
    reviewsCount: 7,
    yearsOfExp: 7,
    experience: [
      {
        role: 'Product Designer',
        company: 'Innovate Studio',
        duration: '2020 - Hiện tại',
        description: 'Định hình phong cách thương hiệu và thiết kế UI/UX cho chuỗi sản phẩm Smart Home.',
        isCurrent: true
      }
    ]
  }
];

let applications: ApplicationItem[] = [
  {
    id: 'app-1',
    candidateId: 'candidate-1',
    jobId: 'job-1',
    status: 'Pending',
    appliedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'app-2',
    candidateId: 'candidate-3',
    jobId: 'job-4',
    status: 'Pending',
    appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// GET list of jobs
app.get('/api/jobs', (req: Request, res: Response) => {
  res.status(200).json(jobs);
});

// GET specific job by ID
app.get('/api/jobs/:id', (req: Request, res: Response): any => {
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Không tìm thấy bài đăng.' });
  }
  res.status(200).json(job);
});

// POST create a job
app.post('/api/jobs', (req: Request, res: Response): any => {
  const { title, industry, salary, location, description, requirements, deadline, isOpen } = req.body;
  if (!title || !location || !description) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tiêu đề, địa điểm và mô tả công việc.' });
  }
  const newJob: JobItem = {
    id: `job-${Date.now()}`,
    title,
    industry: industry || 'Khác',
    salary: salary || 'Thỏa thuận',
    location,
    description,
    requirements: requirements || '',
    deadline: deadline || '',
    isOpen: isOpen !== undefined ? isOpen : true,
    createdAt: new Date().toISOString()
  };
  jobs.unshift(newJob);
  res.status(201).json(newJob);
});

// PUT update a job
app.put('/api/jobs/:id', (req: Request, res: Response): any => {
  const { id } = req.params;
  const index = jobs.findIndex(j => j.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bài đăng tuyển.' });
  }
  jobs[index] = {
    ...jobs[index],
    ...req.body
  };
  res.status(200).json(jobs[index]);
});

// DELETE a job
app.delete('/api/jobs/:id', (req: Request, res: Response): any => {
  const { id } = req.params;
  const index = jobs.findIndex(j => j.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bài đăng để xóa.' });
  }
  jobs.splice(index, 1);
  res.status(200).json({ success: true, message: 'Đã xóa bài đăng tuyển dụng.' });
});

// GET candidates (with search and filters)
app.get('/api/candidates', async (req: Request, res: Response): Promise<any> => {
  const { query, location, skills, yearsOfExp } = req.query;

  try {
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').get();
    
    // Fetch employers to exclude them from the candidate search list
    const employersSnapshot = await db.collection('employers').get();
    const employerUids = new Set(employersSnapshot.docs.map(doc => doc.id));

    // Fetch Firebase Auth users to obtain display names and emails
    let authUsers: Record<string, admin.auth.UserRecord> = {};
    if (admin.apps.length) {
      try {
        const listUsersResult = await admin.auth().listUsers(1000);
        listUsersResult.users.forEach(u => {
          authUsers[u.uid] = u;
        });
      } catch (err) {
        console.error("Lỗi khi lấy danh sách user từ Firebase Auth:", err);
      }
    }

    const realCandidates: CandidateItem[] = [];
    usersSnapshot.forEach(doc => {
      const uid = doc.id;
      // Exclude users registered as employers
      if (employerUids.has(uid)) {
        return;
      }

      const data = doc.data();
      const authUser = authUsers[uid];
      
      const name = authUser?.displayName || data.name || 'Ứng viên';
      const role = data.job || 'Ứng viên (Mobile App)';
      const email = authUser?.email || '';
      const phone = data.phone || 'Chưa cập nhật';
      
      realCandidates.push({
        id: uid,
        name: name,
        role: role,
        avatar: authUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0084FF&color=fff`,
        email: email,
        phone: phone,
        location: data.address || 'Hồ Chí Minh, Việt Nam',
        jobType: 'Toàn thời gian',
        skills: data.skills || [role],
        portfolio: data.portfolio || '',
        education: data.education || 'Chưa cập nhật',
        experience: data.experience || [],
        rating: data.rating || 5.0,
        reviewsCount: data.reviewsCount || 0,
        yearsOfExp: data.yearsOfExp || 0
      });
    });

    // Merge mock and real candidates
    let mergedCandidates = [...candidates];
    
    // Add real candidates if they are not already in the list
    realCandidates.forEach(rc => {
      if (!mergedCandidates.some(c => c.id === rc.id)) {
        mergedCandidates.push(rc);
      }
    });

    let result = mergedCandidates;

    if (query) {
      const q = String(query).toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.role.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q))
      );
    }

    if (location) {
      const loc = String(location).toLowerCase();
      result = result.filter(c => c.location.toLowerCase().includes(loc));
    }

    if (skills) {
      const skillList = String(skills).split(' ');
      result = result.filter(c => 
        c.skills.some(s => skillList.some(q => s.toLowerCase().includes(q.toLowerCase())))
      );
    }

    if (yearsOfExp) {
      const exp = parseInt(String(yearsOfExp), 10);
      if (!isNaN(exp)) {
        result = result.filter(c => c.yearsOfExp >= exp);
      }
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách ứng viên:', error);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// GET list of applications
app.get('/api/applications', (req: Request, res: Response) => {
  res.status(200).json(applications);
});

// PUT update application status & unlock candidate details if approved
app.put('/api/applications/:id/status', (req: Request, res: Response): any => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  }

  const appIndex = applications.findIndex(a => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy hồ sơ ứng tuyển.' });
  }

  applications[appIndex].status = status;

  // Unlock phone number if Approved
  if (status === 'Approved') {
    const candId = applications[appIndex].candidateId;
    const candIndex = candidates.findIndex(c => c.id === candId);
    if (candIndex !== -1) {
      // Unmask phone number
      let unmasked = candidates[candIndex].phone;
      if (candId === 'candidate-1') unmasked = '0987345678';
      else if (candId === 'candidate-2') unmasked = '0912345678';
      else if (candId === 'candidate-3') unmasked = '0945123456';
      candidates[candIndex].phone = unmasked;
    }
  }

  res.status(200).json({ success: true, application: applications[appIndex] });
});

// POST headhunt invitation
app.post('/api/invitations', async (req: Request, res: Response): Promise<any> => {
  const { candidateId, jobId } = req.body;
  if (!candidateId || !jobId) {
    return res.status(400).json({ error: 'Thiếu candidateId hoặc jobId.' });
  }

  try {
    const db = admin.firestore();

    // 1. Find Candidate (mock or real)
    let candidateName = 'Ứng viên';
    let candidateEmail = '';
    const mockCandidate = candidates.find(c => c.id === candidateId);
    if (mockCandidate) {
      candidateName = mockCandidate.name;
      candidateEmail = mockCandidate.email;
    } else {
      // Check Firestore users collection
      const userDoc = await db.collection('users').doc(candidateId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        candidateName = userData?.name || userData?.displayName || 'Ứng viên';
        candidateEmail = userData?.email || '';
      }
    }

    // 2. Find Job (mock or real in Firestore)
    let jobTitle = 'Công việc';
    let employerId = '';
    let companyName = 'Nhà tuyển dụng';
    
    // First check Firestore jobs
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (jobDoc.exists) {
      const jobData = jobDoc.data();
      jobTitle = jobData?.title || 'Công việc';
      employerId = jobData?.employerId || '';
      companyName = jobData?.companyName || jobData?.posterName || 'Nhà tuyển dụng';
    } else {
      // Fallback to mock jobs
      const mockJob = jobs.find(j => j.id === jobId);
      if (mockJob) {
        jobTitle = mockJob.title;
        companyName = 'Nhà tuyển dụng';
      } else {
        return res.status(404).json({ error: 'Không tìm thấy công việc hoặc bài đăng tuyển.' });
      }
    }

    const invitationId = `invite-${Date.now()}`;
    const newInvitation = {
      id: invitationId,
      candidateId,
      candidateName,
      jobId,
      jobTitle,
      employerId,
      companyName,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    await db.collection('invitations').doc(invitationId).set(newInvitation);

    // Send notification to Candidate
    await db.collection('notifications').add({
      target: candidateId,
      role: 'candidate',
      category: 'job',
      title: 'Lời mời ứng tuyển công việc',
      body: `Công ty "${companyName}" đã gửi cho bạn lời mời ứng tuyển công việc "${jobTitle}".`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`🔥 Đã gửi lời mời tuyển dụng từ ${companyName} đến ứng viên ${candidateName}`);
    return res.status(201).json({
      success: true,
      message: `Đã gửi lời mời ứng tuyển công việc "${jobTitle}" đến ứng viên "${candidateName}" thành công!`,
      invitation: newInvitation
    });
  } catch (error: any) {
    console.error('Lỗi khi gửi lời mời ứng tuyển:', error);
    return res.status(500).json({ error: 'Lỗi server khi gửi lời mời.', details: error.message });
  }
});

// ---------------- EMPLOYERS API ---------------- //

// GET danh sách nhà tuyển dụng
app.get('/api/employers', async (req: Request, res: Response): Promise<any> => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('employers').get();
    const employers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(employers);
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách nhà tuyển dụng', details: error.message });
  }
});

// GET 1 nhà tuyển dụng theo UID
app.get('/api/employers/:uid', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  try {
    const db = admin.firestore();
    const doc = await db.collection('employers').doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Không tìm thấy nhà tuyển dụng.' });
    }
    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// POST tạo/cập nhật nhà tuyển dụng
app.post('/api/employers/:uid', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  const data = req.body;
  try {
    const db = admin.firestore();
    const docRef = db.collection('employers').doc(uid);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      await docRef.update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      await docRef.set({
        ...data,
        status: 'Chờ duyệt',
        postsLimit: '0/10',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    const updatedDoc = await docRef.get();
    return res.status(200).json({ success: true, employer: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// DELETE xóa nhà tuyển dụng
app.delete('/api/employers/:uid', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  try {
    const db = admin.firestore();
    await db.collection('employers').doc(uid).delete();
    return res.status(200).json({ success: true, message: 'Đã xóa nhà tuyển dụng' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// PUT cập nhật trạng thái (Duyệt)
app.put('/api/employers/:uid/status', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  const { status } = req.body;
  try {
    const db = admin.firestore();
    await db.collection('employers').doc(uid).update({ status });
    return res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// GET danh sách các gói dịch vụ
app.get('/api/packages', async (req: Request, res: Response): Promise<any> => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('packages').get();
    const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(packages);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách packages:', error);
    return res.status(500).json({ error: 'Lỗi lấy danh sách packages' });
  }
});

// Lấy danh sách giao dịch (orders)
app.get('/api/orders', async (req: Request, res: Response): Promise<any> => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    
    // get unique employerIds
    const employerIds = [...new Set(snapshot.docs.map(doc => doc.data().employerId))];
    const employersMap: any = {};
    
    // fetch employer names in parallel to map with orders
    await Promise.all(employerIds.map(async (uid) => {
      if (!uid) return;
      const empDoc = await db.collection('employers').doc(uid).get();
      if (empDoc.exists) {
        employersMap[uid] = empDoc.data()?.company || 'Unknown';
      }
    }));
    
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        companyName: employersMap[data.employerId] || 'Không xác định'
      };
    });
    
    return res.status(200).json(orders);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách giao dịch:', error);
    return res.status(500).json({ error: 'Lỗi lấy danh sách giao dịch' });
  }
});

// ---------------- PAYOS PAYMENT API ---------------- //

app.post('/api/payment/create', async (req: Request, res: Response): Promise<any> => {
  const { amount, description, orderCode } = req.body;
  if (!amount || !orderCode) {
    return res.status(400).json({ error: 'Thiếu số tiền hoặc mã đơn hàng' });
  }

  const body = {
    orderCode: Number(orderCode),
    amount: Number(amount),
    description: description || 'Thanh toan don hang',
    items: [],
    cancelUrl: 'https://bybitjobs.com/cancel',
    returnUrl: 'https://bybitjobs.com/success',
  };

  try {
    const paymentLinkRes = await payos.paymentRequests.create(body);
    return res.status(200).json({
      success: true,
      data: {
        bin: paymentLinkRes.bin,
        accountNumber: paymentLinkRes.accountNumber,
        accountName: paymentLinkRes.accountName,
        amount: paymentLinkRes.amount,
        description: paymentLinkRes.description,
        orderCode: paymentLinkRes.orderCode,
        qrCode: paymentLinkRes.qrCode,
        checkoutUrl: paymentLinkRes.checkoutUrl
      }
    });
  } catch (error: any) {
    console.error('Lỗi tạo link thanh toán PayOS:', error);
    return res.status(500).json({ error: 'Lỗi tạo link thanh toán', details: error.message });
  }
});

// Webhook xử lý thanh toán tự động từ PayOS
app.post('/api/webhooks/payos', async (req: Request, res: Response): Promise<any> => {
  console.log("PayOS Webhook received:", JSON.stringify(req.body, null, 2));
  
  let webhookData;
  try {
    webhookData = await payos.webhooks.verify(req.body);
  } catch (err: any) {
    console.error("PayOS Verification failed:", err.message);
    // Trả về 200 OK để PayOS dashboard có thể lưu cấu hình webhook thành công
    return res.status(200).json({ success: true, message: "Webhook received but verification failed (Test request?)" });
  }

  try {
    if (webhookData && webhookData.orderCode) {
      const orderCode = String(webhookData.orderCode);
      
      const db = admin.firestore();
      const ordersRef = db.collection('orders');
      const q = ordersRef.where('orderCode', '==', orderCode);
      const snapshot = await q.get();
      
      if (!snapshot.empty) {
        // Cập nhật trạng thái đơn hàng thành success
        snapshot.forEach(async (doc) => {
          await doc.ref.update({
            status: 'success',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          const orderData = doc.data();
          const employerId = orderData.employerId;
          const packageId = orderData.packageId;
          
          if (employerId && packageId) {
            const employerRef = db.collection('employers').doc(employerId);
            const employerDoc = await employerRef.get();
            if (employerDoc.exists) {
              const empData = employerDoc.data();
              let usedPosts = empData?.usedPosts || 0;
              if (empData?.postsLimit && empData.postsLimit.includes('/')) {
                usedPosts = parseInt(empData.postsLimit.split('/')[0], 10) || 0;
              }
              
              const now = new Date();
              now.setDate(now.getDate() + 30);
              const expiresAt = now.toISOString();

              await employerRef.update({
                usedPosts: usedPosts,
                packageExpiresAt: expiresAt,
                isPremium: packageId === 'premium' ? true : (empData?.isPremium || false),
                currentPackage: orderData.packageName || packageId,
                current_package: orderData.packageName || packageId
              });
              console.log(`Đã cập nhật gói ${orderData.packageName || packageId} cho Employer ${employerId} (hết hạn ${expiresAt})`);

              // Tự động đẩy tất cả tin tuyển dụng của Employer này lên đầu tiên (cập nhật createdAt)
              try {
                const jobsSnapshot = await db.collection('jobs').where('employerId', '==', employerId).get();
                if (!jobsSnapshot.empty) {
                  const nowStr = new Date().toISOString();
                  const batch = db.batch();
                  jobsSnapshot.forEach(jobDoc => {
                    batch.update(jobDoc.ref, { createdAt: nowStr });
                  });
                  await batch.commit();
                  console.log(`🔥 Đã đẩy ${jobsSnapshot.size} tin tuyển dụng của Employer ${employerId} lên đầu trang.`);
                }
              } catch (jobErr) {
                console.error('Lỗi khi đẩy tin tuyển dụng lên đầu trang:', jobErr);
              }
            }
          }
          console.log(`🔥 Đã duyệt thành công đơn hàng PayOS: ${orderCode}`);
        });
      }
    }
    
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Lỗi xử lý webhook PayOS:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Thêm endpoint để setup webhook thủ công nếu cần
app.post('/api/setup-webhook', async (req: Request, res: Response): Promise<any> => {
  try {
    const webhookUrl = 'http://160.250.246.119:4000/api/webhooks/payos';
    await payos.webhooks.confirm(webhookUrl);
    return res.status(200).json({ success: true, message: `Webhook set to ${webhookUrl}` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// API AI Match
app.post('/api/jobs/:jobId/ai-match', async (req: Request, res: Response): Promise<any> => {
  const jobId = req.params.jobId as string;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
  }

  try {
    const db = admin.firestore();
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const jobData = jobDoc.data()!;
    const employerId = jobData.employerId;

    // Fetch candidates
    const usersSnap = await db.collection('users').get();
    const candidates: any[] = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      if (data.job && data.name) {
         candidates.push({ uid: doc.id, name: data.name, desiredJob: data.job, skills: data.skills || '' });
      }
    });

    if (candidates.length === 0) {
      return res.status(200).json({ message: 'No candidates found to match' });
    }

    // Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    Nhà tuyển dụng vừa đăng một công việc:
    Tiêu đề: ${jobData.title}
    Ngành nghề: ${jobData.industry}
    Yêu cầu: ${jobData.requirements || jobData.description}

    Đây là danh sách các ứng viên:
    ${JSON.stringify(candidates)}

    Hãy tìm tối đa 5 ứng viên có ngành nghề (desiredJob) hoặc kỹ năng phù hợp nhất với công việc này.
    Chỉ trả về ĐÚNG MỘT MẢNG JSON các chuỗi uid của các ứng viên đó, không kèm theo bất kỳ văn bản nào khác.
    Ví dụ: ["uid1", "uid2"]
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/\`\`\`/g, '').trim();
    }

    let matchedUids: string[] = [];
    try {
      matchedUids = JSON.parse(text);
    } catch (e) {
      console.error('Lỗi parse JSON từ Gemini:', text);
    }

    if (Array.isArray(matchedUids) && matchedUids.length > 0) {
      const matchedNames = candidates.filter(c => matchedUids.includes(c.uid)).map(c => c.name);
      
      if (matchedNames.length > 0) {
        await db.collection('notifications').add({
          title: 'Gợi ý ứng viên từ AI',
          body: `Tuyệt vời! AI vừa tìm thấy ${matchedNames.length} ứng viên phù hợp với tin "${jobData.title}" của bạn: ${matchedNames.join(', ')}. Hãy vào xem ngay!`,
          target: employerId,
          role: 'employer',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    return res.status(200).json({ success: true, matchedUids });

  } catch (error: any) {
    console.error('Error in AI Match:', error);
    return res.status(500).json({ error: error.message });
  }
});

// API Gợi ý tên công ty
app.get('/api/companies/suggest', async (req: Request, res: Response): Promise<any> => {
  const q = req.query.q as string;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
  }
  if (!q || q.trim().length === 0) {
    return res.status(200).json([]);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    Tìm tối đa 5 công ty/doanh nghiệp có thật tại Việt Nam khớp với từ khóa '${q}'.
    Chỉ trả về ĐÚNG MỘT MẢNG JSON với định dạng: [{"id": "1", "name": "Tên công ty", "description": "Địa chỉ trụ sở chính"}].
    Nếu không biết địa chỉ chính xác, hãy ghi tên Thành phố hoặc "Việt Nam".
    Tuyệt đối không kèm theo bất kỳ đoạn text nào khác ngoài mảng JSON.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/\`\`\`/g, '').trim();
    }

    let companies: any[] = [];
    try {
      companies = JSON.parse(text);
    } catch (e) {
      console.error('Lỗi parse JSON từ Gemini API suggest company:', text);
    }

    return res.status(200).json(companies);
  } catch (error: any) {
    console.error('Error in Company Suggest:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  try {
    const webhookUrl = 'http://160.250.246.119:4000/api/webhooks/payos';
    await payos.webhooks.confirm(webhookUrl);
    console.log(`✅ PayOS Webhook configured to: ${webhookUrl}`);
  } catch (error: any) {
    console.error('❌ Failed to configure PayOS Webhook:', error.message);
  }
});

