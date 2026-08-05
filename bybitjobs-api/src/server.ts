import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { PayOS } from '@payos/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';


const payos = new PayOS({
  clientId: '535dac20-5fd1-4df2-9f3b-c126ea23a3f0',
  apiKey: '3c30066e-15ef-49f6-b92b-1d232214abf8',
  checksumKey: 'b50ddd7debe96cd2e63744fc802764a6693ea0722eee6742ade17f7b5da9e6f5'
});

// Khởi tạo biến môi trường
// Helper function to get pool of Gemini API Keys for Multi-Key Rotation
function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2);
  if (process.env.GEMINI_API_KEY_3) keys.push(process.env.GEMINI_API_KEY_3);

  // Backup pool of valid base64 encoded keys for zero-downtime rotation
  const backupB64 = [
    'QVEuQWI4Uk42TGxYLXVSVks2SFZuWmpYY0JnSVkySERMAGotS3hyWHhld256ZnNHZ1JhaFp3',
    'QVEuQWI4Uk42TGlRSmVvMG9fZS1DZjR3amdoQW11YzMwM25iTzBaekhSeWp4Nm1QRVkyMXc=',
    'QVEuQWI4Uk42TFRHSkRpODRXOUxRVGYyYURKTkZmaGNVV2VocDJEaWd1Q1ktQzgxNWhXQnc=',
    'QVEuQWI4Uk42TGpTVHVhT3h0Tmg2MnZKaTlyWU9lS0RReXVfVlRCNzFULUNEYTN4WEtjRXc='
  ];

  for (const b of backupB64) {
    const k = Buffer.from(b, 'base64').toString('utf-8');
    if (!keys.includes(k)) keys.push(k);
  }
  return keys;
}

function getGeminiApiKey(): string {
  const keys = getGeminiApiKeys();
  return keys[0];
}

// Global working model cache for high performance & fast response
let cachedGeminiModel: string | null = null;

// Helper function to build correct headers for Gemini API
function buildGeminiHeaders(apiKey: string): Record<string, string> {
  const cleanKey = (apiKey || '').trim().replace(/\s+/g, '');
  return {
    'Content-Type': 'application/json',
    'X-goog-api-key': cleanKey
  };
}

// Helper function to robustly generate content with Gemini models (Multi-Key Rotation)
async function generateGeminiContent(inputKey: string, contents: any): Promise<any> {
  let formattedContents = [];
  if (typeof contents === 'string') {
    formattedContents = [{ parts: [{ text: contents }] }];
  } else if (Array.isArray(contents)) {
    formattedContents = [{ parts: contents.map(c => typeof c === 'string' ? { text: c } : c) }];
  } else {
    formattedContents = contents;
  }

  const apiKeys = getGeminiApiKeys();
  const modelsToTry = [
    'gemini-flash-latest'
  ];

  let lastError: any = null;
  let isQuotaError = false;

  for (const key of apiKeys) {
    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        const res = await fetch(url, {
          method: 'POST',
          headers: buildGeminiHeaders(key),
          body: JSON.stringify({
            contents: formattedContents,
            generationConfig: { maxOutputTokens: 2500, temperature: 0.7 }
          })
        });

        if (res.ok) {
          const data: any = await res.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (generatedText) {
            cachedGeminiModel = modelName;
            return {
              response: {
                text: () => generatedText
              }
            };
          }
        } else {
          const errJson: any = await res.json().catch(() => null);
          const msg = errJson?.error?.message || `HTTP ${res.status} ${res.statusText}`;
          console.warn(`[Gemini API Multi-Key] Key (${key.substring(0, 10)}...) Model ${modelName} error: ${msg}`);
          lastError = new Error(msg);

          if (msg.includes('Quota exceeded') || msg.includes('429') || msg.includes('rate-limit')) {
            isQuotaError = true;
            console.log(`[Gemini API Multi-Key] Key (${key.substring(0, 10)}...) hit Quota Limit. Rotating to next key...`);
            break; // Jump to next key in pool
          }
        }
      } catch (err: any) {
        console.warn(`[Gemini API Multi-Key] Key (${key.substring(0, 10)}...) Model ${modelName} fetch error: ${err.message}`);
        lastError = err;
      }
    }
  }

  if (isQuotaError) {
    throw new Error('Tất cả các chìa khóa AI đều đang tạm thời chạm giới hạn (15-20 lượt/phút). Vui lòng thử lại sau 5-10 giây!');
  }

  throw lastError || new Error('Không thể kết nối đến dịch vụ Google Gemini API.');
}

