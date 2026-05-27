import React from 'react';

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

export interface UserRecord {
  emailOrPhone: string;
  fullName: string;
  password?: string;
  role: UserRole;
  employerData?: EmployerData | null;
  isVerified: boolean;
}

// In-memory persistent mock database of users
const registeredUsers: UserRecord[] = [
  {
    emailOrPhone: 'quan.nguyen@example.com',
    fullName: 'Nguyễn Minh Quân',
    password: '123',
    role: 'candidate',
    employerData: null,
    isVerified: true // Default mock account is already verified
  }
];

// In-memory reactive global states for the prototype ecosystem
let globalIsLoggedIn = false;
let globalUserRole: UserRole = null;
let globalUserData: UserData | null = null;
let globalEmployerData: EmployerData | null = null;

const listeners = new Set<() => void>();

const notifyAll = () => {
  listeners.forEach((l) => l());
};

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(globalIsLoggedIn);
  const [userRole, setUserRole] = React.useState<UserRole>(globalUserRole);
  const [userData, setUserData] = React.useState<UserData | null>(globalUserData);
  const [employerData, setEmployerData] = React.useState<EmployerData | null>(globalEmployerData);

  React.useEffect(() => {
    const handleChange = () => {
      setIsLoggedIn(globalIsLoggedIn);
      setUserRole(globalUserRole);
      setUserData(globalUserData);
      setEmployerData(globalEmployerData);
    };
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const login = (emailOrPhone: string, passwordInput: string): { success: boolean; message: string } => {
    const user = registeredUsers.find(
      (u) => u.emailOrPhone.trim().toLowerCase() === emailOrPhone.trim().toLowerCase()
    );

    if (!user) {
      return { success: false, message: 'Tài khoản không tồn tại trên hệ thống. Vui lòng đăng ký mới.' };
    }

    if (user.password && user.password !== passwordInput) {
      return { success: false, message: 'Mật khẩu đăng nhập không khớp.' };
    }

    globalIsLoggedIn = true;
    globalUserRole = user.role;
    globalUserData = {
      emailOrPhone: user.emailOrPhone,
      fullName: user.fullName,
      isVerified: user.isVerified
    };
    globalEmployerData = user.employerData || null;
    notifyAll();
    return { success: true, message: 'Đăng nhập thành công!' };
  };

  const signup = (emailOrPhone: string, fullName: string, passwordInput: string): { success: boolean; message: string } => {
    const exists = registeredUsers.some(
      (u) => u.emailOrPhone.trim().toLowerCase() === emailOrPhone.trim().toLowerCase()
    );
    if (exists) {
      return { success: false, message: 'Tài khoản Email hoặc SĐT này đã được đăng ký.' };
    }

    registeredUsers.push({
      emailOrPhone,
      fullName,
      password: passwordInput,
      role: 'candidate',
      employerData: null,
      isVerified: false // Newly registered users are NOT verified yet
    });
    
    return { success: true, message: 'Đăng ký tài khoản thành công!' };
  };

  const verifyAccount = () => {
    if (globalUserData) {
      globalUserData.isVerified = true;
      const user = registeredUsers.find(
        (u) => u.emailOrPhone.trim().toLowerCase() === globalUserData!.emailOrPhone.trim().toLowerCase()
      );
      if (user) {
        user.isVerified = true;
      }
      notifyAll();
    }
  };

  const registerEmployer = (data: Omit<EmployerData, 'servicePackage'>) => {
    globalIsLoggedIn = true;
    globalUserRole = 'employer'; // Elevated to employer
    globalEmployerData = {
      ...data,
      servicePackage: 'Free', // Defaults to Free package
    };

    // Update the record in the in-memory database
    if (globalUserData) {
      const user = registeredUsers.find(
        (u) => u.emailOrPhone.trim().toLowerCase() === globalUserData!.emailOrPhone.trim().toLowerCase()
      );
      if (user) {
        user.role = 'employer';
        user.employerData = globalEmployerData;
      }
    }
    
    notifyAll();
  };

  const updateCompany = (data: Partial<EmployerData>) => {
    if (globalEmployerData) {
      globalEmployerData = {
        ...globalEmployerData,
        ...data,
      };
      
      // Update in database too
      if (globalUserData) {
        const user = registeredUsers.find(
          (u) => u.emailOrPhone.trim().toLowerCase() === globalUserData!.emailOrPhone.trim().toLowerCase()
        );
        if (user) {
          user.employerData = globalEmployerData;
        }
      }
      notifyAll();
    }
  };

  const upgradePackage = (packageName: 'Free' | 'Gold' | 'Diamond') => {
    if (globalEmployerData) {
      globalEmployerData.servicePackage = packageName;
      
      // Update in database too
      if (globalUserData) {
        const user = registeredUsers.find(
          (u) => u.emailOrPhone.trim().toLowerCase() === globalUserData!.emailOrPhone.trim().toLowerCase()
        );
        if (user) {
          user.employerData = globalEmployerData;
        }
      }
      notifyAll();
    }
  };

  const logout = () => {
    globalIsLoggedIn = false;
    globalUserRole = null;
    globalUserData = null;
    globalEmployerData = null; 
    notifyAll();
  };

  return {
    isLoggedIn,
    userRole,
    userData,
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
