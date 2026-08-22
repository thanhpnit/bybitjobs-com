import React from 'react';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();
import { router } from 'expo-router';
import { auth, db } from '../src/config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  reload,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signInWithCredential,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';

let GoogleSignin: any = null;
try {
  const GoogleModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleModule?.GoogleSignin;
  if (GoogleSignin) {
    GoogleSignin.configure({
      webClientId: '811135097267-n2pqj79f38pet4fq583tl0m96li04rcc.apps.googleusercontent.com',
    });
  }
} catch (e) {
  console.warn('RNGoogleSignin native module is not available in current environment:', e);
}
import { doc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, orderBy, where, getDocs, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { registerForPushNotificationsAsync } from './use-push-notifications';

export type UserRole = 'candidate' | 'employer' | null;

export interface BranchItem {
  id: string;
  name: string;
  address: string;
}

export interface EmployerData {
  id?: string;
  companyName: string;
  taxId: string;
  phoneNumber: string;
  address: string;
  servicePackage: 'Free' | 'Gold' | 'Diamond';
  currentPackage?: string;
  website?: string;
  email?: string;
  industry?: string;
  scale?: string;
  description?: string;
  branches?: BranchItem[];
  logo?: string;
  logoUrl?: string;
  coverImage?: string;
  cover_image?: string;
  status?: string;
  postsLimit?: string;
  usedPosts?: number;
  packageExpiresAt?: string;
}

export interface UserData {
  emailOrPhone: string;
  fullName?: string;
  isVerified?: boolean;
  desiredJob?: string;
  phone?: string;
  cvName?: string;
  cvSize?: string;
  cvUploadTime?: string;
  cvUrl?: string;
  avatar?: string;
}

export type PackageTier = 'PREMIUM' | 'PRO' | 'FREE';

export const getEmployerPackageTier = (employerData: any): {
  tier: PackageTier;
  isExpired: boolean;
  packageNameDisplay: string;
  remainingDays?: number;
  expiryDateStr?: string;
} => {
  if (!employerData) return { tier: 'FREE', isExpired: false, packageNameDisplay: 'Gói MIỄN PHÍ' };

  // 1. Lấy mốc thời gian hết hạn (nếu có lưu trong Firestore)
  let expiresAtRaw = employerData.packageExpiresAt || employerData.expires_at || employerData.expiredAt || employerData.package_expires_at;

  // Nếu đã mua trả phí (PRO / PREMIUM) mà chưa có ngày hết hạn, mặc định tính 30 ngày từ ngày tạo/cập nhật
  if (!expiresAtRaw && (employerData.isPremium || employerData.isPro || employerData.packageTier)) {
    const startDate = employerData.packageStartDate || employerData.updatedAt || employerData.createdAt;
    let startMs = Date.now();
    if (startDate) {
      const parsedMs = new Date(startDate).getTime();
      if (!isNaN(parsedMs)) {
        startMs = parsedMs;
      }
    }
    const defaultExpMs = startMs + 30 * 24 * 60 * 60 * 1000;
    try {
      expiresAtRaw = new Date(defaultExpMs).toISOString();
    } catch (e) {
      expiresAtRaw = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  let isExpired = false;
  let remainingDays: number | undefined = undefined;
  let expiryDateStr: string | undefined = undefined;

  if (expiresAtRaw) {
    try {
      const expTime = new Date(expiresAtRaw).getTime();
      if (!isNaN(expTime)) {
        const diffMs = expTime - Date.now();
        if (diffMs <= 0) {
          isExpired = true;
          remainingDays = 0;
        } else {
          remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const expDateObj = new Date(expTime);
          const day = String(expDateObj.getDate()).padStart(2, '0');
          const month = String(expDateObj.getMonth() + 1).padStart(2, '0');
          const year = expDateObj.getFullYear();
          expiryDateStr = `${day}/${month}/${year}`;
        }
      }
    } catch (err) {
      console.warn('Lỗi xử lý ngày hết hạn gói:', err);
    }
  }

  // 2. Check explicitly cancelled packageStatus (DO NOT check account status)
  const pkgStatus = (employerData.packageStatus || employerData.paymentStatus || employerData.current_package_status || '').toLowerCase();
  if (pkgStatus === 'cancelled' || pkgStatus === 'expired' || pkgStatus === 'hủy') {
    isExpired = true;
  }

  if (isExpired) {
    return { tier: 'FREE', isExpired: true, packageNameDisplay: 'Gói MIỄN PHÍ (Đã hết hạn)', remainingDays: 0, expiryDateStr: 'Đã hết hạn' };
  }

  // 3. Match Package Tier Name cleanly from ALL possible Firestore fields
  const rawPkgName = (
    employerData.packageTier ||
    employerData.package_tier ||
    employerData.packageName ||
    employerData.package_name ||
    employerData.currentPackage ||
    employerData.current_package ||
    employerData.packageId ||
    employerData.package_id ||
    ''
  ).toString().trim();

  const packageText = [
    rawPkgName,
    employerData.servicePackage,
    employerData.packageName,
    employerData.packageTier,
    employerData.packageId,
    employerData.currentPackage,
    employerData.current_package,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Tier 1: PREMIUM (Diamond / VIP / Premium / Kim Cương / 799k)
  if (
    employerData.isPremium === true ||
    employerData.is_premium === true ||
    packageText.includes('premium') ||
    packageText.includes('diamond') ||
    packageText.includes('kim cương') ||
    packageText.includes('vip') ||
    packageText.includes('799')
  ) {
    return {
      tier: 'PREMIUM',
      isExpired: false,
      packageNameDisplay: 'Gói PREMIUM (VIP 👑)',
      remainingDays: remainingDays !== undefined ? remainingDays : 30,
      expiryDateStr,
    };
  }

  // Tier 2: PRO (Gold / Pro / Standard / Silver / Vàng / Chuyên Nghiệp / 299k)
  if (
    employerData.isPro === true ||
    employerData.is_pro === true ||
    packageText.includes('pro') ||
    packageText.includes('gold') ||
    packageText.includes('silver') ||
    packageText.includes('standard') ||
    packageText.includes('vàng') ||
    packageText.includes('299')
  ) {
    return {
      tier: 'PRO',
      isExpired: false,
      packageNameDisplay: 'Gói PRO (Phổ Biến ⭐)',
      remainingDays: remainingDays !== undefined ? remainingDays : 30,
      expiryDateStr,
    };
  }

  // Default: FREE
  return {
    tier: 'FREE',
    isExpired: false,
    packageNameDisplay: 'Gói MIỄN PHÍ',
    remainingDays: undefined,
    expiryDateStr: undefined,
  };
};

export const isPremiumEmployer = (employerData: any) => {
  const tierInfo = getEmployerPackageTier(employerData);
  return tierInfo.tier === 'PREMIUM' && !tierInfo.isExpired;
};

export const isProEmployer = (employerData: any) => {
  const tierInfo = getEmployerPackageTier(employerData);
  return tierInfo.tier === 'PRO' && !tierInfo.isExpired;
};

export const getPackageLimits = (employerData: any) => {
  const tierInfo = getEmployerPackageTier(employerData);
  if (tierInfo.tier === 'PREMIUM') {
    return { maxJobs: 9999, maxCvs: 9999, canAiJd: true, canAiScore: true, pinRank: 3 };
  }
  if (tierInfo.tier === 'PRO') {
    return { maxJobs: 15, maxCvs: 50, canAiJd: false, canAiScore: true, pinRank: 2 };
  }
  return { maxJobs: 5, maxCvs: 10, canAiJd: false, canAiScore: false, pinRank: 1 };
};

export const canPostJob = (employerData: any, currentActiveJobsCount: number): { allowed: boolean; maxJobs: number; reason?: string } => {
  const limits = getPackageLimits(employerData);
  if (currentActiveJobsCount >= limits.maxJobs) {
    return {
      allowed: false,
      maxJobs: limits.maxJobs,
      reason: `Bạn đã đạt giới hạn tối đa ${limits.maxJobs} tin tuyển dụng của gói dịch vụ hiện tại. Vui lòng nâng cấp gói để đăng thêm tin mới.`,
    };
  }
  return { allowed: true, maxJobs: limits.maxJobs };
};

export const canUnlockCV = (employerData: any, currentUnlockedCount: number): { allowed: boolean; maxCvs: number; reason?: string } => {
  const limits = getPackageLimits(employerData);
  if (currentUnlockedCount >= limits.maxCvs) {
    return {
      allowed: false,
      maxCvs: limits.maxCvs,
      reason: `Bạn đã sử dụng hết hạn mức ${limits.maxCvs} lượt mở khóa CV của gói hiện tại. Vui lòng nâng cấp lên gói dịch vụ cao hơn để xem tiếp.`,
    };
  }
  return { allowed: true, maxCvs: limits.maxCvs };
};

export interface JobItem {
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
  type?: string;
  requiredCount?: number;
  applicantsCount?: number;
  employerId?: string;
  posterName?: string;
  posterFullName?: string;
  postedByName?: string;
  authorName?: string;
  posterEmail?: string;
  status?: 'Chờ duyệt' | 'Hoạt động' | 'Bị từ chối';
  packageTier?: PackageTier;
  isPremium?: boolean;
  isPro?: boolean;
}

export interface CandidateItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone: string;
  desiredJob?: string;
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

export interface ApplicationItem {
  id: string;
  candidateId: string;
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  jobSalary?: string;
  jobLocation?: string;
  applicantName?: string;
  applicantPhone?: string;
  applicantEmail?: string;
  message?: string;
  companyRating?: number;
  companyComment?: string;
  reviewedAt?: string;
  reviewStatus?: 'Chờ duyệt' | 'Đã phê duyệt' | 'Bị báo cáo';
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
  cvName?: string;
  cvSize?: string;
  cvUploadTime?: string;
  cvUrl?: string;
}

export interface SubmitApplicationPayload {
  jobId?: string;
  jobTitle: string;
  companyName?: string;
  jobSalary?: string;
  jobLocation?: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  message?: string;
  cvName?: string;
  cvSize?: string;
  cvUploadTime?: string;
  cvUrl?: string;
}

export interface SavedJobItem {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  jobSalary?: string;
  jobLocation?: string;
  savedAt: string;
}

export interface ViewedJobItem {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  jobSalary?: string;
  jobLocation?: string;
  viewedAt: string;
}

// Giữ lại trạng thái mock cho Employer Data vì Firebase Auth không lưu phần này
// Trong thực tế, dữ liệu này sẽ được lưu ở Firestore hoặc Node.js MongoDB Backend
let globalEmployerData: EmployerData | null = null;
let globalUserRole: UserRole = null;
let globalEmployerUnsubscribe: (() => void) | null = null;
const listeners = new Set<() => void>();
const notifyAll = () => listeners.forEach((l) => l());

export const formatDeadlineDisplay = (deadlineStr?: string): string => {
  if (!deadlineStr) return 'Đang cập nhật';

  if (deadlineStr.includes('/')) {
    const parts = deadlineStr.split('/');
    if (parts.length === 3) {
      let p1 = parseInt(parts[0], 10);
      let p2 = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);

      if (!isNaN(p1) && !isNaN(p2) && !isNaN(y)) {
        let day = p1;
        let month = p2;

        // If p1 > 12 -> p1 is Day, p2 is Month (DD/MM/YYYY)
        if (p1 > 12) {
          day = p1;
          month = p2;
        }
        // If p2 > 12 -> p1 is Month, p2 is Day (MM/DD/YYYY -> convert to DD/MM/YYYY)
        else if (p2 > 12) {
          day = p2;
          month = p1;
        }

        const dStr = String(day).padStart(2, '0');
        const mStr = String(month).padStart(2, '0');
        return `${dStr}/${mStr}/${y}`;
      }
    }
  }

  try {
    const parsed = new Date(deadlineStr);
    if (!isNaN(parsed.getTime())) {
      const dStr = String(parsed.getDate()).padStart(2, '0');
      const mStr = String(parsed.getMonth() + 1).padStart(2, '0');
      return `${dStr}/${mStr}/${parsed.getFullYear()}`;
    }
  } catch (e) { }

  return deadlineStr;
};

export const checkIsJobExpired = (deadlineStr?: string): boolean => {
  if (!deadlineStr) return false;
  try {
    const parts = deadlineStr.split('/');
    let deadlineDate: Date | null = null;
    if (parts.length === 3) {
      let p1 = parseInt(parts[0], 10);
      let p2 = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);
      if (!isNaN(p1) && !isNaN(p2) && !isNaN(y)) {
        let day = p1;
        let month = p2;

        if (p1 > 12) {
          day = p1;
          month = p2;
        } else if (p2 > 12) {
          day = p2;
          month = p1;
        }

        deadlineDate = new Date(y, month - 1, day, 23, 59, 59, 999);
      }
    } else {
      const parsed = new Date(deadlineStr);
      if (!isNaN(parsed.getTime())) {
        deadlineDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
      }
    }

    if (deadlineDate) {
      return new Date() > deadlineDate;
    }
  } catch (err) {
    console.warn('Lỗi kiểm tra hạn ứng tuyển:', err);
  }
  return false;
};

let globalJobs: JobItem[] = [];
let globalJobsUnsubscribe: (() => void) | null = null;

const initJobsListener = () => {
  if (globalJobsUnsubscribe) return;
  const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
  globalJobsUnsubscribe = onSnapshot(q, (snapshot) => {
    globalJobs = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const expired = checkIsJobExpired(data.deadline);
      const rawIsOpen = data.isOpen !== undefined ? data.isOpen : true;
      const isOpen = expired ? false : rawIsOpen;

      // Auto update Firestore when an approved/open job reaches its deadline
      if (expired && rawIsOpen) {
        updateDoc(doc(db, 'jobs', docSnap.id), { isOpen: false, status: 'Đã đóng' })
          .catch(e => console.log('Lỗi tự động đóng bài đăng hết hạn:', e));
      }

      return {
        id: docSnap.id,
        ...data,
        isOpen,
      } as JobItem;
    }).filter(job => !(job as any).employerDisabled);
    notifyAll();
  }, (error) => {
    console.error('Lỗi tải danh sách việc làm:', error);
  });
};
initJobsListener();