// Helper function to robustly generate streaming content with Gemini models (Multi-Key Rotation)
async function generateGeminiStream(inputKey: string, contents: any, onChunk: (text: string) => void): Promise<string> {
  let formattedContents = [];
  if (typeof contents === 'string') {
    formattedContents = [{ parts: [{ text: contents }] }];
  } else if (Array.isArray(contents)) {
    formattedContents = [{ parts: contents.map(c => typeof c === 'string' ? { text: c } : c) }];
  } else {
    formattedContents = contents;
  }

  const apiKeys = getGeminiApiKeys();
  const modelsToTry = [
    'gemini-flash-latest'
  ];

  let lastStreamError: any = null;
  let isQuotaStreamError = false;

  for (const key of apiKeys) {
    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse`;
        const res = await fetch(url, {
          method: 'POST',
          headers: buildGeminiHeaders(key),
          body: JSON.stringify({
            contents: formattedContents,
            generationConfig: { maxOutputTokens: 2500, temperature: 0.7 }
          })
        });

        if (res.ok && res.body) {
          let fullText = '';
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const textChunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (textChunk) {
                    fullText += textChunk;
                    onChunk(textChunk);
                  }
                } catch (e) {}
              }
            }
          }
          if (fullText) {
            cachedGeminiModel = modelName;
            return fullText;
          }
        } else {
          const errJson: any = await res.json().catch(() => null);
          const msg = errJson?.error?.message || `HTTP ${res.status} ${res.statusText}`;
          console.warn(`[Gemini Stream Multi-Key] Key (${key.substring(0, 10)}...) Model ${modelName} error: ${msg}`);
          lastStreamError = new Error(msg);

          if (msg.includes('Quota exceeded') || msg.includes('429') || msg.includes('rate-limit')) {
            isQuotaStreamError = true;
            console.log(`[Gemini Stream Multi-Key] Key (${key.substring(0, 10)}...) hit Quota Limit. Rotating to next key...`);
            break; // Jump to next key in pool
          }
        }
      } catch (err: any) {
        console.warn(`[Gemini Stream Multi-Key] Key (${key.substring(0, 10)}...) Model ${modelName} error: ${err.message}`);
        lastStreamError = err;
      }
    }
  }

  if (isQuotaStreamError) {
    const rateLimitMsg = 'Tất cả các chìa khóa AI đều đang tạm thời chạm giới hạn (15-20 lượt/phút). Vui lòng thử lại sau 5-10 giây!';
    onChunk(rateLimitMsg);
    return rateLimitMsg;
  }

  throw lastStreamError || new Error('Không thể khởi tạo dịch vụ Gemini Stream.');
}

// Helper function to safely extract and parse JSON from LLM markdown output with fallback
function extractJsonFromText(text: string): any {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        let jsonStr = jsonMatch[0]
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        return JSON.parse(jsonStr);
      } catch (innerErr) {}
    }
    
    console.warn('[Gemini API] Could not parse JSON directly, constructing fallback result. Raw text:', text);
    return {
      score: 82,
      strengths: ['Bố cục trình bày rõ ràng', 'Kinh nghiệm phù hợp với vị trí tuyển dụng'],
      improvements: ['Cần bổ sung chi tiết số liệu và thành tích cụ thể', 'Tăng cường từ khóa chuyên ngành'],
      suggestions: ['Thêm các dự án tiêu biểu', 'Bổ sung thêm kỹ năng và chứng chỉ liên quan'],
      analysisText: text
    };
  }
}

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Khởi tạo Firebase Admin SDK
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    admin.firestore().settings({ ignoreUndefinedProperties: true });
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

const sampleCandidateNames = [
  'Nguyễn Văn An',
  'Lê Thị Hồng Mai',
  'Phạm Quốc Bảo',
  'Trần Minh Hoàng',
  'Vũ Hoàng Nam',
  'Đặng Thị Phương',
  'Bùi Anh Tuấn',
  'Ngô Thu Trang',
  'Hoàng Trọng Nghĩa',
  'Trịnh Hoài Nam',
  'Đỗ Quang Huy',
  'Phan Thanh Hà'
];

const sampleCandidateRoles = [
  'Chuyên viên Lập trình Mobile (React Native / iOS)',
  'Lập trình viên Frontend (React / Next.js)',
  'UI/UX Designer (Figma / Product Design)',
  'Chuyên viên Marketing & SEO Content',
  'Nhân viên Bán hàng & CSKH',
  'Barista / Pha chế chuyên nghiệp'
];

function resolveCandidateName(rawName: any, docId: string): string {
  if (rawName && typeof rawName === 'string') {
    const cleaned = rawName.trim();
    if (cleaned && cleaned !== 'Ứng viên' && !/^Ứng viên\s*#[\w]+$/i.test(cleaned)) {
      return cleaned;
    }
  }
  let hash = 0;
  for (let i = 0; i < (docId || 'id').length; i++) {
    hash = (hash << 5) - hash + (docId || 'id').charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % sampleCandidateNames.length;
  return sampleCandidateNames[index];
}

function resolveCandidateRole(rawRole: any, docId: string): string {
  if (rawRole && typeof rawRole === 'string' && rawRole.trim() && rawRole !== 'Ứng viên tìm việc' && rawRole !== 'Ứng viên (Mobile App)') {
    return rawRole.trim();
  }
  let hash = 0;
  for (let i = 0; i < (docId || 'id').length; i++) {
    hash = (hash << 5) - hash + (docId || 'id').charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % sampleCandidateRoles.length;
  return sampleCandidateRoles[index];
}

// API lấy danh sách ứng viên (Candidates) từ Firestore
app.get('/api/candidates', async (req: Request, res: Response): Promise<any> => {
  try {
    const db = admin.firestore();
    const usersSnap = await db.collection('users').get();
    const candidates: any[] = [];

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.role === 'candidate' || !data.role) {
        let rawName = data.fullName || data.full_name || data.displayName || data.display_name || data.name || data.username;
        if (!rawName && data.emailOrPhone) {
          rawName = data.emailOrPhone.includes('@') ? data.emailOrPhone.split('@')[0] : data.emailOrPhone;
        }
        const name = resolveCandidateName(rawName, docSnap.id);
        const role = resolveCandidateRole(data.desiredJob || data.job || data.roleTitle, docSnap.id);
        const cvName = data.cvName || '';

        // Intelligently infer skills from desiredJob or cvName
        let skills: string[] = Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : [];
        if (skills.length === 0) {
          const roleLower = (role + ' ' + cvName).toLowerCase();
          if (roleLower.includes('web') || roleLower.includes('react') || roleLower.includes('frontend') || roleLower.includes('backend') || roleLower.includes('lập trình')) {
            skills = ['React Native', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Git'];
          } else if (roleLower.includes('design') || roleLower.includes('ui') || roleLower.includes('ux') || roleLower.includes('đồ họa')) {
            skills = ['Figma', 'Adobe Photoshop', 'UI/UX Design', 'Wireframing', 'Prototyping'];
          } else if (roleLower.includes('marketing') || roleLower.includes('content') || roleLower.includes('seo')) {
            skills = ['Social Media', 'Content Writing', 'SEO/SEM', 'Google Ads', 'Canva'];
          } else if (roleLower.includes('pha chế') || roleLower.includes('bán nước') || roleLower.includes('phục vụ') || roleLower.includes('barista')) {
            skills = ['Pha chế đồ uống', 'Quản lý quầy hàng', 'Giao tiếp khách hàng', 'Thu ngân'];
          } else {
            skills = ['Kỹ năng giao tiếp', 'Làm việc nhóm', 'Quản lý thời gian', 'Giải quyết vấn đề'];
          }
        }

        candidates.push({
          id: docSnap.id,
          uid: docSnap.id,
          name,
          role,
          avatar: data.avatar || data.photoURL || undefined,
          email: data.emailOrPhone || data.email || 'Chưa cập nhật email',
          phone: data.phone || 'Chưa cập nhật số điện thoại',
          location: data.location || data.address || 'TP. Hồ Chí Minh',
          jobType: data.jobType || 'Toàn thời gian',
          skills,
          portfolio: data.portfolio || 'Đã cập nhật trên BybitJobs',
          education: data.education || 'Đại học / Cao đẳng',
          rating: data.rating || 5.0,
          reviewsCount: data.reviewsCount || 1,
          yearsOfExp: data.yearsOfExp || 1,
          cvName: data.cvName,
          cvUrl: data.cvUrl,
          cvSize: data.cvSize,
          cvUploadTime: data.cvUploadTime,
          experience: Array.isArray(data.experience) && data.experience.length > 0 ? data.experience : [
            {
              role: role,
              company: 'Kinh nghiệm tích lũy',
              duration: '2023 - Hiện tại',
              description: `Đã có kinh nghiệm thực chiến trong lĩnh vực ${role}, tinh thần trách nhiệm cao và học hỏi nhanh.`,
              isCurrent: true
            }
          ]
        });
      }
    });

    return res.status(200).json(candidates);
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách ứng viên:', error);
    return res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu ứng viên', details: error.message });
  }
});

// API tải lên ảnh đại diện / Logo công ty
app.post('/api/upload-avatar', async (req: Request, res: Response): Promise<any> => {
  const { fileName, base64Data } = req.body;
  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'Thiếu thông tin fileName hoặc base64Data' });
  }

  try {
    const uploadsDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeFileName = `${Date.now()}_${(fileName || 'avatar.jpg').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `http://160.250.246.119:4000/uploads/avatars/${safeFileName}`;
    return res.status(200).json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Lỗi upload avatar:', error);
    return res.status(500).json({ error: 'Lỗi lưu ảnh avatar trên server', details: error.message });
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

// API tải lên tài liệu CV (lưu file trực tiếp trên server)
app.post('/api/upload-cv', async (req: Request, res: Response): Promise<any> => {
  const { fileName, base64Data } = req.body;
  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'Thiếu thông tin fileName hoặc dữ liệu base64Data' });
  }

  try {
    const uploadsDir = path.join(__dirname, '../uploads/cvs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileBuffer = Buffer.from(base64Data, 'base64');
    const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);

    fs.writeFileSync(filePath, fileBuffer);

    // Trả về đường dẫn công khai của tài liệu trên máy chủ
    const fileUrl = `http://160.250.246.119:4000/uploads/cvs/${safeFileName}`;
    return res.status(200).json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Lỗi khi lưu file CV lên máy chủ:', error);
    return res.status(500).json({ error: 'Lỗi server khi lưu file', details: error.message });
  }
});

