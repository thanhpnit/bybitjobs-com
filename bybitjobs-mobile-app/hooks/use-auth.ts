import React from 'react';
import { Alert } from 'react-native';
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
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export type UserRole = 'candidate' | 'employer' | null;

export interface BranchItem {
  id: string;
  name: string;
  address: string;
}

export interface EmployerData {
  companyName: string;
  taxId: string;
  phoneNumber: string;
  address: string;
  servicePackage: 'Free' | 'Gold' | 'Diamond';
  website?: string;
  email?: string;
  industry?: string;
  scale?: string;
  description?: string;
  branches?: BranchItem[];
  logo?: string;
  coverImage?: string;
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
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
}

// Giữ lại trạng thái mock cho Employer Data vì Firebase Auth không lưu phần này
// Trong thực tế, dữ liệu này sẽ được lưu ở Firestore hoặc Node.js MongoDB Backend
let globalEmployerData: EmployerData | null = null;
let globalUserRole: UserRole = null;
const listeners = new Set<() => void>();
const notifyAll = () => listeners.forEach((l) => l());

let globalJobs: JobItem[] = [
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

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(auth.currentUser);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [seqId, setSeqId] = React.useState<string>('000000');
  
  const [userRole, setUserRole] = React.useState<UserRole>(globalUserRole);
  const [employerData, setEmployerData] = React.useState<EmployerData | null>(globalEmployerData);
  
  const [jobs, setJobs] = React.useState<JobItem[]>(globalJobs);
  const [candidates, setCandidates] = React.useState<CandidateItem[]>(globalCandidates);
  const [applications, setApplications] = React.useState<ApplicationItem[]>(globalApplications);
  const [userDataExtra, setUserDataExtra] = React.useState<{ desiredJob?: string }>({});

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
              setUserDataExtra({ desiredJob: data.job });
            }
          } catch (err) {
            console.error('Lỗi lấy thông tin user:', err);
          }
        };
        fetchUserData();
      } else {
        globalUserRole = null;
        globalEmployerData = null;
        setSeqId('000000');
        setUserDataExtra({});
      }
      setUserRole(globalUserRole);
      setEmployerData(globalEmployerData);
      setIsInitializing(false);
    });

    const handleMockDataChange = () => {
      setUserRole(globalUserRole);
      setEmployerData(globalEmployerData);
      setJobs([...globalJobs]);
      setCandidates([...globalCandidates]);
      setApplications([...globalApplications]);
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
      intervalId = setInterval(checkStatus, 5000);
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

  const registerEmployer = (data: Omit<EmployerData, 'servicePackage'>) => {
    globalUserRole = 'employer';
    globalEmployerData = { ...data, servicePackage: 'Free' };
    notifyAll();
  };

  const updateCompany = (data: Partial<EmployerData>) => {
    if (globalEmployerData) {
      globalEmployerData = { ...globalEmployerData, ...data };
      notifyAll();
    }
  };

  const updatePackage = (packageName: 'Free' | 'Gold' | 'Diamond') => {
    if (globalEmployerData) {
      globalEmployerData.servicePackage = packageName;
      notifyAll();
    }
  };

  const addJob = (job: Omit<JobItem, 'id' | 'createdAt'>) => {
    const newJob: JobItem = {
      ...job,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    globalJobs = [newJob, ...globalJobs];
    notifyAll();
  };

  const updateJob = (id: string, updatedFields: Partial<JobItem>) => {
    globalJobs = globalJobs.map((j) => (j.id === id ? { ...j, ...updatedFields } : j));
    notifyAll();
  };

  const deleteJob = (id: string) => {
    globalJobs = globalJobs.filter((j) => j.id !== id);
    notifyAll();
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
      desiredJob: userDataExtra.desiredJob
    } : null,
    employerData,
    jobs,
    candidates,
    applications,
    addJob,
    updateJob,
    deleteJob,
    updateApplicationStatus,
    sendInvitation,
    updateDesiredJob,
    login,
    signup,
    sendOtp,
    verifyAccount,
    registerEmployer,
    updateCompany,
    upgradePackage: updatePackage,
    updateDesiredJob,
    logout,
  };
}
