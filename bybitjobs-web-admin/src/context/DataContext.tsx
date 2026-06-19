import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
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

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Version check: khi cập nhật mock data, tăng version để force refresh localStorage
  const DATA_VERSION = '2026-06-19';
  const storedVersion = localStorage.getItem('bybitjobs_data_version');
  if (storedVersion !== DATA_VERSION) {
    // Xóa tất cả dữ liệu cũ để load lại từ mock data mới
    localStorage.removeItem('bybitjobs_users');
    localStorage.removeItem('bybitjobs_employers');
    localStorage.removeItem('bybitjobs_jobPosts');
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
        .then(res => res.json())
        .then(data => {
          const usersArray = Array.isArray(data) ? data : data.users;
          if (Array.isArray(usersArray)) {
            setUsersState(usersArray);
          }
        })
        .catch(err => console.error('Error fetching real users in DataContext:', err));
    };

    const fetchRealEmployers = () => {
      fetch(`http://${apiHost}:4000/api/employers`)
        .then(res => res.json())
        .then(data => {
          const employersArray = Array.isArray(data) ? data : data.employers;
          if (Array.isArray(employersArray)) {
            setEmployersState(employersArray);
          }
        })
        .catch(err => console.error('Error fetching real employers in DataContext:', err));
    };

    fetchRealUsers();
    fetchRealEmployers();
  }, []);

  // Listen to Firestore packages, jobs, reports, applications (reviews)
  useEffect(() => {
    // 1. Packages
    const unsubPackages = onSnapshot(collection(db, 'packages'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(d => data.push(d.data()));
      if (data.length === 0) {
        initialPackages.forEach(async (pkg) => {
          await setDoc(doc(db, 'packages', pkg.id), pkg);
        });
        setPackagesState(initialPackages);
      } else {
        setPackagesState(data);
      }
    });

    // 2. Job Posts (Jobs collection in Firestore)
    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        let formattedDate = 'Vừa xong';
        if (item.createdAt) {
          const dateObj = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
          formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        }
        data.push({
          id: docSnap.id,
          title: item.title || 'Không có tiêu đề',
          type: `${item.workType || 'Bán thời gian'} • ${item.location || 'Toàn quốc'}`,
          company: item.companyName || 'Doanh nghiệp',
          companyStatus: item.employerId ? `ID: ${item.employerId.slice(0, 8)}...` : 'Chờ duyệt',
          date: formattedDate,
          createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt || Date.now()),
          status: item.status || 'Chờ duyệt'
        });
      });
      setJobPostsState(data);
    });

    // 3. Reports
    const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        data.push({
          id: docSnap.id,
          user: item.reporterName || item.reporterEmail || 'Người dùng ẩn danh',
          target: item.targetName || item.jobTitle || 'Tin đăng / Công ty',
          reason: item.reason || item.desc || 'Báo cáo vi phạm',
          date: item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt || Date.now()),
          status: item.status === 'accepted' ? 'Đã xử lý' : (item.status === 'rejected' ? 'Bác bỏ' : 'Chờ xử lý')
        });
      });
      setReportsState(data);
    });

    // 4. Reviews (applications collection with feedback)
    const unsubReviews = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        // Lọc các application có feedback/review thật
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
      unsubPackages();
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

  const setIndustries = (data: any[]) => { setIndustriesState(data); localStorage.setItem('bybitjobs_industries', JSON.stringify(data)); };
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
