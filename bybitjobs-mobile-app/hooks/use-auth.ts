import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { auth, db } from '../src/config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  reload,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, orderBy, where } from 'firebase/firestore';

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
  coverImage?: string;
  status?: string;
  postsLimit?: string;
}

export interface UserData {
  emailOrPhone: string;
  fullName?: string;
  isVerified?: boolean;
  desiredJob?: string;
}

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
}

export interface CandidateItem {
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

let globalJobs: JobItem[] = [];
let globalJobsUnsubscribe: (() => void) | null = null;

const initJobsListener = () => {
  if (globalJobsUnsubscribe) return;
  const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
  globalJobsUnsubscribe = onSnapshot(q, (snapshot) => {
    globalJobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as JobItem[];
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

const mockNotifications = [
  {
    id: 'mock-1',
    category: 'job',
    title: 'Nhà tuyển dụng đã xem hồ sơ',
    description: 'Công ty Bybit Việt Nam đã xem CV_Web_Developer_VN.pdf của bạn.',
    time: '3 phút trước',
    isRead: false,
  },
  {
    id: 'mock-3',
    category: 'job',
    title: 'Tin tuyển dụng phù hợp mới',
    description: 'Việc làm "Senior React Native Developer - Bybit" đang tìm ứng viên phù hợp với bạn.',
    time: '1 giờ trước',
    isRead: false,
  },
  {
    id: 'mock-4',
    category: 'community',
    title: 'Lượt tương tác mới trong Cộng đồng',
    description: 'Nguyễn Văn A và 5 người khác đã thích bài viết chia sẻ kinh nghiệm phỏng vấn của bạn.',
    time: 'Hôm qua',
    isRead: true,
  },
  {
    id: 'mock-5',
    category: 'system',
    title: 'Chào mừng bạn đến với BybitJobs',
    description: 'Khám phá ngay hàng ngàn công việc chất lượng và tạo CV chuyên nghiệp miễn phí.',
    time: '2 ngày trước',
    isRead: true,
  },
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
  const [userDataExtra, setUserDataExtra] = React.useState<{ desiredJob?: string; phone?: string }>({});
  
  const [notifications, setNotifications] = React.useState<any[]>(globalNotifications);
  const [readIds, setReadIds] = React.useState<string[]>(globalReadIds);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        if (!globalUserRole) globalUserRole = 'candidate';
        // Tự động lấy USER ID tuần tự động từ server VPS
        try {
          const response = await fetch(`http://160.250.246.119:4000/api/users/${user.uid}/seq`);
          if (response.ok) {
            const data = await response.json();
            setSeqId(data.seqId);
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
              setUserDataExtra({ desiredJob: data.job, phone: data.phone });
            }
          } catch (err) {
            console.error('Lỗi lấy thông tin user:', err);
          }
        };
        fetchUserData();

        // Fetch notifications from Firestore realtime
        if (globalNotificationsUnsubscribe) globalNotificationsUnsubscribe();
        const qNotifications = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
        globalNotificationsUnsubscribe = onSnapshot(qNotifications, (snapshot) => {
          const dbItems = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              const date = data.createdAt ? data.createdAt.toDate() : new Date();
              return {
                id: doc.id,
                category: (data.target === 'ALL' ? 'system' : 'security') as any,
                title: data.title || '',
                description: data.body || '',
                time: getRelativeTimeLabel(date),
                isRead: false,
                target: data.target || 'ALL',
              };
            })
            .filter((item) => item.target === 'ALL' || item.target === user.uid);
          globalNotifications = dbItems;
          setNotifications(dbItems);
          notifyAll();
        }, (error) => {
          console.error('Error fetching mobile notifications realtime:', error);
        });

        if (globalApplicationsUnsubscribe) globalApplicationsUnsubscribe();
        const qApplications = query(
          collection(db, 'applications'),
          where('candidateId', '==', user.uid)
        );
        globalApplicationsUnsubscribe = onSnapshot(qApplications, (snapshot) => {
          const userApplications = (snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ApplicationItem[]).sort(
            (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          );
          globalApplications = [
            ...globalApplications.filter((app) => app.candidateId !== user.uid),
            ...userApplications,
          ];
          setApplications([...globalApplications]);
          notifyAll();
        }, (error) => {
          console.error('Lỗi tải danh sách việc đã ứng tuyển:', error);
        });

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
            const empResponse = await fetch(`http://160.250.246.119:4000/api/employers/${user.uid}`);
            if (empResponse.ok) {
              const empData = await empResponse.json();
              globalEmployerData = {
                id: empData.id || empData.user_id,
                companyName: empData.company_name || empData.company || '',
                taxId: empData.tax_code || empData.taxId || '',
                phoneNumber: empData.phone || empData.phoneNumber || '',
                address: empData.address,
                servicePackage: 'Free',
                currentPackage: empData.current_package || 'basic',
                status: empData.status || 'Chờ duyệt',
                industry: empData.industry || 'Khác',
                scale: empData.scale || '1-10 nhân viên',
                description: empData.description || 'Chưa có mô tả',
                logo: empData.logo_url || null,
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
                    setEmployerData({...globalEmployerData});
                  }
                  setOrders([...globalOrders]);
                  notifyAll();
                }, (error) => {
                  console.error('Lỗi tải danh sách đơn hàng:', error);
                });
              }
              
