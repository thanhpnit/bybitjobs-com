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
  const [seqId, setSeqId] = React.useState<string>('000000');
  
  const [userRole, setUserRole] = React.useState<UserRole>(globalUserRole);
  const [employerData, setEmployerData] = React.useState<EmployerData | null>(globalEmployerData);

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
      } else {
        globalUserRole = null;
        globalEmployerData = null;
        setSeqId('000000');
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

  React.useEffect(() => {
    const checkStatus = async () => {
      if (firebaseUser) {
        try {
          await firebaseUser.reload();
        } catch (err: any) {
          console.error("Lỗi kiểm tra trạng thái tài khoản:", err);
          if (err.code === 'auth/user-disabled') {
            const { Alert } = await import('react-native');
            Alert.alert(
              'Tài khoản bị khóa',
              'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ ban quản trị để được hỗ trợ.',
              [{ text: 'Đồng ý', onPress: () => firebaseSignOut(auth) }]
            );
          }
        }
      }
    };
    checkStatus();
  }, [firebaseUser]);

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

  const verifyAccount = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'Chưa đăng nhập.' };
      }
      
      const response = await fetch(`http://160.250.246.119:4000/api/users/${user.uid}/verify`, {
        method: 'POST'
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
    seqId, // Mã USER ID tuần tự 6 chữ số
    userData: firebaseUser ? { 
      uid: firebaseUser.uid,
      emailOrPhone: firebaseUser.email || '', 
      fullName: firebaseUser.displayName || 'Người dùng',
      isVerified: firebaseUser.emailVerified 
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