export interface OrderItem {
  id: string;
  employerId: string;
  packageId: string;
  packageName: string;
  price: string | number;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

let globalOrders: OrderItem[] = [];
let globalOrdersUnsubscribe: (() => void) | null = null;

let globalCandidates: CandidateItem[] = [
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

let globalApplications: ApplicationItem[] = [
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
let globalApplicationsUnsubscribe: (() => void) | null = null;

export interface InvitationItem {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  companyName: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  createdAt: string;
}

let globalInvitations: InvitationItem[] = [];
let globalInvitationsUnsubscribe: (() => void) | null = null;
let globalCandidatesInterval: ReturnType<typeof setInterval> | null = null;

let globalSavedJobs: SavedJobItem[] = [];
let globalSavedJobsUnsubscribe: (() => void) | null = null;

let globalViewedJobs: ViewedJobItem[] = [];
let globalViewedJobsUnsubscribe: (() => void) | null = null;

export function getRelativeTime(dateString: string, isOpen: boolean): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (!isOpen) {
    if (diffDays <= 0) return 'Đã kết thúc hôm nay';
    return `Đã kết thúc ${diffDays} ngày trước`;
  }

  if (diffMins < 60) {
    return `Đăng ${diffMins} phút trước`;
  } else if (diffHours < 24) {
    return `Đăng ${diffHours} giờ trước`;
  } else if (diffDays === 1) {
    return 'Đăng hôm qua';
  } else {
    return `Đăng ${diffDays} ngày trước`;
  }
}

let globalNotifications: any[] = [];
let globalNotificationsUnsubscribe: (() => void) | null = null;
let globalReadIds: string[] = [];
let globalDeletedNotificationIds: string[] = [];
let globalActiveToast: { id: string; title: string; description: string } | null = null;
let globalSeqId = '000000';
let globalUserDataExtra: { desiredJob?: string; phone?: string; cvName?: string; cvSize?: string; cvUploadTime?: string; cvUrl?: string; avatar?: string; address?: string; companyName?: string } = {};
let lastSubscribedUserId: string | null = null;
const appStartTime = new Date();

const mockNotifications = [
  {
    id: 'mock-1',
    role: 'candidate',
    target: 'USER',
    category: 'job',
    title: 'Nhà tuyển dụng đã xem hồ sơ',
    description: 'Công ty Bybit Việt Nam đã xem CV_Web_Developer_VN.pdf của bạn.',
    time: '3 phút trước',
    isRead: false,
  },
  {
    id: 'mock-3',
    role: 'candidate',
    target: 'USER',
    category: 'job',
    title: 'Tin tuyển dụng phù hợp mới',
    description: 'Việc làm "Senior React Native Developer - Bybit" đang tìm ứng viên phù hợp với bạn.',
    time: '1 giờ trước',
    isRead: false,
  },
  {
    id: 'mock-4',
    role: 'candidate',
    target: 'USER',
    category: 'community',
    title: 'Lượt tương tác mới trong Cộng đồng',
    description: 'Nguyễn Văn A và 5 người khác đã thích bài viết chia sẻ kinh nghiệm phỏng vấn của bạn.',
    time: 'Hôm qua',
    isRead: true,
  },
  {
    id: 'mock-5',
    role: 'candidate',
    target: 'USER',
    category: 'system',
    title: 'Chào mừng bạn đến với BybitJobs',
    description: 'Khám phá ngay hàng ngàn công việc chất lượng và tạo CV chuyên nghiệp miễn phí.',
    time: '2 ngày trước',
    isRead: true,
  },
  {
    id: 'mock-emp-1',
    role: 'employer',
    target: 'RECRUITER',
    category: 'job',
    title: 'Chào mừng Nhà tuyển dụng',
    description: 'Chào mừng bạn đến với hệ thống quản lý tuyển dụng BybitJobs. Đăng tin và tìm kiếm ứng viên ngay!',
    time: '1 giờ trước',
    isRead: false,
  }
];

const getRelativeTimeLabel = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  return `${diffDays} ngày trước`;
};

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(auth.currentUser);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [seqId, setSeqId] = React.useState<string>('000000');

  const [userRole, setUserRole] = React.useState<UserRole>(globalUserRole);
  const [employerData, setEmployerData] = React.useState<EmployerData | null>(globalEmployerData);
  const [jobs, setJobs] = React.useState<JobItem[]>(globalJobs);
  const [orders, setOrders] = React.useState<OrderItem[]>(globalOrders);
  const [candidates, setCandidates] = React.useState<CandidateItem[]>(globalCandidates);
  const [applications, setApplications] = React.useState<ApplicationItem[]>(globalApplications);
  const [savedJobs, setSavedJobs] = React.useState<SavedJobItem[]>(globalSavedJobs);
  const [viewedJobs, setViewedJobs] = React.useState<ViewedJobItem[]>(globalViewedJobs);
  const [invitations, setInvitations] = React.useState<InvitationItem[]>(globalInvitations);
  const [userDataExtra, setUserDataExtra] = React.useState<{ desiredJob?: string; phone?: string; cvName?: string; cvSize?: string; cvUploadTime?: string; cvUrl?: string; avatar?: string }>(globalUserDataExtra);

  const [notifications, setNotifications] = React.useState<any[]>(globalNotifications);
  const [readIds, setReadIds] = React.useState<string[]>(globalReadIds);
  const [deletedNotificationIds, setDeletedNotificationIds] = React.useState<string[]>(globalDeletedNotificationIds);
  const [activeToast, setActiveToast] = React.useState<{ id: string; title: string; description: string } | null>(globalActiveToast);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        if (!globalUserRole) globalUserRole = 'candidate';

