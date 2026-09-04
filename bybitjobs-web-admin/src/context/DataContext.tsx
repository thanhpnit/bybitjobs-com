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
  initialPaymentMethods,
  initialSkills
} from '../data/mockData';
import { getDeterministicMockTransactions, UnifiedTransaction } from '../utils/transactionUtils';

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
  skills: any[];
  setSkills: (skills: any[]) => void;
  transactions: UnifiedTransaction[];
  setTransactions: (transactions: UnifiedTransaction[]) => void;
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
  const [skills, setSkillsState] = useState<any[]>([]);
  const [transactions, setTransactionsState] = useState<UnifiedTransaction[]>(() => getDeterministicMockTransactions());

  const apiHost = import.meta.env.VITE_API_URL || 'http://160.250.246.119:4000';

  useEffect(() => {
    fetch(`${apiHost}/api/orders`)
      .then(res => res.json())
      .then(data => {
        const mockList = getDeterministicMockTransactions();
        let mapped: UnifiedTransaction[] = [];
        if (Array.isArray(data)) {
          mapped = data.map((item: any) => {
            let dateObj = new Date(item.createdAt || item.created_at || Date.now());
            if (isNaN(dateObj.getTime())) {
              dateObj = new Date();
            }
            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear();
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const mins = dateObj.getMinutes().toString().padStart(2, '0');
            const dateStr = `${day}/${month}/${year} ${hours}:${mins}`;

            let finalStatus: 'Completed' | 'Pending' | 'Failed' = item.status === 'success' ? 'Completed' : (item.status === 'pending' ? 'Pending' : 'Failed');
            if (item.status === 'pending') {
              const isExpired = Date.now() - dateObj.getTime() > 10 * 60 * 1000;
              if (isExpired) finalStatus = 'Failed';
            }

            const isSuccess = finalStatus === 'Completed';

            return {
              id: `#TXN-${item.orderCode}`,
              orderCode: item.orderCode,
              date: dateStr,
              rawDate: dateObj,
              company: item.companyName || 'Không xác định',
              name: item.companyName || 'Không xác định',
              package: (item.packageName || 'Gói dịch vụ').toUpperCase(),
              packageName: (item.packageName || 'Gói dịch vụ').toUpperCase(),
              amount: `${Number(item.price || 0).toLocaleString('vi-VN')} đ`,
              rawPrice: Number(item.price || 0),
              rawAmount: Number(item.price || 0),
              method: 'PayOS',
              time: `${hours}:${mins} ${day}/${month}/${year}`,
              status: finalStatus,
              statusType: isSuccess ? 'success' : (finalStatus === 'Pending' ? 'warning' : 'danger'),
              color: item.packageId === 'premium' ? '#D97706' : (item.packageId === 'diamond' ? '#0066FF' : '#6B7280'),
              bg: item.packageId === 'premium' ? '#FEF3C7' : (item.packageId === 'diamond' ? '#E6F0FF' : '#F3F4F6')
            };
          });
        }

        const combined = [...mapped, ...mockList];
        combined.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        setTransactionsState(combined);
      })
      .catch(err => console.log('Lỗi fetch orders API:', err));
  }, [apiHost]);

  const setTransactions = (newTransactions: UnifiedTransaction[]) => {
    setTransactionsState(newTransactions);
  };

  // Load Real Users & Employers from API
  useEffect(() => {
    const fetchRealUsers = () => {
      fetch(`${apiHost}/api/users`)
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
          package: item.package || item.packageId || item.packageName || item.tier || 'free',
          packageId: item.packageId || item.package || item.tier || 'free',
          packageName: item.packageName || item.package || item.tier || '',
          packageExpiry: item.packageExpiry || item.expiryDate || item.expiredAt || '',
          isVip: item.isVip || (item.package || '').toLowerCase().includes('premium'),
          isPro: item.isPro || (item.package || '').toLowerCase().includes('pro'),
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
      snapshot.forEach(d => {
        data.push({ id: d.id, ...d.data() });
      });

      if (data.length === 0) {
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

    // 4. Reports (Collection 'reports' trong Firestore)
    const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        data.push({
          id: docSnap.id,
          user: item.reporterName || item.reporterEmail || item.user || 'Người dùng ẩn danh',
          target: item.targetName || item.target || item.jobTitle || 'Tin đăng / Công ty',
          reason: item.reason || item.desc || 'Báo cáo vi phạm',
          date: parseSafeDate(item.createdAt || item.date),
          status: item.status || 'Chờ xử lý'
        });
      });
      setReportsState(sortNewestFirst(data));
    });

    // 5. Reviews (Collection 'reviews' trong Firestore)
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        data.push({
          id: docSnap.id,
          user: item.userName || item.user || item.applicantName || 'Người dùng ẩn danh',
          company: item.companyName || item.company || 'Doanh nghiệp',
          rating: Number(item.rating || item.companyRating || 5),
          comment: item.comment || item.companyComment || '',
          date: parseSafeDate(item.createdAt || item.date || item.reviewedAt),
          status: item.status || 'Chờ duyệt'
        });
      });
      setReviewsState(sortNewestFirst(data));
    });

    // 6. Payment Methods
    const unsubPaymentMethods = onSnapshot(collection(db, 'paymentMethods'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (data.length === 0) {
        initialPaymentMethods.forEach(async (pm) => {
          await setDoc(doc(db, 'paymentMethods', pm.id), pm);
        });
        setPaymentMethodsState(initialPaymentMethods);
      } else {
        setPaymentMethodsState(data);
      }
    });

    // 7. Skills
    const unsubSkills = onSnapshot(collection(db, 'skills'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (data.length === 0) {
        initialSkills.forEach(async (sk) => {
          await setDoc(doc(db, 'skills', sk.id), sk);
        });
        setSkillsState(initialSkills);
      } else {
        setSkillsState(data);
      }
    });

    return () => {
      unsubEmployers();
      unsubPackages();
      unsubIndustries();
      unsubJobs();
      unsubReports();
      unsubReviews();
      unsubPaymentMethods();
      unsubSkills();
    };
  }, []);

  const setUsers = (data: any[]) => { setUsersState(data); };
  const setEmployers = (data: any[]) => { setEmployersState(data); };
  const setJobPosts = (data: any[]) => { setJobPostsState(data); };
  const setPackages = async (data: any[]) => {
    setPackagesState(data);
    try {
      const batch = data.map(async (pkg) => {
        const pkgId = pkg.id;
        if (pkgId) {
          await setDoc(doc(db, 'packages', pkgId), pkg, { merge: true });
        }
      });
      await Promise.all(batch);
    } catch (e) {
      console.error('Error syncing packages to Firestore', e);
    }
  };

  const setIndustries = async (data: any[]) => {
    const oldIds = industries.map((i: any) => i.id);
    const newIds = data.map((i: any) => i.id);
    const deletedIds = oldIds.filter((id: string) => !newIds.includes(id));
    
    setIndustriesState(data);
    try {
      const batch = data.map(async (ind) => {
        await setDoc(doc(db, 'industries', ind.id), ind);
      });
      const deletes = deletedIds.map(async (id: string) => {
        await deleteDoc(doc(db, 'industries', id));
      });
      await Promise.all([...batch, ...deletes]);
    } catch (e) {
      console.error('Error syncing industries to Firestore', e);
    }
  };
  const setReports = (data: any[]) => { setReportsState(data); };
  const setReviews = (data: any[]) => { setReviewsState(data); };
  const setPaymentMethods = async (data: any[]) => {
    const oldIds = paymentMethods.map((i: any) => i.id);
    const newIds = data.map((i: any) => i.id);
    const deletedIds = oldIds.filter((id: string) => !newIds.includes(id));
    
    setPaymentMethodsState(data);
    try {
      const batch = data.map(async (pm) => {
        await setDoc(doc(db, 'paymentMethods', pm.id), pm);
      });
      const deletes = deletedIds.map(async (id: string) => {
        await deleteDoc(doc(db, 'paymentMethods', id));
      });
      await Promise.all([...batch, ...deletes]);
    } catch (e) {
      console.error('Error syncing payment methods to Firestore', e);
    }
  };

  const setSkills = async (data: any[]) => {
    const oldIds = skills.map((i: any) => i.id);
    const newIds = data.map((i: any) => i.id);
    const deletedIds = oldIds.filter(id => !newIds.includes(id));
    
    setSkillsState(data);
    try {
      const batch = data.map(async (sk) => {
        await setDoc(doc(db, 'skills', sk.id), sk);
      });
      const deletes = deletedIds.map(async (id) => {
        await deleteDoc(doc(db, 'skills', id));
      });
      await Promise.all([...batch, ...deletes]);
    } catch (e) {
      console.error('Error syncing skills to Firestore', e);
    }
  };

  return (
    <DataContext.Provider value={{
      users, setUsers,
      employers, setEmployers,
      jobPosts, setJobPosts,
      packages, setPackages,
      industries, setIndustries,
      reports, setReports,
      reviews, setReviews,
      paymentMethods, setPaymentMethods,
      skills, setSkills,
      transactions, setTransactions
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
