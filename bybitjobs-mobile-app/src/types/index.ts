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
  logoUrl?: string;
  coverImage?: string;
  cover_image?: string;
  status?: string;
  postsLimit?: string;
  usedPosts?: number;
  packageExpiresAt?: string;
}

export interface UserData {
  emailOrPhone: string;
  fullName?: string;
  isVerified?: boolean;
  desiredJob?: string;
  phone?: string;
  cvName?: string;
  cvSize?: string;
  cvUploadTime?: string;
  cvUrl?: string;
  avatar?: string;
  companyName?: string;
  skills?: string[];
  experience?: any[];
  bio?: string;
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
  status?: 'Chờ duyệt' | 'Hoạt động' | 'Bị từ chối';
  isPremium?: boolean;
}

export interface CandidateItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone: string;
  desiredJob?: string;
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
}

export interface ApplicationItem {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  cvUrl?: string;
  appliedAt: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Đã từ chối';
  note?: string;
}
