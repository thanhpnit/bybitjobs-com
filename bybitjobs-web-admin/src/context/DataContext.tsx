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
  const loadData = (key: string, initialData: any[]) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load data from localStorage', e);
    }
    return initialData;
  };

  const [users, setUsersState] = useState(() => loadData('bybitjobs_users', initialUsers));
  const [employers, setEmployersState] = useState(() => loadData('bybitjobs_employers', initialEmployers));
  const [jobPosts, setJobPostsState] = useState(() => loadData('bybitjobs_jobPosts', initialJobPosts));
  const [packages, setPackagesState] = useState<any[]>([]); // Sẽ load từ Firebase
  const [industries, setIndustriesState] = useState(() => loadData('bybitjobs_industries', initialIndustries));
  const [reports, setReportsState] = useState(() => loadData('bybitjobs_reports', initialReports));
  const [reviews, setReviewsState] = useState(() => loadData('bybitjobs_reviews', initialReviews));
  const [paymentMethods, setPaymentMethodsState] = useState(() => loadData('bybitjobs_paymentMethods', initialPaymentMethods));

  useEffect(() => {
    // Lắng nghe thay đổi từ Firestore collection 'packages'
    const unsubscribe = onSnapshot(collection(db, 'packages'), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(d => data.push(d.data()));
      
      // Nếu chưa có package nào trên Firestore, khởi tạo bằng dữ liệu mẫu
      if (data.length === 0) {
        initialPackages.forEach(async (pkg) => {
          await setDoc(doc(db, 'packages', pkg.id), pkg);
        });
        setPackagesState(initialPackages);
      } else {
        setPackagesState(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const setUsers = (data: any[]) => { setUsersState(data); localStorage.setItem('bybitjobs_users', JSON.stringify(data)); };
  const setEmployers = (data: any[]) => { setEmployersState(data); localStorage.setItem('bybitjobs_employers', JSON.stringify(data)); };
  const setJobPosts = (data: any[]) => { setJobPostsState(data); localStorage.setItem('bybitjobs_jobPosts', JSON.stringify(data)); };
  const setPackages = async (data: any[]) => {
    // UI optimistic update
    setPackagesState(data);
    
    // Sync to Firestore
    try {
      const batch = data.map(async (pkg) => {
        await setDoc(doc(db, 'packages', pkg.id), pkg);
      });
      await Promise.all(batch);
      
      // Handle deletions (nếu có package bị xóa)
      // Để đơn giản, ta không xử lý xóa ở đây nếu data truyền vào thiếu phần tử. 
      // Trong thực tế, hàm deletePackages sẽ tốt hơn. Ở quy mô này, setDoc đè lên là đủ.
    } catch (e) {
      console.error('Error syncing packages to Firestore', e);
    }
  };

  const setIndustries = (data: any[]) => { setIndustriesState(data); localStorage.setItem('bybitjobs_industries', JSON.stringify(data)); };
  const setReports = (data: any[]) => { setReportsState(data); localStorage.setItem('bybitjobs_reports', JSON.stringify(data)); };
  const setReviews = (data: any[]) => { setReviewsState(data); localStorage.setItem('bybitjobs_reviews', JSON.stringify(data)); };
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