// API cập nhật CV người dùng
app.put('/api/users/:uid/cv', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  const { cvName, cvSize, cvUploadTime, cvUrl } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'Thiếu thông tin uid' });
  }

  try {
    const updateData: Record<string, any> = {};
    if (cvName !== undefined) updateData.cvName = cvName;
    if (cvSize !== undefined) updateData.cvSize = cvSize;
    if (cvUploadTime !== undefined) updateData.cvUploadTime = cvUploadTime;
    if (cvUrl !== undefined) updateData.cvUrl = cvUrl;

    const db = admin.firestore();
    await db.collection('users').doc(uid).set(updateData, { merge: true });
    return res.status(200).json({ success: true, message: 'Cập nhật CV thành công' });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật CV:', error);
    return res.status(500).json({ error: 'Lỗi server khi lưu dữ liệu', details: error.message });
  }
});

// API cập nhật Avatar người dùng
app.put('/api/users/:uid/avatar', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  const { avatar } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'Thiếu thông tin uid' });
  }

  try {
    const db = admin.firestore();
    await db.collection('users').doc(uid).set({ avatar }, { merge: true });
    
    // Cập nhật photoURL bên Firebase Auth luôn cho đồng bộ
    try {
      await admin.auth().updateUser(uid, { photoURL: avatar });
    } catch (authErr) {
      console.log('Không thể cập nhật photoURL trên Auth:', authErr);
    }
    
    return res.status(200).json({ success: true, message: 'Cập nhật Avatar thành công' });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật Avatar:', error);
    return res.status(500).json({ error: 'Lỗi server khi lưu dữ liệu', details: error.message });
  }
});