        // Guard check: only initialize if this is a new user session
        if (lastSubscribedUserId === user.uid) {
          // Sync states immediately for this hook instance
          setSeqId(globalSeqId);
          setUserDataExtra(globalUserDataExtra);
          setUserRole(globalUserRole);
          setEmployerData(globalEmployerData);
          setNotifications([...globalNotifications]);
          setSavedJobs([...globalSavedJobs]);
          setViewedJobs([...globalViewedJobs]);
          setApplications([...globalApplications]);
          setOrders([...globalOrders]);
          setActiveToast(globalActiveToast);
          setIsInitializing(false);
          return;
        }

        lastSubscribedUserId = user.uid;

        // Đăng ký thông báo đẩy và lưu token lên Firestore
        try {
          registerForPushNotificationsAsync(user.uid);
        } catch (pushErr) {
          console.error('Lỗi khi đăng ký thông báo đẩy:', pushErr);
        }

        // Tự động lấy USER ID tuần tự động từ server VPS
        try {
          const response = await fetch(`http://160.250.246.119:4000/api/users/${user.uid}/seq`);
          if (response.ok) {
            const data = await response.json();
            globalSeqId = data.seqId;
            setSeqId(globalSeqId);
            notifyAll();
          }
        } catch (err) {
          console.error('Lỗi lấy seqId:', err);
        }

        // Fetch job from API instead of Firestore client SDK
        const fetchUserData = async () => {
          try {
            const response = await fetch(`http://160.250.246.119:4000/api/users/${user.uid}`);
            if (response.ok) {
              const data = await response.json();
              globalUserDataExtra = {
                desiredJob: data.job,
                phone: data.phone,
                cvName: data.cvName,
                cvSize: data.cvSize,
                cvUploadTime: data.cvUploadTime,
                cvUrl: data.cvUrl
              };
              setUserDataExtra(globalUserDataExtra);
              notifyAll();
            }
          } catch (err) {
            console.error('Lỗi lấy thông tin user:', err);
          }
        };
        fetchUserData();

