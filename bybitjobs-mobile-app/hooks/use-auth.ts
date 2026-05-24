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
}

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

  const login = (emailOrPhone: string, fullName?: string) => {
    globalIsLoggedIn = true;
    globalUserRole = globalEmployerData ? 'employer' : 'candidate'; // Auto-restore role if company info exists
    globalUserData = {
      emailOrPhone,
      fullName: fullName || globalUserData?.fullName || 'Nguyễn Minh Quân'
    };
    notifyAll();
  };

  const signup = (emailOrPhone: string, fullName: string) => {
    globalIsLoggedIn = true;
    globalUserRole = 'candidate'; // Default role after sign up is generic candidate
    globalUserData = { emailOrPhone, fullName };
    notifyAll();
  };

  const registerEmployer = (data: Omit<EmployerData, 'servicePackage'>) => {
    globalIsLoggedIn = true;
    globalUserRole = 'employer'; // Elevated to employer
    globalEmployerData = {
      ...data,
      servicePackage: 'Free', // Defaults to Free package
    };
    notifyAll();
  };

  const updateCompany = (data: Partial<EmployerData>) => {
    if (globalEmployerData) {
      globalEmployerData = {
        ...globalEmployerData,
        ...data,
      };
      notifyAll();
    }
  };

  const upgradePackage = (packageName: 'Free' | 'Gold' | 'Diamond') => {
    if (globalEmployerData) {
      globalEmployerData.servicePackage = packageName;
      notifyAll();
    }
  };

  const logout = () => {
    globalIsLoggedIn = false;
    globalUserRole = null;
    globalUserData = null;
    globalEmployerData = null; // Reset all state in the mock database
    notifyAll();
  };

  return {
    isLoggedIn,
    userRole,
    userData,
    employerData,
    login,
    signup,
    registerEmployer,
    updateCompany,
    upgradePackage,
    logout,
  };
}