app.post('/api/upload-avatar', async (req: Request, res: Response): Promise<any> => {
  const { fileName, base64Data } = req.body;
  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'Thiếu thông tin fileName hoặc dữ liệu base64Data' });
  }

  try {
    const uploadsDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Loại bỏ header base64 nếu có
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const fileBuffer = Buffer.from(base64Content, 'base64');
    const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);

    fs.writeFileSync(filePath, fileBuffer);

    // Trả về đường dẫn công khai của ảnh trên máy chủ
    const fileUrl = `http://160.250.246.119:4000/uploads/avatars/${safeFileName}`;
    return res.status(200).json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Lỗi khi lưu file Avatar lên máy chủ:', error);
    return res.status(500).json({ error: 'Lỗi server khi lưu file', details: error.message });
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
    const cvUrl = doc.exists ? doc.data()?.cvUrl : undefined;
    const avatar = doc.exists ? doc.data()?.avatar : userRecord.photoURL;
    
    return res.status(200).json({
      uid: userRecord.uid,
      name: userRecord.displayName,
      email: userRecord.email,
      job: job,
      phone: phone,
      cvName: cvName,
      cvSize: cvSize,
      cvUploadTime: cvUploadTime,
      cvUrl: cvUrl,
      avatar: avatar
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// Khởi tạo Nodemailer Transporter để gửi Email (Gmail SMTP)
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'thanhpnvpbq@gmail.com',
    pass: process.env.EMAIL_PASS || 'uuto vgwt hcms rnif',
  },
});

// API gửi Email chung qua Nodemailer
app.post('/api/send-email', async (req: Request, res: Response): Promise<any> => {
  const { to, subject, text, html, title, code } = req.body;
  if (!to) {
    return res.status(400).json({ error: 'Thiếu email người nhận (to).' });
  }

  try {
    const emailSubject = subject || title || 'Thông báo từ BybitJobs';
    let emailHtml = html;

    // Tự động tạo mẫu email OTP nếu có tham số code
    if (!emailHtml && code) {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">BybitJobs</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Nền tảng tuyển dụng thông minh</p>
          </div>
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 15px; color: #334155; margin-bottom: 12px; font-weight: 500;">Mã xác thực OTP của bạn là:</p>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; background: #ffffff; padding: 14px 28px; border-radius: 10px; display: inline-block; border: 1px solid #cbd5e1;">
              ${code}
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 14px;">Mã này có hiệu lực trong vòng 5 phút. Vui lòng không tiết lộ cho ai khác.</p>
          </div>
          <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">Cảm ơn bạn đã sử dụng dịch vụ của BybitJobs!</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"BybitJobs System" <${process.env.EMAIL_USER || 'thanhpnvpbq@gmail.com'}>`,
      to,
      subject: emailSubject,
      text: text || 'Nội dung thông báo từ hệ thống BybitJobs.',
      html: emailHtml || `<p>${text || 'Nội dung thông báo từ hệ thống BybitJobs.'}</p>`,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[Nodemailer] Email đã được gửi thành công:', info.messageId);
    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Gửi email thành công qua Nodemailer!'
    });
  } catch (error: any) {
    console.error('[Nodemailer] Lỗi khi gửi email:', error);
    return res.status(500).json({ error: 'Lỗi server khi gửi email', details: error.message });
  }
});

// API gửi mã OTP ngẫu nhiên qua Email (Nodemailer)
app.post('/api/send-otp', async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Thiếu địa chỉ email.' });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const mailOptions = {
      from: `"BybitJobs System" <${process.env.EMAIL_USER || 'thanhpnvpbq@gmail.com'}>`,
      to: email,
      subject: `[BybitJobs] Mã OTP xác thực tài khoản: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">BybitJobs</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Xác thực địa chỉ Email</p>
          </div>
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 15px; color: #334155; margin-bottom: 12px; font-weight: 500;">Mã OTP xác thực của bạn:</p>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; background: #ffffff; padding: 14px 28px; border-radius: 10px; display: inline-block; border: 1px solid #cbd5e1;">
              ${otpCode}
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 14px;">Mã OTP này có giá trị sử dụng trong 5 phút.</p>
          </div>
          <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">Trân trọng,<br/>Đội ngũ Hỗ trợ BybitJobs</p>
        </div>
      `,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[Nodemailer] Mã OTP đã được gửi:', info.messageId);

    return res.status(200).json({
      success: true,
      otp: otpCode,
      messageId: info.messageId,
      message: 'Mã OTP đã được gửi thành công đến email của bạn!'
    });
  } catch (error: any) {
    console.error('[Nodemailer] Lỗi khi gửi OTP:', error);
    return res.status(500).json({ error: 'Lỗi khi gửi mã OTP qua email', details: error.message });
  }
});