        // Fetch read notifications from Firestore
        const fetchNotificationPrefs = async () => {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const uData = userDoc.data();
              if (Array.isArray(uData?.readNotificationIds)) {
                globalReadIds = uData.readNotificationIds;
                setReadIds(globalReadIds);
              }
              if (Array.isArray(uData?.deletedNotificationIds)) {
                globalDeletedNotificationIds = uData.deletedNotificationIds;
                setDeletedNotificationIds(globalDeletedNotificationIds);
              }
              notifyAll();
            }
          } catch (err) {
            console.error('Lỗi khi tải trạng thái thông báo từ Firestore:', err);
          }
        };
        fetchNotificationPrefs();

        // Fetch notifications from Firestore realtime
        if (globalNotificationsUnsubscribe) globalNotificationsUnsubscribe();
        let isFirstLoad = true;
        const qNotifications = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
        globalNotificationsUnsubscribe = onSnapshot(qNotifications, (snapshot) => {
          const dbItems = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              let date: Date;
              if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                  date = data.createdAt.toDate();
                } else {
                  date = new Date(data.createdAt);
                  if (isNaN(date.getTime())) date = new Date();
                }
              } else {
                date = new Date();
              }
              return {
                id: doc.id,
                category: data.category || (['ALL', 'RECRUITER', 'USER'].includes(data.target) ? 'system' : 'security') as any,
                title: data.title || '',
                description: data.body || '',
                time: getRelativeTimeLabel(date),
                isRead: false,
                target: data.target || 'ALL',
                role: data.role || (data.target === 'RECRUITER' ? 'employer' : data.target === 'USER' ? 'candidate' : undefined),
              };
            })
            .filter((item) => ['ALL', 'RECRUITER', 'USER'].includes(item.target) || item.target === user.uid);

          if (isFirstLoad) {
            isFirstLoad = false;
          } else {
            // Check docChanges for added notifications
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();

                // Only show toast for brand new notifications created after the app was started
                let createdAt: Date;
                if (data.createdAt) {
                  if (typeof data.createdAt.toDate === 'function') {
                    createdAt = data.createdAt.toDate();
                  } else {
                    createdAt = new Date(data.createdAt);
                  }
                } else {
                  createdAt = new Date();
                }

                // If notification was created before the app loaded, skip toast alert
                if (createdAt.getTime() <= appStartTime.getTime()) {
                  return;
                }

                // If explicit role is set, it must match current globalUserRole
                if (data.role && data.role !== globalUserRole) {
                  return;
                }

                // Skip toast if already marked as read
                if (globalReadIds.includes(change.doc.id)) {
                  return;
                }

                const target = data.target;
                let isMatch = false;
                if (target === 'ALL') isMatch = true;
                else if (target === 'RECRUITER') isMatch = globalUserRole === 'employer';
                else if (target === 'USER' || target === undefined) isMatch = globalUserRole === 'candidate';
                else if (target === user.uid) isMatch = true;

                if (isMatch) {
                  globalActiveToast = {
                    id: change.doc.id,
                    title: data.title || 'Thông báo mới',
                    description: data.body || '',
                  };
                  notifyAll();

                  // Auto dismiss after 4.5s
                  const currentId = change.doc.id;
                  setTimeout(() => {
                    if (globalActiveToast && globalActiveToast.id === currentId) {
                      globalActiveToast = null;
                      notifyAll();
                    }
                  }, 4500);
                }
              }
            });
          }

          globalNotifications = dbItems;
          setNotifications(dbItems);
          notifyAll();
        }, (error) => {
          console.error('Error fetching mobile notifications realtime:', error);
        });

        if (globalApplicationsUnsubscribe) globalApplicationsUnsubscribe();
        const qApplications = query(
          collection(db, 'applications'),
          orderBy('appliedAt', 'desc')
        );
        globalApplicationsUnsubscribe = onSnapshot(qApplications, (snapshot) => {
          const dbApplications: any[] = [];
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const application: any = {};
            application.id = docSnap.id;
            Object.keys(data).forEach((key) => {
              application[key] = data[key];
            });
            dbApplications.push(application);
          });
          globalApplications = dbApplications;
          setApplications([...globalApplications]);
          notifyAll();
        }, (error) => {
          console.error('Lỗi tải danh sách hồ sơ ứng tuyển:', error);
        });

        if (globalInvitationsUnsubscribe) globalInvitationsUnsubscribe();
        const qInvitations = query(
          collection(db, 'invitations'),
          orderBy('createdAt', 'desc')
        );
        globalInvitationsUnsubscribe = onSnapshot(qInvitations, (snapshot) => {
          const dbInvitations: InvitationItem[] = [];
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            dbInvitations.push({
              id: docSnap.id,
              ...data
            } as InvitationItem);
          });
          globalInvitations = dbInvitations;
          setInvitations([...globalInvitations]);
          notifyAll();
        }, (error) => {
          console.error('Lỗi tải danh sách lời mời ứng tuyển:', error);
        });

        const sampleCandidateNamesList = [
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

        const sampleCandidateRolesList = [
          'Chuyên viên Lập trình Mobile (React Native / iOS)',
          'Lập trình viên Frontend (React / Next.js)',
          'UI/UX Designer (Figma / Product Design)',
          'Chuyên viên Marketing & SEO Content',
          'Nhân viên Bán hàng & CSKH',
          'Barista / Pha chế chuyên nghiệp'
        ];

        const resolveCandidateName = (rawName: any, docId: string): string => {
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
          const index = Math.abs(hash) % sampleCandidateNamesList.length;
          return sampleCandidateNamesList[index];
        };

        const resolveCandidateRole = (rawRole: any, docId: string): string => {
          if (rawRole && typeof rawRole === 'string' && rawRole.trim() && rawRole !== 'Ứng viên tìm việc' && rawRole !== 'Ứng viên (Mobile App)') {
            return rawRole.trim();
          }
          let hash = 0;
          for (let i = 0; i < (docId || 'id').length; i++) {
            hash = (hash << 5) - hash + (docId || 'id').charCodeAt(i);
            hash |= 0;
          }
          const index = Math.abs(hash) % sampleCandidateRolesList.length;
          return sampleCandidateRolesList[index];
        };

        const fetchCandidates = async () => {
          try {
            const res = await fetch('http://160.250.246.119:4000/api/candidates');
            if (res.ok) {
              const data = await res.json();
              const cleaned = data.map((c: any) => ({
                ...c,
                name: resolveCandidateName(c.name, c.id),
                role: resolveCandidateRole(c.role, c.id),
              }));
              globalCandidates = cleaned;
              setCandidates(cleaned);
              notifyAll();
            }
          } catch (err) {
            console.error('Lỗi tải danh sách ứng viên từ API:', err);
          }
        };
        fetchCandidates();
        if (globalCandidatesInterval) clearInterval(globalCandidatesInterval);
        globalCandidatesInterval = setInterval(fetchCandidates, 6000);

        if (globalSavedJobsUnsubscribe) globalSavedJobsUnsubscribe();
        const qSavedJobs = query(
          collection(db, 'savedJobs'),
          where('userId', '==', user.uid)
        );
        globalSavedJobsUnsubscribe = onSnapshot(qSavedJobs, (snapshot) => {
          globalSavedJobs = (snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as SavedJobItem[]).sort(
            (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
          );
          setSavedJobs([...globalSavedJobs]);
          notifyAll();
        }, (error) => {
          console.error('Lỗi tải danh sách việc đã lưu:', error);
        });

        if (globalViewedJobsUnsubscribe) globalViewedJobsUnsubscribe();
        const qViewedJobs = query(
          collection(db, 'viewedJobs'),
          where('userId', '==', user.uid)
        );
        globalViewedJobsUnsubscribe = onSnapshot(qViewedJobs, (snapshot) => {
          globalViewedJobs = (snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ViewedJobItem[]).sort(
            (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
          );
          setViewedJobs([...globalViewedJobs]);
          notifyAll();
        }, (error) => {
          console.error('Lỗi tải danh sách việc đã xem:', error);
        });

        let pollingInterval: ReturnType<typeof setInterval> | null = null;

        const fetchEmployerData = async () => {
          try {
            let empData: any = null;
            try {
              const empResponse = await fetch(`http://160.250.246.119:4000/api/employers/${user.uid}`);
              if (empResponse.ok) {
                empData = await empResponse.json();
              }
            } catch (netErr) {
              console.warn('API fetchEmployerData failed, attempting Firestore fallback:', netErr);
            }

            // Fallback to reading directly from Firestore if API call failed or returned null
            if (!empData) {
              const fsDoc = await getDoc(doc(db, 'employers', user.uid));
              if (fsDoc.exists()) {
                empData = fsDoc.data();
              }
            }

            if (empData) {
              globalEmployerData = {
                id: empData.id || empData.user_id || user.uid,
                companyName: empData.company_name || empData.companyName || empData.company || '',
                taxId: empData.tax_code || empData.taxId || '',
                phoneNumber: empData.phone || empData.phoneNumber || '',
                address: empData.address || '',
                servicePackage: 'Free',
                currentPackage: empData.current_package || empData.currentPackage || 'basic',
                status: empData.status || 'Chờ duyệt',
                industry: empData.industry || 'Khác',
                scale: empData.scale || '1-10 nhân viên',
                description: empData.description || 'Chưa có mô tả',
                logo: empData.logo_url || empData.logo || null,
                email: user.email || '',
                postsLimit: empData.postsLimit || '0/1'
              };

              // Listen for orders once per user session
              if (!globalOrdersUnsubscribe) {
                const qOrders = query(collection(db, 'orders'), where('employerId', '==', user.uid), orderBy('createdAt', 'desc'));
                globalOrdersUnsubscribe = onSnapshot(qOrders, (snapshot) => {
                  globalOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderItem[];

                  // Auto update package if there is a successful order
                  const latestSuccessOrder = globalOrders.find(o => o.status === 'success');
                  if (globalEmployerData) {
                    globalEmployerData = {
                      ...globalEmployerData,
                      currentPackage: latestSuccessOrder ? latestSuccessOrder.packageName : (globalEmployerData.currentPackage || 'basic')
                    };
                    setEmployerData({ ...globalEmployerData });
                  }
                  setOrders([...globalOrders]);
                  notifyAll();
                }, (error) => {
                  console.error('Lỗi tải danh sách đơn hàng:', error);
                });
              }

              if (!globalUserRole) {
                globalUserRole = 'candidate';
              }
            } else {
              globalUserRole = 'candidate';
              globalEmployerData = null;
            }
          } catch (err) {
            console.error('Lỗi lấy thông tin employer:', err);
          }
          setUserRole(globalUserRole);
          setEmployerData(globalEmployerData);
          notifyAll();

          // Stop polling if verified
          if (globalEmployerData?.status === 'Xác thực' && pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        };

        fetchEmployerData();

        pollingInterval = setInterval(() => {
          if (!globalEmployerData || globalEmployerData.status === 'Chờ duyệt') {
            fetchEmployerData();
          }
        }, 3000);

        globalEmployerUnsubscribe = () => {
          if (pollingInterval) clearInterval(pollingInterval);
        };
      } else {
        lastSubscribedUserId = null;
        globalSeqId = '000000';
        globalUserDataExtra = {};
        if (globalEmployerUnsubscribe) {
          globalEmployerUnsubscribe();
          globalEmployerUnsubscribe = null;
        }
        if (globalOrdersUnsubscribe) {
          globalOrdersUnsubscribe();
          globalOrdersUnsubscribe = null;
        }
        if (globalApplicationsUnsubscribe) {
          globalApplicationsUnsubscribe();
          globalApplicationsUnsubscribe = null;
        }
        if (globalInvitationsUnsubscribe) {
          globalInvitationsUnsubscribe();
          globalInvitationsUnsubscribe = null;
        }
        if (globalSavedJobsUnsubscribe) {
          globalSavedJobsUnsubscribe();
          globalSavedJobsUnsubscribe = null;
        }
        if (globalViewedJobsUnsubscribe) {
          globalViewedJobsUnsubscribe();
          globalViewedJobsUnsubscribe = null;
        }
        if (globalNotificationsUnsubscribe) {
          globalNotificationsUnsubscribe();
          globalNotificationsUnsubscribe = null;
        }
        if (globalCandidatesInterval) {
          clearInterval(globalCandidatesInterval);
          globalCandidatesInterval = null;
        }
        globalNotifications = [];
        globalInvitations = [];
        globalReadIds = [];
        globalDeletedNotificationIds = [];
        globalActiveToast = null;
        globalUserRole = null;
        globalEmployerData = null;
        globalSavedJobs = [];
        globalViewedJobs = [];
        setSeqId('000000');
        setUserDataExtra({});
        setUserRole(null);
        setEmployerData(null);
        setSavedJobs([]);
        setViewedJobs([]);
        setInvitations([]);
        setNotifications([]);
        setReadIds([]);
        setDeletedNotificationIds([]);
        setActiveToast(null);
      }
      setIsInitializing(false);
    });

    const handleMockDataChange = () => {
      setUserRole(globalUserRole);
      setEmployerData(globalEmployerData);
      setJobs([...globalJobs]);
      setOrders([...globalOrders]);
      setCandidates([...globalCandidates]);
      setApplications([...globalApplications]);
      setSavedJobs([...globalSavedJobs]);
      setViewedJobs([...globalViewedJobs]);
      setInvitations([...globalInvitations]);
      setNotifications([...globalNotifications]);
      setReadIds([...globalReadIds]);
      setDeletedNotificationIds([...globalDeletedNotificationIds]);
      setActiveToast(globalActiveToast);
      setSeqId(globalSeqId);
      setUserDataExtra(globalUserDataExtra);
    };
    listeners.add(handleMockDataChange);

    return () => {
      unsubscribe();
      listeners.delete(handleMockDataChange);
      if (globalCandidatesInterval) {
        clearInterval(globalCandidatesInterval);
        globalCandidatesInterval = null;
      }
    };
  }, []);

  React.useEffect(() => {
    let intervalId: any = null;

    const checkStatus = async () => {
      if (firebaseUser) {
        try {
          await reload(firebaseUser);
        } catch (err: any) {
          console.log("Trạng thái tài khoản thay đổi (có thể bị khóa hoặc xóa):", err.message);
          if (err.code === 'auth/user-disabled' || err.code === 'auth/user-not-found') {
            if (intervalId) clearInterval(intervalId);
            const title = err.code === 'auth/user-disabled' ? 'Tài khoản bị vô hiệu hóa hoặc khóa' : 'Tài khoản không tồn tại';
            const msg = err.code === 'auth/user-disabled'
              ? 'Tài khoản của bạn đã bị vô hiệu hóa hoặc bị khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ.'
              : 'Tài khoản của bạn đã bị xóa khỏi hệ thống. Vui lòng liên hệ ban quản trị để được hỗ trợ.';
            Alert.alert(
              title,
              msg,
              [{ text: 'Đồng ý', onPress: () => firebaseSignOut(auth) }]
            );
          }
        }
      }
    };

    if (firebaseUser) {
      checkStatus();
      intervalId = setInterval(checkStatus, 60000); // Check every 60s instead of 5s
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [firebaseUser]);

  const login = async (emailOrPhone: string, passwordInput: string): Promise<{ success: boolean; message: string }> => {
    try {
      await signInWithEmailAndPassword(auth, emailOrPhone, passwordInput);
      return { success: true, message: 'Đăng nhập thành công!' };
    } catch (error: any) {
      let msg = `Đăng nhập thất bại. Vui lòng thử lại. Lỗi: ${error.message}`;
      if (error.code === 'auth/user-disabled') {
        msg = 'Tài khoản của bạn đã bị vô hiệu hóa hoặc bị khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ.';
      } else if (error.code === 'auth/user-not-found') {
        msg = 'Tài khoản của bạn đã bị xóa khỏi hệ thống. Vui lòng liên hệ ban quản trị để được hỗ trợ.';
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        msg = 'Sai thông tin email hoặc mật khẩu.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Định dạng email không hợp lệ.';
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = 'Chưa bật tính năng Đăng nhập Email/Password trên Firebase!';
      }
      return { success: false, message: msg };
    }
  };

  const signInOrRegisterGoogleAccount = async (cleanEmail: string, displayName: string): Promise<{ success: boolean; message: string }> => {
    const demoPass = 'GoogleUser123!';
    let user = null;

    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, demoPass);
      user = userCred.user;
    } catch (signInErr: any) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, demoPass);
        user = userCred.user;
      } catch (createErr: any) {
        // Email already registered with custom password in Firebase
        try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const userDoc = querySnap.docs[0];
            const data = userDoc.data();
            setFirebaseUser({
              uid: userDoc.id,
              email: cleanEmail,
              displayName: data.fullName || displayName,
              photoURL: data.avatar,
              emailVerified: true,
            } as any);
            notifyAll();
            return { success: true, message: `Đăng nhập thành công với Gmail ${cleanEmail}!` };
          }
        } catch (fsErr) { }
        return { success: true, message: `Đăng nhập thành công với Gmail ${cleanEmail}!` };
      }
    }

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          email: cleanEmail,
          fullName: displayName,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563EB&color=fff`,
          authProvider: 'google',
          role: globalUserRole || 'candidate',
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
      setFirebaseUser({ ...auth.currentUser } as FirebaseUser);
      notifyAll();
      return { success: true, message: `Đăng nhập thành công với Gmail ${cleanEmail}!` };
    }

    return { success: false, message: 'Đăng nhập Google thất bại.' };
  };

  const loginWithGoogle = async (googleEmail: string, googleName: string): Promise<{ success: boolean; message: string }> => {
    return signInOrRegisterGoogleAccount(googleEmail.trim().toLowerCase(), googleName);
  };

  const loginWithGoogleRealWeb = async (userEmail?: string): Promise<{ success: boolean; message: string }> => {
    try {
      // If user typed their real Gmail directly
      if (userEmail && userEmail.trim().includes('@')) {
        const cleanEmail = userEmail.trim().toLowerCase();
        const displayName = cleanEmail.split('@')[0];
        return signInOrRegisterGoogleAccount(cleanEmail, displayName);
      }

      // Try Real Google Web OAuth Session using Expo Auth Proxy URL
      const redirectUrl = 'https://auth.expo.io/@thanhpnit/bybitjobs-mobile-app';
      const clientId = '811135097267-n2pqj79f38pet4fq583tl0m96li04rcc.apps.googleusercontent.com';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent('openid profile email')}` +
        `&nonce=${Math.random().toString(36).substring(7)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const url = result.url;
        const match = url.match(/id_token=([^&]+)/);
        const idToken = match ? match[1] : null;

        if (idToken) {
          const googleCredential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, googleCredential);
          const user = userCredential.user;

          if (user) {
            try {
              const response = await fetch(`http://160.250.246.119:4000/api/users/${user.uid}/seq`);
              if (response.ok) {
                const data = await response.json();
                globalSeqId = data.seqId;
                setSeqId(data.seqId);
              }
            } catch (e) { }

            try {
              const userDocRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userDocRef);
              if (!userSnap.exists()) {
                await setDoc(userDocRef, {
                  email: user.email || '',
                  fullName: user.displayName || 'Người dùng Google',
                  avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Google')}&background=2563EB&color=fff`,
                  authProvider: 'google',
                  role: globalUserRole || 'candidate',
                  createdAt: serverTimestamp(),
                }, { merge: true });
              }
            } catch (fsErr) {
              console.error('Lỗi lưu thông tin user Google:', fsErr);
            }

            setFirebaseUser({ ...auth.currentUser } as FirebaseUser);
            notifyAll();
            return { success: true, message: `Đăng nhập Google THẬT thành công với ${user.email}!` };
          }
        }
      }
      return { success: false, message: 'LỖI_ỦY_QUYỀN_GOOGLE' };
    } catch (error: any) {
      console.error('Lỗi Đăng nhập Google WebBrowser:', error);
      return { success: false, message: 'LỖI_ỦY_QUYỀN_GOOGLE' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('http://160.250.246.119:4000/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};
      return { success: response.ok, message: result.message || result.error || 'Lỗi gửi OTP đặt lại mật khẩu.' };
    } catch (error: any) {
      console.error('Lỗi gọi API gửi OTP quên mật khẩu:', error);
      return {
        success: false,
        message: 'API gửi OTP quên mật khẩu chưa phản hồi đúng định dạng. Vui lòng kiểm tra backend đã deploy/restart route mới chưa.',
      };
    }
  };

  const confirmResetPassword = async (
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('http://160.250.246.119:4000/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};
      return { success: response.ok, message: result.message || result.error || 'Lỗi đổi mật khẩu.' };
    } catch (error: any) {
      console.error('Lỗi gọi API đổi mật khẩu bằng OTP:', error);
      return {
        success: false,
        message: 'API đổi mật khẩu chưa phản hồi đúng định dạng. Vui lòng kiểm tra backend đã deploy/restart route mới chưa.',
      };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return { success: false, message: 'Vui lòng đăng nhập lại để đổi mật khẩu.' };
      }
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return { success: true, message: 'Đổi mật khẩu thành công!' };
    } catch (error: any) {
      console.error('Lỗi đổi mật khẩu:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
      } else if (error.code === 'auth/weak-password') {
        return { success: false, message: 'Mật khẩu mới quá yếu. Vui lòng nhập tối thiểu 6 ký tự.' };
      } else if (error.code === 'auth/requires-recent-login') {
        return { success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại.' };
      }
      return { success: false, message: error.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.' };
    }
  };

  const signup = async (emailOrPhone: string, fullName: string, passwordInput: string): Promise<{ success: boolean; message: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailOrPhone, passwordInput);
      await updateProfile(userCredential.user, { displayName: fullName });
      await userCredential.user.reload();
      setFirebaseUser({ ...auth.currentUser } as FirebaseUser);
      // Tải mã seqId mới ngay sau khi tạo tài khoản
      try {
        const response = await fetch(`http://160.250.246.119:4000/api/users/${userCredential.user.uid}/seq`);
        if (response.ok) {
          const data = await response.json();
          globalSeqId = data.seqId;
          setSeqId(data.seqId);
          notifyAll();
        }
      } catch { }
      return { success: true, message: 'Đăng ký tài khoản thành công!' };
    } catch (error: any) {
      let msg = `Đăng ký thất bại. Vui lòng thử lại. Lỗi: ${error.message}`;
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Email này đã được đăng ký trên hệ thống.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Mật khẩu quá yếu, vui lòng nhập ít nhất 6 ký tự.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Định dạng email không hợp lệ.';
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = 'Chưa bật tính năng Đăng nhập Email/Password trên Firebase!';
      }
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất", error);
    }
  };

  const sendOtp = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return { success: false, message: 'Chưa đăng nhập hoặc tài khoản thiếu email.' };

      const response = await fetch('http://160.250.246.119:4000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const responseText = await response.text();
      let result: any = {};
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.warn('Phản hồi send-otp từ server không phải JSON:', responseText);
      }

      return { success: response.ok, message: result.message || result.error || 'Lỗi gửi mã OTP qua Nodemailer. Vui lòng deploy server VPS.' };
    } catch (error: any) {
      console.error('Lỗi gọi API sendOtp Nodemailer:', error);
      return { success: false, message: error.message };
    }
  };

  const verifyAccount = async (otp: string): Promise<{ success: boolean; message: string }> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'Chưa đăng nhập.' };
      }

      const response = await fetch(`http://160.250.246.119:4000/api/users/${user.uid}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });
      const result = await response.json();

      if (response.ok) {
        await user.reload();
        setFirebaseUser({ ...auth.currentUser } as FirebaseUser);
        return { success: true, message: 'Xác minh thành công!' };
      } else {
        return { success: false, message: result.error || 'Lỗi xác minh.' };
      }
    } catch (error: any) {
      console.error('Lỗi gọi API verify:', error);
      return { success: false, message: error.message };
    }
  };

  const registerEmployer = async (data: Omit<EmployerData, 'servicePackage'>) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Chưa đăng nhập');

      const payload = {
        company: data.companyName,
        industry: data.industry || 'Khác',
        address: data.address,
        taxId: data.taxId,
        phone: data.phoneNumber,
        email: user.email,
        status: 'Chờ duyệt'
      };

      const response = await fetch(`http://160.250.246.119:4000/api/employers/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        globalUserRole = 'candidate';
        globalEmployerData = { ...data, servicePackage: 'Free', status: result.employer.status };
        notifyAll();
      } else {
        throw new Error('Lỗi từ server');
      }
    } catch (error) {
      console.error('Lỗi đăng ký nhà tuyển dụng:', error);
      throw error;
    }
  };

  const updateCompany = async (data: Partial<EmployerData>) => {
    if (globalEmployerData) {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Chưa đăng nhập');

        const payload: any = {};
        if (data.companyName) payload.company = data.companyName;
        if (data.industry) payload.industry = data.industry;
        if (data.address) payload.address = data.address;
        if (data.taxId) payload.taxId = data.taxId;
        if (data.phoneNumber) payload.phone = data.phoneNumber;
        if (data.logoUrl || data.logo) payload.logo_url = data.logoUrl || data.logo;

        const response = await fetch(`http://160.250.246.119:4000/api/employers/${user.uid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          globalEmployerData = { ...globalEmployerData, ...data };
          try {
            await setDoc(doc(db, 'employers', user.uid), {
              companyName: data.companyName || globalEmployerData.companyName,
              logo_url: data.logoUrl || data.logo,
              logo: data.logoUrl || data.logo,
              ...payload
            }, { merge: true });
          } catch (fsErr) { }
          notifyAll();
        }
      } catch (error) {
        console.error('Lỗi cập nhật nhà tuyển dụng:', error);
      }
    }
  };

  const updatePackage = (packageName: 'Free' | 'Gold' | 'Diamond') => {
    if (globalEmployerData) {
      globalEmployerData.servicePackage = packageName;
      notifyAll();
    }
  };

  const createOrder = async (packageId: string, packageName: string, price: string, orderCode: string) => {
    if (!auth.currentUser) return;
    try {
      const orderId = `order-${Date.now()}`;
      const newOrder = {
        employerId: auth.currentUser.uid,
        packageId,
        packageName,
        price,
        orderCode,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'orders', orderId), newOrder);
      return orderId;
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      Alert.alert('Lỗi', 'Không thể tạo đơn hàng lúc này.');
      return null;
    }
  };

  const addJob = async (job: Omit<JobItem, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      if (globalEmployerData) {
        const currentPackage = globalEmployerData.currentPackage || '';
        // Fallback backward compatibility for users still having postsLimit string
        let used = globalEmployerData.usedPosts || 0;
        if (globalEmployerData.postsLimit && globalEmployerData.postsLimit.includes('/')) {
          used = parseInt(globalEmployerData.postsLimit.split('/')[0], 10) || 0;
        }

        // 1. Check expiration
        if (globalEmployerData.packageExpiresAt) {
          const expiresAt = new Date(globalEmployerData.packageExpiresAt);
          if (new Date() > expiresAt) {
            Alert.alert(
              'Gói đã hết hạn',
              `Gói ${globalEmployerData.currentPackage || 'Miễn phí'} của bạn đã hết hạn vào ngày ${expiresAt.toLocaleDateString('vi-VN')}. Vui lòng nâng cấp gói để tiếp tục đăng tin.`,
              [
                { text: 'Đóng', style: 'cancel' },
                { text: 'Nâng cấp ngay', onPress: () => router.push('/recruiter/pricing' as any) }
              ]
            );
            return false;
          }
        }

        // 2. Fetch latest package config for limit
        const packagesSnap = await getDocs(collection(db, 'packages'));
        let limit = 0;
        packagesSnap.forEach((d) => {
          const pkg = d.data();
          if (pkg.name === currentPackage || pkg.id === currentPackage) {
            limit = pkg.maxPosts || 0;
          }
        });

        if (!limit) {
          const cp = currentPackage.toLowerCase();
          if (cp.includes('pro') || cp.includes('gold') || cp.includes('standard') || cp.includes('vàng')) limit = 15;
          else if (cp.includes('premium') || cp.includes('diamond') || cp.includes('vip') || cp.includes('kim cương')) limit = 9999;
          else limit = 5; // Default Free: 5 posts limit
        }

        if (used >= limit) {
          Alert.alert(
            'Hết lượt đăng bài',
            `Gói ${globalEmployerData.currentPackage || 'Miễn phí'} của bạn cho phép đăng tối đa ${limit} bài. Bạn đã dùng hết số lượt này. Vui lòng nâng cấp gói để tiếp tục đăng tin.`,
            [
              { text: 'Đóng', style: 'cancel' },
              { text: 'Nâng cấp ngay', onPress: () => router.push('/recruiter/pricing' as any) }
            ]
          );
          return false; // Not allowed
        }

        // Cập nhật lượt đăng bài
        const newUsed = used + 1;
        globalEmployerData.usedPosts = newUsed;
        if (auth.currentUser) {
          await updateDoc(doc(db, 'employers', auth.currentUser.uid), { usedPosts: newUsed });
        }
      }

      const tierInfo = getEmployerPackageTier(globalEmployerData);
      const jobId = `job-${Date.now()}`;
      const newJob = {
        ...job,
        id: jobId,
        packageTier: tierInfo.tier,
        isPremium: tierInfo.tier === 'PREMIUM',
        isPro: tierInfo.tier === 'PRO',
        createdAt: new Date().toISOString(),
        employerId: auth.currentUser?.uid || '',
        posterName: auth.currentUser?.displayName || globalEmployerData?.companyName || 'Nhà tuyển dụng',
        posterEmail: auth.currentUser?.email || '',
        companyName: globalEmployerData?.companyName || auth.currentUser?.displayName || 'Nhà tuyển dụng',
        status: 'Chờ duyệt'
      };
      await setDoc(doc(db, 'jobs', jobId), newJob);

      // Kích hoạt AI gợi ý ứng viên (chạy ngầm)
      fetch(`http://160.250.246.119:4000/api/jobs/${jobId}/ai-match`, { method: 'POST' })
        .catch(err => console.log('Lỗi gọi AI Match:', err));

      return true;
    } catch (error) {
      console.error('Lỗi khi thêm việc làm:', error);
      Alert.alert('Lỗi', 'Không thể đăng tin lúc này.');
      return false;
    }
  };

  const updateJob = async (id: string, updatedFields: Partial<JobItem>) => {
    if (!id || typeof id !== 'string') {
      console.warn('Lỗi khi cập nhật việc làm: ID không hợp lệ hoặc bị thiếu (undefined).');
      return;
    }
    try {
      await updateDoc(doc(db, 'jobs', id), updatedFields);
    } catch (error) {
      console.error('Lỗi khi cập nhật việc làm:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật tin lúc này.');
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'jobs', id));
    } catch (error) {
      console.error('Lỗi khi xoá việc làm:', error);
      Alert.alert('Lỗi', 'Không thể xoá tin lúc này.');
    }
  };

  const updateApplicationStatus = async (appId: string, status: 'Pending' | 'Approved' | 'Rejected') => {
    const app = globalApplications.find((a) => a.id === appId);
    if (!app) return;

    // Strict rule: Once application status is Approved or Rejected, it is permanently locked and cannot be changed!
    if (app.status === 'Approved' || app.status === 'Rejected') {
      console.warn(`[Status Locked] Application ${appId} is already ${app.status}. Cannot change status.`);
      return;
    }

    globalApplications = globalApplications.map((appItem) => {
      if (appItem.id === appId) {
        // Unlock contact info for the candidate if Approved
        if (status === 'Approved') {
          globalCandidates = globalCandidates.map((c) => {
            if (c.id === appItem.candidateId) {
              // Unmask phone number
              let unmasked = c.phone;
              if (c.id === 'candidate-1') unmasked = '0987345678';
              else if (c.id === 'candidate-2') unmasked = '0912345678';
              else if (c.id === 'candidate-3') unmasked = '0945123456';
              return { ...c, phone: unmasked };
            }
            return c;
          });
        }
        return { ...appItem, status };
      }
      return appItem;
    });
    setApplications([...globalApplications]);
    notifyAll();

    try {
      await updateDoc(doc(db, 'applications', appId), { status });

      // Send notification to the candidate
      if (app && (status === 'Approved' || status === 'Rejected')) {
        const job = globalJobs.find((j) => j.id === app.jobId);
        const jobTitle = app.jobTitle || job?.title || 'công việc';
        const companyName = app.companyName || job?.posterName || 'Nhà tuyển dụng';

        const notifTitle = status === 'Approved' ? 'Hồ sơ được chấp nhận' : 'Hồ sơ bị từ chối';
        const notifBody = status === 'Approved'
          ? `Hồ sơ ứng tuyển của bạn cho công việc "${jobTitle}" tại "${companyName}" đã được duyệt.`
          : `Hồ sơ ứng tuyển của bạn cho công việc "${jobTitle}" tại "${companyName}" đã bị từ chối.`;

        await addDoc(collection(db, 'notifications'), {
          target: app.candidateId,
          role: 'candidate',
          category: 'job',
          title: notifTitle,
          body: notifBody,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái hồ sơ ứng tuyển:', error);
    }
  };

  const submitApplication = async (payload: SubmitApplicationPayload): Promise<{ success: boolean; message: string }> => {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, message: 'Vui lòng đăng nhập để ứng tuyển.' };
    }

    try {
      await reload(user);
    } catch (error) {
      console.error('Lỗi làm mới trạng thái xác minh tài khoản:', error);
    }

    if (!auth.currentUser?.emailVerified) {
      return { success: false, message: 'Bạn cần xác minh tài khoản trước khi ứng tuyển.' };
    }

    const jobId = payload.jobId || `job-${payload.jobTitle.trim().toLowerCase().replace(/\s+/g, '-')}`;
    const hasApplied = globalApplications.some(
      (app) => app.candidateId === user.uid && app.jobId === jobId
    );

    if (hasApplied) {
      return { success: false, message: 'Bạn đã ứng tuyển công việc này rồi.' };
    }

    // Check CV limits
    const job = globalJobs.find(j => j.id === jobId);
    if (job && job.employerId) {
      const jobAppsCount = globalApplications.filter((app) => app.jobId === jobId).length;

      const empDoc = await getDoc(doc(db, 'employers', job.employerId));
      let currentPackage = 'Miễn phí';
      if (empDoc.exists()) {
        currentPackage = empDoc.data().currentPackage || 'Miễn phí';
      }

      const packagesSnap = await getDocs(collection(db, 'packages'));
      let maxCVs = 0;
      packagesSnap.forEach((d) => {
        const pkg = d.data();
        if (pkg.name === currentPackage || pkg.id === currentPackage) {
          maxCVs = pkg.maxCVs || 0;
        }
      });

      if (!maxCVs) {
        const cp = currentPackage.toLowerCase();
        if (cp.includes('starter') || cp.includes('basic')) maxCVs = 10;
        else if (cp.includes('pro') || cp.includes('standard')) maxCVs = 20;
        else if (cp.includes('premium')) maxCVs = 99999;
        else maxCVs = 5;
      }

      if (jobAppsCount >= maxCVs) {
        return { success: false, message: 'Số lượng CV đã tối đa.' };
      }
    }

    const newApplication: ApplicationItem = {
      id: `app-${Date.now()}`,
      candidateId: user.uid,
      jobId,
      jobTitle: payload.jobTitle || 'Công việc',
      companyName: payload.companyName || 'Doanh nghiệp',
      jobSalary: payload.jobSalary || 'Thỏa thuận',
      jobLocation: payload.jobLocation || 'TP. Hồ Chí Minh',
      applicantName: payload.applicantName || 'Ứng viên',
      applicantPhone: payload.applicantPhone || '',
      applicantEmail: payload.applicantEmail || '',
      message: payload.message || '',
      status: 'Pending',
      appliedAt: new Date().toISOString(),
      cvName: payload.cvName || '',
      cvSize: payload.cvSize || '',
      cvUploadTime: payload.cvUploadTime || '',
      cvUrl: payload.cvUrl || '',
    };

    const sanitizedApp = Object.fromEntries(
      Object.entries(newApplication).map(([k, v]) => [k, v === undefined ? '' : v])
    );

    globalApplications = [newApplication, ...globalApplications];
    try {
      await setDoc(doc(db, 'applications', newApplication.id), sanitizedApp);
    } catch (error) {
      console.error('Lỗi lưu việc đã ứng tuyển lên Firestore:', error);
    }
    setApplications([...globalApplications]);
    notifyAll();

    return { success: true, message: 'Hồ sơ ứng tuyển của bạn đã được gửi đi thành công!' };
  };

  const cancelApplication = async (appId: string): Promise<{ success: boolean; message: string }> => {
    const targetApplication = globalApplications.find((app) => app.id === appId);
    if (!targetApplication) {
      return { success: false, message: 'Không tìm thấy hồ sơ ứng tuyển.' };
    }

    globalApplications = globalApplications.filter((app) => app.id !== appId);
    setApplications([...globalApplications]);
    notifyAll();

    try {
      await deleteDoc(doc(db, 'applications', appId));
    } catch (error) {
      console.error('Lỗi hủy ứng tuyển trên Firestore:', error);
    }

    return { success: true, message: 'Đã hủy ứng tuyển công việc này.' };
  };

  const updateApplicationFeedback = async (
    appId: string,
    feedback: { companyRating: number; companyComment: string }
  ): Promise<{ success: boolean; message: string }> => {
    const reviewedAt = new Date().toISOString();
    globalApplications = globalApplications.map((app) => {
      if (app.id === appId) {
        return {
          ...app,
          companyRating: feedback.companyRating,
          companyComment: feedback.companyComment,
          reviewedAt,
          reviewStatus: 'Đã phê duyệt',
        };
      }
      return app;
    });
    setApplications([...globalApplications]);
    notifyAll();

    try {
      await updateDoc(doc(db, 'applications', appId), {
        companyRating: feedback.companyRating,
        companyComment: feedback.companyComment,
        reviewedAt,
        reviewStatus: 'Đã phê duyệt',
      });

      // Recalculate average rating & sync to employers, users, and job_posts
      const targetApp = globalApplications.find(a => a.id === appId);
      const companyName = targetApp?.companyName;
      if (companyName) {
        const snapApps = await getDocs(collection(db, 'applications'));
        let totalScore = 0;
        let count = 0;

        snapApps.forEach((docSnap) => {
          const val = docSnap.data();
          const cName = val.companyName || val.company || '';
          const r = Number(val.companyRating || 0);

          if (cName.toLowerCase().trim() === companyName.toLowerCase().trim() && r > 0) {
            totalScore += r;
            count += 1;
          }
        });

        const avg = count > 0 ? Number((totalScore / count).toFixed(1)) : 5.0;

        // Update `employers`
        const snapEmp = await getDocs(collection(db, 'employers'));
        snapEmp.forEach(async (docSnap) => {
          const item = docSnap.data();
          const cName = item.companyName || item.company_name || item.company || '';
          if (cName.toLowerCase().trim() === companyName.toLowerCase().trim()) {
            await updateDoc(doc(db, 'employers', docSnap.id), {
              rating: avg,
              reviewCount: count,
              totalReviews: count
            });
          }
        });

        // Update `users`
        const snapUsers = await getDocs(collection(db, 'users'));
        snapUsers.forEach(async (docSnap) => {
          const item = docSnap.data();
          const cName = item.companyName || item.company_name || item.company || '';
          if (cName.toLowerCase().trim() === companyName.toLowerCase().trim() || item.email?.toLowerCase() === companyName.toLowerCase()) {
            await updateDoc(doc(db, 'users', docSnap.id), {
              rating: avg,
              reviewsCount: count,
              totalReviews: count
            });
          }
        });

        // Update `job_posts`
        const snapJobs = await getDocs(collection(db, 'job_posts'));
        snapJobs.forEach(async (docSnap) => {
          const item = docSnap.data();
          const cName = item.companyName || item.company_name || item.company || '';
          if (cName.toLowerCase().trim() === companyName.toLowerCase().trim()) {
            await updateDoc(doc(db, 'job_posts', docSnap.id), {
              companyRating: avg,
              reviewsCount: count
            });
          }
        });
      }
    } catch (error) {
      console.error('Lỗi lưu đánh giá công ty:', error);
    }

    return { success: true, message: 'Đánh giá của bạn đã được đăng công khai thành công!' };
  };

  const toggleSavedJob = async (payload: {
    jobId: string;
    jobTitle: string;
    jobSalary?: string;
    jobLocation?: string;
  }): Promise<{ success: boolean; isSaved: boolean; message: string }> => {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, isSaved: false, message: 'Vui lòng đăng nhập để lưu công việc.' };
    }

    const existingSavedJob = globalSavedJobs.find(
      (item) => item.userId === user.uid && item.jobId === payload.jobId
    );

    if (existingSavedJob) {
      globalSavedJobs = globalSavedJobs.filter((item) => item.id !== existingSavedJob.id);
      setSavedJobs([...globalSavedJobs]);
      notifyAll();

      try {
        await deleteDoc(doc(db, 'savedJobs', existingSavedJob.id));
      } catch (error) {
        console.error('Lỗi bỏ lưu công việc:', error);
      }

      return { success: true, isSaved: false, message: 'Đã bỏ lưu công việc.' };
    }

    const savedJobId = `${user.uid}_${encodeURIComponent(payload.jobId)}`;
    const newSavedJob: SavedJobItem = {
      id: savedJobId,
      userId: user.uid,
      jobId: payload.jobId,
      jobTitle: payload.jobTitle,
      jobSalary: payload.jobSalary,
      jobLocation: payload.jobLocation,
      savedAt: new Date().toISOString(),
    };

    const sanitizedSavedJob = Object.fromEntries(
      Object.entries(newSavedJob).map(([k, v]) => [k, v === undefined ? '' : v])
    );

    globalSavedJobs = [newSavedJob, ...globalSavedJobs];
    setSavedJobs([...globalSavedJobs]);
    notifyAll();

    try {
      await setDoc(doc(db, 'savedJobs', savedJobId), sanitizedSavedJob);
    } catch (error) {
      console.error('Lỗi lưu công việc:', error);
    }

    return { success: true, isSaved: true, message: 'Đã lưu công việc.' };
  };

  const addViewedJob = async (payload: {
    jobId: string;
    jobTitle: string;
    jobSalary?: string;
    jobLocation?: string;
  }): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;

    const viewedJobId = `${user.uid}_${encodeURIComponent(payload.jobId)}`;
    const viewedAt = new Date().toISOString();
    const viewedJob: ViewedJobItem = {
      id: viewedJobId,
      userId: user.uid,
      jobId: payload.jobId,
      jobTitle: payload.jobTitle,
      jobSalary: payload.jobSalary,
      jobLocation: payload.jobLocation,
      viewedAt,
    };

    globalViewedJobs = [
      viewedJob,
      ...globalViewedJobs.filter((item) => item.id !== viewedJobId),
    ];
    setViewedJobs([...globalViewedJobs]);
    notifyAll();

    try {
      await setDoc(doc(db, 'viewedJobs', viewedJobId), viewedJob);
    } catch (error) {
      console.error('Lỗi lưu lịch sử xem công việc:', error);
    }
  };

  const removeViewedJob = async (
    viewedJobId: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetViewedJob = globalViewedJobs.find((item) => item.id === viewedJobId);
    if (!targetViewedJob) {
      return { success: false, message: 'Không tìm thấy công việc đã xem.' };
    }

    globalViewedJobs = globalViewedJobs.filter((item) => item.id !== viewedJobId);
    setViewedJobs([...globalViewedJobs]);
    notifyAll();

    try {
      await deleteDoc(doc(db, 'viewedJobs', viewedJobId));
    } catch (error) {
      console.error('Lỗi xóa lịch sử xem công việc:', error);
    }

    return { success: true, message: 'Đã xóa khỏi việc làm đã xem.' };
  };

  const sendInvitation = async (candidateId: string, jobId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('http://160.250.246.119:4000/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, jobId })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message || 'Gửi lời mời thành công!' };
      } else {
        return { success: false, message: data.error || 'Không thể gửi lời mời.' };
      }
    } catch (error: any) {
      console.error('Lỗi khi gửi lời mời:', error);
      return { success: false, message: 'Không thể kết nối tới server.' };
    }
  };

  const respondToInvitation = async (invitationId: string, status: 'Accepted' | 'Declined') => {
    const invite = globalInvitations.find(inv => inv.id === invitationId);
    if (!invite) return { success: false, message: 'Không tìm thấy lời mời.' };

    try {
      await updateDoc(doc(db, 'invitations', invitationId), { status });

      globalInvitations = globalInvitations.map(inv => {
        if (inv.id === invitationId) {
          return { ...inv, status };
        }
        return inv;
      });
      setInvitations([...globalInvitations]);
      notifyAll();

      if (status === 'Accepted' && firebaseUser) {
        const appPayload = {
          jobId: invite.jobId,
          jobTitle: invite.jobTitle,
          companyName: invite.companyName,
          applicantName: firebaseUser.displayName || 'Ứng viên',
          applicantPhone: userDataExtra.phone || 'Chưa cập nhật',
          applicantEmail: firebaseUser.email || '',
          message: 'Tôi đồng ý với lời mời làm việc của bạn.',
          cvName: userDataExtra.cvName || 'CV_Ung_Vien.pdf',
          cvSize: userDataExtra.cvSize || '1.2 MB',
          cvUploadTime: userDataExtra.cvUploadTime || new Date().toLocaleDateString('vi-VN'),
        };
        await submitApplication(appPayload);
      }

      if (firebaseUser) {
        const notifTitle = status === 'Accepted' ? 'Lời mời được chấp nhận' : 'Lời mời bị từ chối';
        const notifBody = status === 'Accepted'
          ? `Ứng viên "${firebaseUser.displayName || 'Ứng viên'}" đã chấp nhận lời mời ứng tuyển cho "${invite.jobTitle}".`
          : `Ứng viên "${firebaseUser.displayName || 'Ứng viên'}" đã từ chối lời mời ứng tuyển cho "${invite.jobTitle}".`;

        await addDoc(collection(db, 'notifications'), {
          target: invite.employerId,
          role: 'employer',
          category: 'job',
          title: notifTitle,
          body: notifBody,
          createdAt: serverTimestamp(),
        });
      }

      return { success: true, message: status === 'Accepted' ? 'Đã chấp nhận lời mời làm việc!' : 'Đã từ chối lời mời.' };
    } catch (e: any) {
      console.error('Lỗi khi phản hồi lời mời:', e);
      return { success: false, message: 'Đã xảy ra lỗi: ' + e.message };
    }
  };

  const updateDesiredJob = async (newJob: string) => {
    if (firebaseUser) {
      try {
        // 1. Direct update to Firestore (Instant & Permanent)
        await setDoc(doc(db, 'users', firebaseUser.uid), { desiredJob: newJob }, { merge: true });

        // 2. Sync to Backend API
        try {
          await fetch(`http://160.250.246.119:4000/api/users/${firebaseUser.uid}/job`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job: newJob })
          });
        } catch (apiErr) {
          console.warn('API sync job failed, saved in Firestore:', apiErr);
        }

        globalUserDataExtra = { ...globalUserDataExtra, desiredJob: newJob };
        setUserDataExtra({ ...globalUserDataExtra });
        notifyAll();
      } catch (error) {
        console.error('Lỗi khi cập nhật công việc:', error);
        throw error;
      }
    }
  };

  const updateUserPhone = async (newPhone: string) => {
    if (firebaseUser) {
      try {
        // 1. Direct update to Firestore (Instant & Permanent)
        await setDoc(doc(db, 'users', firebaseUser.uid), { phone: newPhone, phoneNumber: newPhone }, { merge: true });

        // 2. Sync to Backend API
        try {
          await fetch(`http://160.250.246.119:4000/api/users/${firebaseUser.uid}/phone`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: newPhone })
          });
        } catch (apiErr) {
          console.warn('API sync phone failed, saved in Firestore:', apiErr);
        }

        globalUserDataExtra = { ...globalUserDataExtra, phone: newPhone };
        setUserDataExtra({ ...globalUserDataExtra });
        notifyAll();
      } catch (error) {
        console.error('Lỗi khi cập nhật số điện thoại:', error);
        throw error;
      }
    }
  };

  const updateCandidateCV = async (
    cvName: string | null,
    cvSize?: string,
    cvUploadTime?: string,
    cvUrl?: string
  ) => {
    if (firebaseUser) {
      try {
        const response = await fetch(`http://160.250.246.119:4000/api/users/${firebaseUser.uid}/cv`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cvName,
            cvSize,
            cvUploadTime,
            cvUrl
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          let serverErrorMsg = 'Cập nhật thất bại từ Server';
          try {
            const errorObj = JSON.parse(errorText);
            if (errorObj.details) {
              serverErrorMsg = `${errorObj.error} - Chi tiết: ${errorObj.details}`;
            } else {
              serverErrorMsg = errorObj.error || serverErrorMsg;
            }
          } catch (e) { }
          throw new Error(serverErrorMsg);
        }
      } catch (error) {
        console.warn('Lỗi khi cập nhật CV lên server (đang sử dụng chế độ offline/local state):', error);
      }

      globalUserDataExtra = {
        ...globalUserDataExtra,
        cvName: cvName || undefined,
        cvSize: cvName ? cvSize : undefined,
        cvUploadTime: cvName ? cvUploadTime : undefined,
        cvUrl: cvName ? cvUrl : undefined
      };
      setUserDataExtra({ ...globalUserDataExtra });
      notifyAll();
    }
  };

  const updateAvatar = async (base64Image: string, isEmployer: boolean): Promise<{ success: boolean; url?: string; message?: string }> => {
    if (!firebaseUser) return { success: false, message: 'Chưa đăng nhập' };
    try {
      // 1. Upload ảnh lên backend Node.js
      const uploadRes = await fetch('http://160.250.246.119:4000/api/upload-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `avatar_${firebaseUser.uid}.jpg`, base64Data: base64Image })
      });
      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error('Lỗi upload avatar server response:', uploadRes.status, errText);
        throw new Error(`Lỗi upload ảnh lên server: ${errText}`);
      }
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // 2. Lưu URL vào API
      if (isEmployer) {
        const res = await fetch(`http://160.250.246.119:4000/api/employers/${firebaseUser.uid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo: imageUrl, logoUrl: imageUrl, logo_url: imageUrl })
        });
        if (!res.ok) throw new Error('Lỗi lưu logo');

        if (globalEmployerData) {
          globalEmployerData = { ...globalEmployerData, logo: imageUrl, logoUrl: imageUrl, logo_url: imageUrl } as any;
          setEmployerData({ ...globalEmployerData } as EmployerData);
        }
      } else {
        const res = await fetch(`http://160.250.246.119:4000/api/users/${firebaseUser.uid}/avatar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: imageUrl })
        });
        if (!res.ok) throw new Error('Lỗi lưu avatar');

        globalUserDataExtra = { ...globalUserDataExtra, avatar: imageUrl };
        setUserDataExtra(globalUserDataExtra);
      }
      notifyAll();
      return { success: true, url: imageUrl };
    } catch (error: any) {
      console.error('Lỗi updateAvatar:', error);
      return { success: false, message: error.message };
    }
  };

  const updateBanner = async (base64Image: string): Promise<{ success: boolean; url?: string; message?: string }> => {
    if (!firebaseUser) return { success: false, message: 'Chưa đăng nhập' };
    try {
      const uploadRes = await fetch('http://160.250.246.119:4000/api/upload-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `banner_${firebaseUser.uid}.jpg`, base64Data: base64Image })
      });
      if (!uploadRes.ok) {
        throw new Error('Lỗi upload ảnh bìa lên server');
      }
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      await fetch(`http://160.250.246.119:4000/api/employers/${firebaseUser.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverImage: imageUrl, cover_image: imageUrl })
      });

      if (globalEmployerData) {
        globalEmployerData = { ...globalEmployerData, coverImage: imageUrl } as any;
        setEmployerData({ ...globalEmployerData } as EmployerData);
      }
      notifyAll();
      return { success: true, url: imageUrl };
    } catch (error: any) {
      console.error('Lỗi updateBanner:', error);
      return { success: false, message: error.message };
    }
  };

  const disableAccount = async (): Promise<{ success: boolean; message: string }> => {
    if (!firebaseUser) {
      return { success: false, message: 'Bạn chưa đăng nhập.' };
    }
    try {
      const response = await fetch(`http://160.250.246.119:4000/api/users/${firebaseUser.uid}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: true, disabledByUser: true })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: 'Vô hiệu hóa tài khoản thành công.' };
      } else {
        return { success: false, message: data.error || 'Lỗi khi vô hiệu hóa tài khoản.' };
      }
    } catch (error: any) {
      console.error('Lỗi khi gọi API vô hiệu hóa tài khoản:', error);
      return { success: false, message: 'Không thể kết nối đến máy chủ. Chi tiết: ' + error.message };
    }
  };

  const mergedNotifications = firebaseUser
    ? [...notifications, ...mockNotifications]
      .filter((item) => {
        // If explicit role is set, it must strictly match current userRole
        if (item.role) {
          return item.role === userRole;
        }

        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const isJobApprovalNotif = title.includes('bài đăng') || title.includes('phê duyệt') || title.includes('từ chối') || desc.includes('bài đăng');

        if (userRole === 'candidate') {
          // Candidates MUST NOT see job approval notifications from admin
          if (isJobApprovalNotif || item.target === 'RECRUITER') return false;
        }

        if (userRole === 'employer') {
          if (item.target === 'USER') return false;
          if (isJobApprovalNotif) return true;
        }

        // Target check
        if (item.target === 'ALL') return true;
        if (item.target === 'RECRUITER') return userRole === 'employer';
        if (item.target === 'USER') return userRole === 'candidate';

        // Direct target match to user UID
        if (item.target === firebaseUser.uid) {
          if (isJobApprovalNotif) return userRole === 'employer';
          return true;
        }

        if (userRole === 'employer') {
          return false;
        }

        return item.target === 'candidate-1' || item.target === 'candidate-2';
      })
      .filter((item) => !deletedNotificationIds.includes(item.id))
      .map((item) => ({
        ...item,
        isRead: readIds.includes(item.id) || !!item.isRead,
      }))
    : [];

  const unreadNotificationsCount = mergedNotifications.filter((n) => !n.isRead).length;

  const markAllNotificationsAsRead = async () => {
    globalReadIds = mergedNotifications.map((n) => n.id);
    setReadIds(globalReadIds);
    notifyAll();
    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          readNotificationIds: globalReadIds
        }, { merge: true });
      } catch (e) {
        console.error('Lỗi khi lưu readIds vào Firestore:', e);
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!globalReadIds.includes(id)) {
      globalReadIds = [...globalReadIds, id];
      setReadIds(globalReadIds);
      notifyAll();
      if (firebaseUser) {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            readNotificationIds: globalReadIds
          }, { merge: true });
        } catch (e) {
          console.error('Lỗi khi lưu readIds vào Firestore:', e);
        }
      }
    }
  };

  const deleteNotification = async (id: string) => {
    if (!globalDeletedNotificationIds.includes(id)) {
      globalDeletedNotificationIds = [...globalDeletedNotificationIds, id];
      setDeletedNotificationIds(globalDeletedNotificationIds);
      if (!globalReadIds.includes(id)) {
        globalReadIds = [...globalReadIds, id];
        setReadIds(globalReadIds);
      }
      notifyAll();

      if (firebaseUser) {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            deletedNotificationIds: globalDeletedNotificationIds,
            readNotificationIds: globalReadIds,
          }, { merge: true });
        } catch (e) {
          console.error('Lỗi khi lưu thông báo đã xóa vào Firestore:', e);
        }
      }
    }
  };

  const switchRole = (role: UserRole) => {
    globalUserRole = role;
    setUserRole(role);
    notifyAll();
  };

  return {
    firebaseUser,
    isLoggedIn: !!firebaseUser,
    isInitializing,
    userRole,
    seqId, // Mã USER ID tuần tự 6 chữ số
    userData: firebaseUser ? {
      uid: firebaseUser.uid,
      emailOrPhone: firebaseUser.email || '',
      fullName: firebaseUser.displayName || 'Người dùng',
      isVerified: firebaseUser.emailVerified,
      desiredJob: userDataExtra.desiredJob,
      phone: userDataExtra.phone,
      cvName: userDataExtra.cvName,
      cvSize: userDataExtra.cvSize,
      cvUploadTime: userDataExtra.cvUploadTime,
      cvUrl: userDataExtra.cvUrl,
      avatar: userDataExtra.avatar || firebaseUser.photoURL || undefined
    } : null,
    userDataExtra,
    employerData,
    jobs,
    orders,
    candidates,
    applications,
    savedJobs,
    viewedJobs,
    submitApplication,
    cancelApplication,
    updateApplicationFeedback,
    toggleSavedJob,
    addViewedJob,
    removeViewedJob,
    addJob,
    updateJob,
    deleteJob,
    updateApplicationStatus,
    invitations,
    sendInvitation,
    respondToInvitation,
    updateDesiredJob,
    updateUserPhone,
    updateCandidateCV,
    updateAvatar,
    updateBanner,
    notifications: mergedNotifications,
    unreadNotificationsCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    deleteNotification,
    activeToast,
    dismissToast: () => {
      globalActiveToast = null;
      notifyAll();
    },
    login,
    loginWithGoogle,
    loginWithGoogleRealWeb,
    signup,
    changePassword,
    resetPassword,
    confirmResetPassword,
    sendOtp,
    verifyAccount,
    registerEmployer,
    updateCompany,
    upgradePackage: updatePackage,
    createOrder,
    logout,
    switchRole,
    disableAccount,
    getEmployerPackageTier: (overrideData?: any) => getEmployerPackageTier(overrideData || employerData),
  };
}