              // Không tự động đổi vai trò sang employer để người dùng luôn ở giao diện ứng viên lúc mới vào
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

          // Dừng polling nếu đã được duyệt
          if (globalEmployerData?.status === 'Xác thực' && pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        };

        fetchEmployerData();
        
        // Polling 3 giây / lần để tránh lỗi Security Rules của Firestore Client
        pollingInterval = setInterval(() => {
          if (!globalEmployerData || globalEmployerData.status === 'Chờ duyệt') {
            fetchEmployerData();
          }
        }, 3000);

        // Lưu hàm cleanup
        globalEmployerUnsubscribe = () => {
          if (pollingInterval) clearInterval(pollingInterval);
        };
      } else {
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
        globalNotifications = [];
        globalReadIds = [];
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
        setNotifications([]);
        setReadIds([]);
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
      setNotifications([...globalNotifications]);
      setReadIds([...globalReadIds]);
    };
    listeners.add(handleMockDataChange);

    return () => {
      unsubscribe();
      listeners.delete(handleMockDataChange);
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
            const title = err.code === 'auth/user-disabled' ? 'Tài khoản bị khóa' : 'Tài khoản không tồn tại';
            const msg = err.code === 'auth/user-disabled' 
              ? 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ ban quản trị để được hỗ trợ.'
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
        msg = 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ ban quản trị để được hỗ trợ.';
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
          setSeqId(data.seqId);
        }
      } catch (err) {}
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
      if (!user) return { success: false, message: 'Chưa đăng nhập.' };
      
      const response = await fetch(`http://160.250.246.119:4000/api/users/${user.uid}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const result = await response.json();
      
      return { success: response.ok, message: result.message || result.error || 'Lỗi gửi OTP.' };
    } catch (error: any) {
      console.error('Lỗi gọi API sendOtp:', error);
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

        const response = await fetch(`http://160.250.246.119:4000/api/employers/${user.uid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          globalEmployerData = { ...globalEmployerData, ...data };
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
      if (globalEmployerData && globalEmployerData.postsLimit) {
        const [usedStr, limitStr] = globalEmployerData.postsLimit.split('/');
        const used = parseInt(usedStr, 10) || 0;
        const limit = parseInt(limitStr, 10) || 0;
        
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
        const newPostsLimit = `${used + 1}/${limit}`;
        globalEmployerData.postsLimit = newPostsLimit;
        if (auth.currentUser) {
          await updateDoc(doc(db, 'employers', auth.currentUser.uid), { postsLimit: newPostsLimit });
        }
      }

      const jobId = `job-${Date.now()}`;
      const newJob = {
        ...job,
        id: jobId,
        createdAt: new Date().toISOString(),
        employerId: auth.currentUser?.uid || '',
        posterName: auth.currentUser?.displayName || globalEmployerData?.companyName || 'Nhà tuyển dụng',
        posterEmail: auth.currentUser?.email || ''
      };
      await setDoc(doc(db, 'jobs', jobId), newJob);
      return true;
    } catch (error) {
      console.error('Lỗi khi thêm việc làm:', error);
      Alert.alert('Lỗi', 'Không thể đăng tin lúc này.');
      return false;
    }
  };

  const updateJob = async (id: string, updatedFields: Partial<JobItem>) => {
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

  const updateApplicationStatus = (appId: string, status: 'Pending' | 'Approved' | 'Rejected') => {
    globalApplications = globalApplications.map((app) => {
      if (app.id === appId) {
        // Unlock contact info for the candidate if Approved
        if (status === 'Approved') {
          globalCandidates = globalCandidates.map((c) => {
            if (c.id === app.candidateId) {
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
        return { ...app, status };
      }
      return app;
    });
    notifyAll();
  };

  const submitApplication = async (payload: SubmitApplicationPayload): Promise<{ success: boolean; message: string }> => {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, message: 'Vui lòng đăng nhập để ứng tuyển.' };
    }

    const jobId = payload.jobId || `job-${payload.jobTitle.trim().toLowerCase().replace(/\s+/g, '-')}`;
    const hasApplied = globalApplications.some(
      (app) => app.candidateId === user.uid && app.jobId === jobId
    );

    if (hasApplied) {
      return { success: false, message: 'Bạn đã ứng tuyển công việc này rồi.' };
    }

    const newApplication: ApplicationItem = {
      id: `app-${Date.now()}`,
      candidateId: user.uid,
      jobId,
      jobTitle: payload.jobTitle,
      companyName: payload.companyName,
      jobSalary: payload.jobSalary,
      jobLocation: payload.jobLocation,
      applicantName: payload.applicantName,
      applicantPhone: payload.applicantPhone,
      applicantEmail: payload.applicantEmail,
      message: payload.message,
      status: 'Pending',
      appliedAt: new Date().toISOString(),
    };

    globalApplications = [newApplication, ...globalApplications];
    try {
      await setDoc(doc(db, 'applications', newApplication.id), newApplication);
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
          reviewStatus: 'Chờ duyệt',
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
        reviewStatus: 'Chờ duyệt',
      });
    } catch (error) {
      console.error('Lỗi lưu đánh giá công ty:', error);
    }

    return { success: true, message: 'Bạn đã đánh giá thành công.' };
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

    globalSavedJobs = [newSavedJob, ...globalSavedJobs];
    setSavedJobs([...globalSavedJobs]);
    notifyAll();

    try {
      await setDoc(doc(db, 'savedJobs', savedJobId), newSavedJob);
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

  const sendInvitation = (candidateId: string, jobId: string) => {
    const targetCandidate = globalCandidates.find((c) => c.id === candidateId);
    const targetJob = globalJobs.find((j) => j.id === jobId);
    if (targetCandidate && targetJob) {
      Alert.alert(
        'Đã gửi lời mời',
        `Đã gửi lời mời ứng tuyển công việc "${targetJob.title}" đến ứng viên "${targetCandidate.name}" thành công!`
      );
    }
  };

  const updateDesiredJob = async (newJob: string) => {
    if (firebaseUser) {
      try {
        const response = await fetch(`http://160.250.246.119:4000/api/users/${firebaseUser.uid}/job`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job: newJob })
        });
        if (!response.ok) {
          throw new Error('Cập nhật thất bại từ Server');
        }
        setUserDataExtra(prev => ({ ...prev, desiredJob: newJob }));
      } catch (error) {
        console.error('Lỗi khi cập nhật công việc:', error);
        throw error;
      }
    }
  };

  const updateUserPhone = async (newPhone: string) => {
    if (firebaseUser) {
      try {
        const response = await fetch(`http://160.250.246.119:4000/api/users/${firebaseUser.uid}/phone`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: newPhone })
        });
        if (!response.ok) {
          throw new Error('Cập nhật thất bại từ Server');
        }
        setUserDataExtra(prev => ({ ...prev, phone: newPhone }));
      } catch (error) {
        console.error('Lỗi khi cập nhật số điện thoại:', error);
        throw error;
      }
    }
  };

  const mergedNotifications = firebaseUser
    ? [...notifications, ...mockNotifications].map((item) => ({
        ...item,
        isRead: readIds.includes(item.id) || item.isRead
      }))
    : [];

  const unreadNotificationsCount = mergedNotifications.filter((n) => !n.isRead).length;

  const markAllNotificationsAsRead = () => {
    globalReadIds = mergedNotifications.map((n) => n.id);
    setReadIds(globalReadIds);
    notifyAll();
  };

  const markNotificationAsRead = (id: string) => {
    if (!globalReadIds.includes(id)) {
      globalReadIds = [...globalReadIds, id];
      setReadIds(globalReadIds);
      notifyAll();
    }
  };

  const switchRole = (role: UserRole) => {
    globalUserRole = role;
    setUserRole(role);
    notifyAll();
  };

  return {
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
      phone: userDataExtra.phone
    } : null,
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
    sendInvitation,
    updateDesiredJob,
    updateUserPhone,
    notifications: mergedNotifications,
    unreadNotificationsCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    login,
    signup,
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
  };
}