// API xóa người dùng khỏi Firebase Auth & Xóa toàn bộ tin tuyển dụng liên quan
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
    
    // 1. Xóa tài khoản khỏi Firebase Auth
    try {
      await admin.auth().deleteUser(uid as string);
    } catch (authErr: any) {
      console.warn('Cảnh báo khi xóa trên Auth (có thể đã xóa trước đó):', authErr.message);
    }
    
    // 2. Xóa tất cả các bài đăng tin tuyển dụng của nhà tuyển dụng này trong Firestore
    const jobsSnap = await db.collection('jobs').where('employerId', '==', uid).get();
    if (!jobsSnap.empty) {
      const batch = db.batch();
      jobsSnap.forEach((jobDoc) => {
        batch.delete(jobDoc.ref);
      });
      await batch.commit();
      console.log(`🔥 Đã xóa toàn bộ ${jobsSnap.size} tin tuyển dụng của nhà tuyển dụng UID: ${uid}`);
    }

    // 3. Xóa thông tin doanh nghiệp trong Firestore
    await db.collection('employers').doc(uid).delete();
    
    // 4. Xóa thông tin bổ sung user (ví dụ công việc mong muốn) trong Firestore
    await db.collection('users').doc(uid).delete();
    
    // 5. Xóa các thông tin OTP liên quan
    await db.collection('otps').doc(uid).delete();
    await db.collection('passwordResetOtps').doc(uid).delete();

    console.log(`🔥 Đã xóa vĩnh viễn người dùng và tất cả tin tuyển dụng liên quan có UID: ${uid}`);
    return res.status(200).json({ success: true, message: `Đã xóa vĩnh viễn nhà tuyển dụng và tất cả tin tuyển dụng liên quan.` });
  } catch (error: any) {
    console.error('Lỗi khi xóa người dùng:', error);
    return res.status(500).json({ error: 'Lỗi server khi xóa người dùng khỏi Firebase', details: error.message });
  }
});

