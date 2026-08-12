import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  initialUsers, 
  initialEmployers, 
  initialJobPosts, 
  initialPackages, 
  initialIndustries, 
  initialReports, 
  initialReviews,
  initialPaymentMethods
} from '../data/mockData';

interface DataContextType {
  users: any[];
  setUsers: (users: any[]) => void;
  employers: any[];
  setEmployers: (employers: any[]) => void;
  jobPosts: any[];
  setJobPosts: (jobPosts: any[]) => void;
  packages: any[];
  setPackages: (packages: any[]) => void;
  industries: any[];
  setIndustries: (industries: any[]) => void;
  reports: any[];
  setReports: (reports: any[]) => void;
  reviews: any[];
  setReviews: (reviews: any[]) => void;
  paymentMethods: any[];
  setPaymentMethods: (paymentMethods: any[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getItemTime = (item: any) => {
  const value = item?.createdAt || item?.created_at || item?.createdAtISO || item?.date || item?.updatedAt || item?.updated_at;
  if (!value) return 0;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'object' && typeof value._seconds === 'number') return value._seconds * 1000;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value.includes('/')) {
      const parts = value.split(' ')[0].split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        return new Date(year, month - 1, day).getTime();
      }
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const sortNewestFirst = (items: any[]) => [...items].sort((a, b) => getItemTime(b) - getItemTime(a));

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Version check: khi cập nhật mock data, tăng version để force refresh localStorage
  const DATA_VERSION = '2026-08-09-v3';
  const storedVersion = localStorage.getItem('bybitjobs_data_version');
  if (storedVersion !== DATA_VERSION) {
    // Xóa tất cả dữ liệu cũ để load lại từ mock data mới
    localStorage.removeItem('bybitjobs_users');
    localStorage.removeItem('bybitjobs_employers');
    localStorage.removeItem('bybitjobs_jobPosts');
    localStorage.removeItem('bybitjobs_packages');
    localStorage.removeItem('bybitjobs_industries');
    localStorage.removeItem('bybitjobs_reports');
    localStorage.removeItem('bybitjobs_reviews');
    localStorage.removeItem('bybitjobs_paymentMethods');
    localStorage.setItem('bybitjobs_data_version', DATA_VERSION);
  }

  const loadData = (key: string, initialData: any[]) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load data from localStorage', e);
    }
    return initialData;
  };

  const [users, setUsersState] = useState<any[]>([]);
  const [employers, setEmployersState] = useState<any[]>([]);
  const [jobPosts, setJobPostsState] = useState<any[]>([]);
  const [packages, setPackagesState] = useState<any[]>([]);
  const [industries, setIndustriesState] = useState(() => loadData('bybitjobs_industries', initialIndustries));
  const [reports, setReportsState] = useState<any[]>([]);
  const [reviews, setReviewsState] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethodsState] = useState(() => loadData('bybitjobs_paymentMethods', initialPaymentMethods));

  const apiHost = '160.250.246.119';

  // Load Real Users & Employers from API
  useEffect(() => {
    const fetchRealUsers = () => {
      fetch(`http://${apiHost}:4000/api/users`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setUsersState(sortNewestFirst(data));
          }
        })
        .catch((err) => console.log('Lỗi fetch users API:', err));
    };

    fetchRealUsers();

    // 1. Employers
    const unsubEmployers = onSnapshot(collection(db, 'employers'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        data.push({
          id: docSnap.id,
          user_id: docSnap.id,
          company: item.companyName || item.company_name || item.company || 'Doanh nghiệp',
          company_name: item.companyName || item.company_name || item.company || 'Doanh nghiệp',
          email: item.email || '',
          phone: item.phoneNumber || item.phone || '',
          address: item.address || '',
          industry: item.industry || 'Khác',
          status: item.status || 'Chờ duyệt',
          logo: item.logo_url || item.logo || '',
          createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt || Date.now())
        });
      });
      if (data.length > 0) {
        setEmployersState(sortNewestFirst(data));
      }
    });

    // 2. Packages
    const unsubPackages = onSnapshot(collection(db, 'packages'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(d => data.push(d.data()));
      
      const hasFree = data.some(p => p.id === 'free' || (p.priceNum === 0 && p.posts?.includes('5')));
      const hasPro = data.some(p => p.id === 'pro' || p.priceNum === 299000);
      const hasPremium = data.some(p => p.id === 'premium' || p.priceNum === 799000);

      if (data.length === 0 || !hasFree || !hasPro || !hasPremium) {
        initialPackages.forEach(async (pkg) => {
          await setDoc(doc(db, 'packages', pkg.id), pkg, { merge: true });
        });
        setPackagesState(initialPackages);
      } else {
        setPackagesState(data);
      }
    });

    // 2.5 Industries
    const unsubIndustries = onSnapshot(collection(db, 'industries'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(d => data.push(d.data()));
      if (data.length === 0) {
        initialIndustries.forEach(async (ind) => {
          await setDoc(doc(db, 'industries', ind.id), ind);
        });
        setIndustriesState(initialIndustries);
      } else {
        setIndustriesState(data);
      }
    });

    // Helper to safely parse dates from Firestore Timestamp, object, number, string, or Date
    const parseSafeDate = (val: any): Date => {
      if (!val) return new Date();
      if (typeof val?.toDate === 'function') {
        try { return val.toDate(); } catch (e) {}
      }
      if (typeof val?.seconds === 'number') {
        return new Date(val.seconds * 1000);
      }
      if (val instanceof Date) return val;
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    // 3. Job Posts (Jobs collection in Firestore)
    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        const dateObj = parseSafeDate(item.createdAt);
        const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        
        data.push({
          id: docSnap.id,
          title: item.title || 'Không có tiêu đề',
          type: `${item.workType || 'Bán thời gian'} • ${item.location || 'Toàn quốc'}`,
          company: item.companyName || 'Doanh nghiệp',
          companyStatus: item.employerId ? `ID: ${item.employerId.slice(0, 8)}...` : 'Chờ duyệt',
          date: formattedDate,
          createdAt: dateObj,
          status: item.status || 'Chờ duyệt',
          employerId: item.employerId || '',
          salary: item.salary || 'Chưa cập nhật',
          location: item.location || 'Toàn quốc',
          industry: item.industry || item.category || 'Chưa cập nhật',
          deadline: item.deadline || 'Chưa cập nhật',
          description: item.description || 'Chưa có mô tả.',
          requirements: item.requirements || 'Chưa có yêu cầu.',
          isOpen: item.isOpen !== false,
          posterName: item.posterName || item.companyName || 'Doanh nghiệp',
          posterEmail: item.posterEmail || ''
        });
      });
      setJobPostsState(sortNewestFirst(data));
    });

    // 4. Reports
    const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        data.push({
          id: docSnap.id,
          user: item.reporterName || item.reporterEmail || 'Người dùng ẩn danh',
          target: item.targetName || item.jobTitle || 'Tin đăng / Công ty',
          reason: item.reason || item.desc || 'Báo cáo vi phạm',
          date: parseSafeDate(item.createdAt),
          status: item.status === 'accepted' ? 'Đã xử lý' : (item.status === 'rejected' ? 'Bác bỏ' : 'Chờ xử lý')
        });
      });
      setReportsState(data);
    });

    // 5. Reviews (applications collection with feedback)
    const unsubReviews = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        if (Number(item.companyRating || 0) > 0 || (item.companyComment && item.companyComment.trim().length > 0)) {
          data.push({
            id: docSnap.id,
            user: item.applicantName || item.candidateName || 'Người dùng ẩn danh',
            company: item.companyName || 'Doanh nghiệp',
            rating: Number(item.companyRating || 0),
            comment: item.companyComment || '',
            date: item.reviewedAt ? new Date(item.reviewedAt) : (item.appliedAt ? new Date(item.appliedAt) : new Date()),
            status: item.reviewStatus === 'Đã phê duyệt' ? 'Đã duyệt' : (item.reviewStatus === 'Bị báo cáo' ? 'Bị báo cáo' : 'Chờ duyệt')
          });
        }
      });
      setReviewsState(data);
    });

    return () => {
      unsubEmployers();
      unsubPackages();
      unsubIndustries();
      unsubJobs();
      unsubReports();
      unsubReviews();
    };
  }, []);

  const setUsers = (data: any[]) => { setUsersState(data); };
  const setEmployers = (data: any[]) => { setEmployersState(data); };
  const setJobPosts = (data: any[]) => { setJobPostsState(data); };
  const setPackages = async (data: any[]) => {
    setPackagesState(data);
    try {
      const batch = data.map(async (pkg) => {
        await setDoc(doc(db, 'packages', pkg.id), pkg);
      });
      await Promise.all(batch);
    } catch (e) {
      console.error('Error syncing packages to Firestore', e);
    }
  };

  const setIndustries = async (data: any[]) => {
    const oldIds = industries.map((i: any) => i.id);
    const newIds = data.map((i: any) => i.id);
    const deletedIds = oldIds.filter(id => !newIds.includes(id));
    
    setIndustriesState(data);
    try {
      const batch = data.map(async (ind) => {
        await setDoc(doc(db, 'industries', ind.id), ind);
      });
      const deletes = deletedIds.map(async (id) => {
        await deleteDoc(doc(db, 'industries', id));
      });
      await Promise.all([...batch, ...deletes]);
    } catch (e) {
      console.error('Error syncing industries to Firestore', e);
    }
  };
  const setReports = (data: any[]) => { setReportsState(data); };
  const setReviews = (data: any[]) => { setReviewsState(data); };
  const setPaymentMethods = (data: any[]) => { setPaymentMethodsState(data); localStorage.setItem('bybitjobs_paymentMethods', JSON.stringify(data)); };

  return (
    <DataContext.Provider value={{
      users, setUsers,
      employers, setEmployers,
      jobPosts, setJobPosts,
      packages, setPackages,
      industries, setIndustries,
      reports, setReports,
      reviews, setReviews,
      paymentMethods, setPaymentMethods
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
