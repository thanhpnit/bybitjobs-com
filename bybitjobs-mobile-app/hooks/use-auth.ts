import React from 'react';
import { auth } from '../src/config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

export type UserRole = 'candidate' | 'employer' | null;

export interface EmployerData {
  companyName: string;
  taxId: string;
  phoneNumber: string;
  address: string;
  servicePackage: 'Free' | 'Gold' | 'Diamond';
}

export interface UserData {
  emailOrPhone: string;
  fullName?: string;
  isVerified?: boolean;
}

// Giữ lại trạng thái mock cho Employer Data vì Firebase Auth không lưu phần này
// Trong thực tế, dữ liệu này sẽ được lưu ở Firestore hoặc Node.js MongoDB Backend
let globalEmployerData: EmployerData | null = null;
let globalUserRole: UserRole = null;
const listeners = new Set<() => void>();
const notifyAll = () => listeners.forEach((l) => l());

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(auth.currentUser);
  const [isInitializing, setIsInitializing] = React.useState(true);
  
  const [userRole, setUserRole] = React.useState<UserRole>(globalUserRole);
  const [employerData, setEmployerData] = React.useState<EmployerData | null>(globalEmployerData);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        if (!globalUserRole) globalUserRole = 'candidate';
      } else {
        globalUserRole = null;
        globalEmployerData = null;
      }
      setUserRole(globalUserRole);
      setEmployerData(globalEmployerData);
      setIsInitializing(false);
    });

    const handleMockDataChange = () => {
      setUserRole(globalUserRole);
      setEmployerData(globalEmployerData);
    };
    listeners.add(handleMockDataChange);

    return () => {
      unsubscribe();
      listeners.delete(handleMockDataChange);
    };
  }, []);

  const login = async (emailOrPhone: string, passwordInput: string): Promise<{ success: boolean; message: string }> => {
    try {
      await signInWithEmailAndPassword(auth, emailOrPhone, passwordInput);
      return { success: true, message: 'Đăng nhập thành công!' };
    } catch (error: any) {
      let msg = `Đăng nhập thất bại. Vui lòng thử lại. Lỗi: ${error.message}`;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
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

  const verifyAccount = () => {};

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

  const upgradePackage = (packageName: 'Free' | 'Gold' | 'Diamond') => {
    if (globalEmployerData) {
      globalEmployerData.servicePackage = packageName;
      notifyAll();
    }
  };

  return {
    isLoggedIn: !!firebaseUser,
    isInitializing,
    userRole,
    userData: firebaseUser ? { 
      emailOrPhone: firebaseUser.email || '', 
      fullName: firebaseUser.displayName || 'Người dùng',
      isVerified: true 
    } : null,
    employerData,
    login,
    signup,
    verifyAccount,
    registerEmployer,
    updateCompany,
    upgradePackage,
    logout,
  };
}