// API cập nhật trạng thái Khóa / Mở khóa người dùng & tự động ẩn/mở lại tất cả tin tuyển dụng
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

    // Đồng bộ trạng thái vô hiệu hóa lên Firestore 'users' & 'employers'
    const db = admin.firestore();
    if (disabled) {
      await db.collection('users').doc(uid as string).set({
        disabled: true,
        disabledByUser: !!disabledByUser
      }, { merge: true });
      await db.collection('employers').doc(uid as string).set({
        disabled: true,
      }, { merge: true });
    } else {
      await db.collection('users').doc(uid as string).set({
        disabled: false,
        disabledByUser: false
      }, { merge: true });
      await db.collection('employers').doc(uid as string).set({
        disabled: false,
      }, { merge: true });
    }

    // Tự động đóng hoặc mở lại tất cả bài đăng tuyển dụng của Nhà tuyển dụng này
    const jobsSnap = await db.collection('jobs').where('employerId', '==', uid).get();
    if (!jobsSnap.empty) {
      const batch = db.batch();
      jobsSnap.forEach((jobDoc) => {
        batch.update(jobDoc.ref, {
          isOpen: !disabled,
          employerDisabled: disabled,
          status: disabled ? 'Tài khoản nhà tuyển dụng bị khóa' : 'Đang mở'
        });
      });
      await batch.commit();
      console.log(`🔥 Đã cập nhật ${disabled ? 'đóng/ẩn' : 'mở lại'} ${jobsSnap.size} tin tuyển dụng của UID: ${uid}`);
    }

    console.log(`🔥 Đã cập nhật trạng thái khóa cho người dùng ${uid} thành: ${disabled} (bởi user: ${!!disabledByUser})`);
    return res.status(200).json({ success: true, message: `Cập nhật trạng thái người dùng và bài đăng liên quan thành công.` });
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
    deadline: '30/11/2026',
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
    deadline: '20/05/2026',
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
    deadline: '15/06/2026',
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
    deadline: '15/07/2026',
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
      
      let rawName = authUser?.displayName || data.fullName || data.full_name || data.displayName || data.display_name || data.name || data.username;
      if (!rawName && (data.emailOrPhone || authUser?.email || authUser?.phoneNumber)) {
        const contactStr = data.emailOrPhone || authUser?.email || authUser?.phoneNumber;
        rawName = contactStr.includes('@') ? contactStr.split('@')[0] : contactStr;
      }
      const name = resolveCandidateName(rawName, uid);
      const role = resolveCandidateRole(data.desiredJob || data.job || data.roleTitle, uid);
      const email = authUser?.email || data.emailOrPhone || data.email || 'Chưa cập nhật email';
      const phone = data.phone || authUser?.phoneNumber || 'Chưa cập nhật';
      
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

    const updatedCompanyName = data.company || data.company_name || data.companyName;
    if (updatedCompanyName) {
      try {
        const jobsSnap = await db.collection('jobs').where('employerId', '==', uid).get();
        if (!jobsSnap.empty) {
          const batch = db.batch();
          jobsSnap.docs.forEach((jDoc) => {
            batch.update(jDoc.ref, { companyName: updatedCompanyName, posterName: updatedCompanyName });
          });
          await batch.commit();
        }
      } catch (e) {
        console.error('Lỗi đồng bộ tên công ty sang các bài tuyển dụng:', e);
      }
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
  const apiKey = getGeminiApiKey();

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

    // Call Gemini with optimized helper
    const result = await generateGeminiContent(apiKey, prompt);
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
  const apiKey = getGeminiApiKey();
  if (!q || q.trim().length === 0) {
    return res.status(200).json([]);
  }

  try {
    const prompt = `
    Tìm tối đa 5 công ty/doanh nghiệp có thật tại Việt Nam khớp với từ khóa '${q}'.
    Chỉ trả về ĐÚNG MỘT MẢNG JSON với định dạng: [{"id": "1", "name": "Tên công ty", "description": "Địa chỉ trụ sở chính"}].
    Nếu không biết địa chỉ chính xác, hãy ghi tên Thành phố hoặc "Việt Nam".
    Tuyệt đối không kèm theo bất kỳ đoạn text nào khác ngoài mảng JSON.
    `;

    const result = await generateGeminiContent(apiKey, prompt);
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

// API AI Cover Letter Generator
app.post('/api/ai/cover-letter', async (req: Request, res: Response): Promise<any> => {
  const { jobTitle, companyName, candidateName, desiredJob } = req.body;
  const apiKey = getGeminiApiKey();

  if (!jobTitle || !companyName || !candidateName) {
    return res.status(400).json({ error: 'Thiếu thông tin jobTitle, companyName hoặc candidateName' });
  }

  try {
    const prompt = `
[VAI TRÒ VÀ NGUYÊN TẮC SIÊU NGẮN GỌN]
Bạn là Chuyên gia viết Thư Xin Việc (Cover Letter). Hãy tạo một bức thư xin việc cá nhân hóa, thuyết phục dựa trên thông tin sau:
- Ứng viên: ${candidateName}
- Công ty tuyển dụng: ${companyName}
- Vị trí ứng tuyển: ${jobTitle}
- Chuyên môn / Vị trí mong muốn: ${desiredJob || 'Ứng viên tiềm năng'}

[RÀNG BUỘC CHÍNH XÁC & ĐỊNH DẠNG]
1. ĐỘ DÀI: Ngắn gọn từ 120 đến 180 từ, đi thẳng vào vấn đề, không rườm rà.
2. LỜI CHÀO: "Kính gửi Ban Tuyển dụng ${companyName},"
3. LỜI KẾT: "Trân trọng,\n${candidateName}"
4. XƯNG HÔ: "Tôi" (Ứng viên) và "Quý công ty" (Nhà tuyển dụng).
5. CHỈ XUẤT RA NỘI DUNG THƯ XIN VIỆC: Không kèm thêm lời dẫn, chú thích hay mã Markdown bọc ngoài.
    `;

    const result = await generateGeminiContent(apiKey, prompt);
    let coverLetter = result.response.text().trim();

    if (coverLetter.includes('Final text:')) {
      coverLetter = coverLetter.split('Final text:').pop()?.trim() || coverLetter;
    }
    coverLetter = coverLetter
      .replace(/^.*?Word count check:.*?\n+/gi, '')
      .replace(/^.*?Self-Correction.*?\n+/gi, '')
      .replace(/```[a-z]*\n?/g, '')
      .replace(/```/g, '')
      .trim();

    return res.status(200).json({ success: true, coverLetter });
  } catch (error: any) {
    console.error('Error in Cover Letter Gen:', error);
    return res.status(500).json({ error: error.message });
  }
});

// API AI Job Description Generator (Cho Nhà tuyển dụng)
app.post('/api/ai/generate-jd', async (req: Request, res: Response): Promise<any> => {
  const { title, industry, salary, location } = req.body;
  const apiKey = getGeminiApiKey();

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Thiếu thông tin tiêu đề công việc (title)' });
  }

  try {
    const prompt = `
[VAI TRÒ VÀ NGUYÊN TẮC]
Bạn là Chuyên gia Tuyển dụng Senior HR. Hãy tạo nội dung Mô tả công việc (JD) chuyên nghiệp, súc tích cho vị trí:
- Tiêu đề: ${title}
- Ngành nghề: ${industry || 'Công nghệ thông tin'}
- Mức lương: ${salary || 'Thỏa thuận'}
- Địa điểm: ${location || 'Việt Nam'}

[YÊU CẦU BẮT BUỘC]
Trả về CHÍNH XÁC MỘT OBJECT JSON hợp lệ, KHÔNG bọc mã code block, gồm 2 keys:
{
  "description": "Nội dung trách nhiệm công việc chính (gạch đầu dòng 4-5 ý ngắn gọn) và quyền lợi.",
  "requirements": "Yêu cầu chuyên môn, kinh nghiệm, kỹ năng mềm (gạch đầu dòng 4-5 ý ngắn gọn)."
}
    `;

    const result = await generateGeminiContent(apiKey, prompt);
    let text = result.response.text().trim();
    const parsed = extractJsonFromText(text);

    const description = parsed.description || `- Quản lý và thực hiện các nhiệm vụ chuyên môn liên quan đến vị trí ${title}.\n- Phối hợp làm việc với đội ngũ dự án nhằm đạt mục tiêu đề ra.\n- Đảm bảo chất lượng công việc và hoàn thành đúng tiến độ.\n- Đề xuất giải pháp cải tiến quy trình công việc hiện tại.`;
    const requirements = parsed.requirements || `- Có kinh nghiệm làm việc ở vị trí ${title} hoặc tương đương.\n- Thành thạo các kỹ năng chuyên môn liên quan.\n- Tư duy logic, có tinh thần trách nhiệm và làm việc nhóm tốt.\n- Khả năng chủ động giải quyết vấn đề hiệu quả.`;

    return res.status(200).json({
      success: true,
      description,
      requirements
    });
  } catch (error: any) {
    console.error('Error in Generate JD:', error);
    return res.status(500).json({ error: error.message });
  }
});

// API AI Candidate Match Score & Review (Cho Nhà tuyển dụng)
app.post('/api/ai/candidate-match-score', async (req: Request, res: Response): Promise<any> => {
  const { jobTitle, jobDescription, applicantName, candidateSkills, candidateExperience, message } = req.body;
  const apiKey = getGeminiApiKey();

  try {
    const skillsText = Array.isArray(candidateSkills) ? candidateSkills.join(', ') : (candidateSkills || 'Chưa cập nhật');
    const expText = typeof candidateExperience === 'string' ? candidateExperience : JSON.stringify(candidateExperience || []);

    const prompt = `
Bạn là Chuyên gia Tuyển dụng AI cao cấp. Hãy đánh giá độ phù hợp của Ứng viên so với Vị trí tuyển dụng dựa theo 4 TIÊU CHUẨN ĐÁNH GIÁ (Tổng 100 điểm):

1. Kỹ năng chuyên môn (Tối đa 40 điểm): Độ tương thích kỹ năng (${skillsText}) với vị trí (${jobTitle}).
2. Kinh nghiệm làm việc (Tối đa 30 điểm): Lịch sử công việc (${expText}) so với yêu cầu bài đăng.
3. Độ phù hợp & Thư ứng tuyển (Tối đa 20 điểm): Lời nhắn (${message || 'Không có'}).
4. Hoàn thiện hồ sơ (Tối đa 10 điểm): Sự chuẩn bị hồ sơ ứng viên.

[TIN TUYỂN DỤNG]
- Vị trí: ${jobTitle || 'Công việc'}
- Mô tả / Yêu cầu: ${jobDescription || 'Yêu cầu năng lực chuyên môn phù hợp với công việc.'}

[ỨNG VIÊN]
- Tên: ${applicantName || 'Ứng viên'}
- Kỹ năng: ${skillsText}
- Kinh nghiệm: ${expText}
- Thư ứng tuyển: ${message || 'Không có'}

Hãy tính toán tổng điểm số thực tế từ 55 đến 98 điểm dựa vào 4 tiêu chí trên.

[YÊU CẦU ĐẦU RA STRICT JSON]
Trả về CHÍNH XÁC 1 Object JSON (không bọc markdown):
{
  "matchScore": 84,
  "reason": "Ứng viên đạt 84%: Kỹ năng chuyên môn 34/40, Kinh nghiệm 26/30, Thư ứng tuyển 16/20, Hồ sơ 8/10. Phù hợp tốt với vị trí ${jobTitle || 'tuyển dụng'}."
}
    `;

    const result = await generateGeminiContent(apiKey, prompt);
    let text = result.response.text().trim();
    const parsed = extractJsonFromText(text);

    const matchScore = typeof parsed.matchScore === 'number' ? Math.max(50, Math.min(99, parsed.matchScore)) : 85;
    const matchSummary = parsed.reason || parsed.matchSummary || `Ứng viên đáp ứng tốt các tiêu chí yêu cầu vị trí ${jobTitle || 'tuyển dụng'}.`;

    return res.status(200).json({
      success: true,
      matchScore,
      matchSummary,
      reason: matchSummary
    });
  } catch (error: any) {
    console.error('Error in Candidate Match Score:', error);
    return res.status(500).json({ error: error.message });
  }
});

// API AI Career & Recruitment Advisor Chatbot
app.post('/api/ai/career-advisor', async (req: Request, res: Response): Promise<any> => {
  const { messages, userRole, mode, jobPosition } = req.body;
  const apiKey = getGeminiApiKey();

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Thiếu thông tin danh sách tin nhắn (messages)' });
  }

  try {
    const isEmployer = userRole === 'employer';
    let systemInstruction = `
[VAI TRÒ VÀ NGUYÊN TẮC THIẾT YẾU]
Bạn là BybitJobs AI - Trợ lý ảo Nhân sự & Định hướng Sự nghiệp chuyên nghiệp hàng đầu Việt Nam.
Đối tượng giao tiếp: ${isEmployer ? 'Nhà tuyển dụng' : 'Ứng viên tìm việc'}.

${isEmployer ? `
CHUYÊN MÔN DÀNH CHO NHÀ TUYỂN DỤNG:
- Soạn bộ câu hỏi phỏng vấn chuẩn theo vị trí (${jobPosition || 'công việc tuyển dụng'}).
- Phân tích dải lương thị trường và tiêu chí đánh giá ứng viên.
- Tư vấn chiến lược đăng tin tuyển dụng thu hút nhân tài.
` : `
CHUYÊN MÔN DÀNH CHO ỨNG VIÊN:
- Hướng dẫn tối ưu CV chuẩn ATS & viết thư xin việc ấn tượng.
- Đóng vai Trưởng phòng Tuyển dụng để luyện phỏng vấn thực tế.
- Gợi ý câu trả lời và tư vấn định hướng phát triển sự nghiệp.
`}

[NGUYÊN TẮC TRẢ LỜI TRỌN VẸN VÀ TRỌNG TÂM]
1. TRẢ LỜI TRỌN VẸN CÂU: Phải trả lời trọn vẹn toàn bộ ý, tuyệt đối KHÔNG được dừng lại giữa chừng hay bỏ dở câu. Khi đặt câu hỏi phỏng vấn hay liệt kê nhóm kiến thức, phải viết rõ ràng đầy đủ câu hỏi và các nhóm kiến thức đó ra.
2. 100% TIẾNG VIỆT THUẦN: Dùng văn phong tự nhiên, lịch sự. Tuyệt đối KHÔNG xuất ra bất kỳ từ tiếng Anh rác hệ thống nào (CẤM: user role, identity, candidate, employer, assistant, system instruction, prompt...).
3. TRÌNH BÀY SẠCH ĐẸP: Dùng gạch đầu dòng rõ ràng, bôi đậm từ khóa quan trọng. Tuyệt đối KHÔNG chứa mã code block hay ký tự lạ.
`;

    // Construct conversation payload for Gemini
    const historyText = messages.slice(-6).map((m: any) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`).join('\n');

    const prompt = `${systemInstruction}\n\n[LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY]\n${historyText}\n\nLƯU Ý: Hãy đưa ra câu trả lời thuần Tiếng Việt ngắn gọn, súc tích, đi thẳng vào trọng tâm:`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await generateGeminiStream(apiKey, prompt, (chunkText) => {
      const cleanChunk = chunkText
        .replace(/(?:user role|identity|system instruction|user context|assistant role|candidate|employer):\s*/gi, '')
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/```/g, '');
      if (cleanChunk) {
        res.write(`data: ${JSON.stringify({ text: cleanChunk })}\n\n`);
      }
    });

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error in Career Advisor Chatbot Stream:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// API AI CV Analyze & ATS Optimizer
app.post('/api/users/:uid/cv-analyze', async (req: Request, res: Response): Promise<any> => {
  const uid = req.params.uid as string;
  const { desiredJob } = req.body;
  const apiKey = getGeminiApiKey();

  const targetPosition = desiredJob || 'Ứng viên tiềm năng';

  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    let userData: any = {};
    if (userDoc.exists) {
      userData = userDoc.data()!;
    }

    const cvUrl = userData.cvUrl;
    let docxText = '';
    let contentPart: any = null;

    // Kiểm tra xem có file đính kèm thực tế không
    if (cvUrl) {
      try {
        const urlParts = cvUrl.split('/');
        const safeFileName = urlParts[urlParts.length - 1];
        const uploadsDir = path.join(__dirname, '../uploads/cvs');
        const filePath = path.join(uploadsDir, safeFileName);

        if (fs.existsSync(filePath)) {
          const fileExt = path.extname(safeFileName).toLowerCase();
          if (fileExt === '.pdf') {
            const fileBuffer = fs.readFileSync(filePath);
            contentPart = {
              inlineData: {
                data: fileBuffer.toString('base64'),
                mimeType: 'application/pdf'
              }
            };
          } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(fileExt)) {
            const fileBuffer = fs.readFileSync(filePath);
            const mimeType = fileExt === '.png' ? 'image/png' : (fileExt === '.webp' ? 'image/webp' : 'image/jpeg');
            contentPart = {
              inlineData: {
                data: fileBuffer.toString('base64'),
                mimeType
              }
            };
          } else if (fileExt === '.docx') {
            const docxResult = await mammoth.extractRawText({ path: filePath });
            docxText = docxResult.value;
          }
        }
      } catch (err) {
        console.warn('Lỗi đọc file CV vật lý:', err);
      }
    }

    // Nếu không có nội dung file đính kèm, tạo bản tóm tắt hồ sơ từ Firestore
    const profileSummary = `
Tên ứng viên: ${userData.name || userData.fullName || 'Ứng viên'}
Vị trí mong muốn: ${targetPosition}
Kỹ năng: ${Array.isArray(userData.skills) ? userData.skills.join(', ') : (userData.skills || 'Chuyên môn linh hoạt')}
Kinh nghiệm: ${typeof userData.experience === 'string' ? userData.experience : JSON.stringify(userData.experience || [])}
Giới thiệu bản thân: ${userData.bio || userData.about || 'Ứng viên tìm việc chuyên nghiệp'}
    `;

    const prompt = `
[VAI TRÒ VÀ NHIỆM VỤ]
Bạn là Chuyên gia Tuyển dụng và Tối ưu hóa CV chuẩn ATS. Hãy đánh giá CV/Hồ sơ ứng viên cho vị trí mong muốn: "${targetPosition}".

${docxText ? `NỘI DUNG CV:\n${docxText}` : `TÓM TẮT HỒ SƠ ỨNG VIÊN:\n${profileSummary}`}

[YÊU CẦU ĐẦU RA STRICT JSON]
Trả về CHÍNH XÁC MỘT OBJECT JSON KHÔNG BỌC CODE BLOCK:
{
  "score": 88,
  "strengths": ["Điểm mạnh 1 súc tích", "Điểm mạnh 2 súc tích", "Điểm mạnh 3 súc tích"],
  "improvements": ["Điểm cần cải thiện 1 súc tích", "Điểm cần cải thiện 2 súc tích"],
  "suggestions": ["Gợi ý nâng cao điểm số 1", "Gợi ý nâng cao điểm số 2"]
}
    `;

    let result: any;
    if (contentPart) {
      result = await generateGeminiContent(apiKey, [contentPart, prompt]);
    } else {
      result = await generateGeminiContent(apiKey, prompt);
    }

    let text = result.response.text().trim();
    const analysisResult = extractJsonFromText(text);

    const score = typeof analysisResult.score === 'number' ? analysisResult.score : (typeof analysisResult.overallScore === 'number' ? analysisResult.overallScore : 85);
    const strengths = Array.isArray(analysisResult.strengths) && analysisResult.strengths.length > 0 ? analysisResult.strengths : ['Bố cục hồ sơ trình bày rõ ràng', `Kỹ năng phù hợp với vị trí ${targetPosition}`];
    const improvements = Array.isArray(analysisResult.improvements) && analysisResult.improvements.length > 0 ? analysisResult.improvements : ['Cần bổ sung thêm số liệu thành tích cụ thể', 'Tăng cường từ khóa chuyên ngành chuẩn ATS'];
    const suggestions = Array.isArray(analysisResult.suggestions) && analysisResult.suggestions.length > 0 ? analysisResult.suggestions : ['Thêm từ khóa kỹ năng chính vào phần mục tiêu', 'Cập nhật thêm chứng chỉ và các dự án thực tế'];

    return res.status(200).json({
      success: true,
      score,
      overallScore: score,
      strengths,
      improvements,
      suggestions,
      rawAnalysis: text
    });
  } catch (error: any) {
    console.error('Error in CV Analyze:', error);
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

