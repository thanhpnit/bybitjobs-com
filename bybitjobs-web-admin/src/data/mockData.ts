export const initialUsers = [
  { id: '#US-9021', name: 'Nguyễn Văn An', job: 'Thợ điện bậc 4', email: 'an.nguyen@email.com', phone: '090 123 4567', status: 'Đã xác thực', date: '12/10/2023' },
  { id: '#US-8942', name: 'Trần Thị Bình', job: 'Giúp việc gia đình', email: 'binh.tt@email.com', phone: '091 888 9999', status: 'Chờ xác thực', date: '15/10/2023' },
  { id: '#US-8811', name: 'Lê Minh Cường', job: 'Giao hàng nhanh', email: 'cuong.le@email.com', phone: '098 765 4321', status: 'Bị khóa', date: '18/10/2023' },
];

export const initialEmployers = [
  { id: '#EM-5321', company: 'Logistics Toàn Cầu', industry: 'Logistics', email: 'hr@logistics.com', phone: '098 765 4321', status: 'Chờ duyệt', postsLimit: '5/5', isVerified: false },
  { id: '#EM-5322', company: 'TechAsia Solutions', industry: 'IT', email: 'hr@techasia.vn', phone: '090 111 2222', status: 'Đang hoạt động', postsLimit: '2/10', isVerified: true },
];

export const initialJobPosts = [
  { id: '#JD-8291', title: 'Nhân viên Giao hàng Nội thành', type: 'Bán thời gian • Quận 1, HCM', company: 'LogiExpress Co.', companyStatus: 'Đối tác tin cậy', date: '24/10/2023', status: 'Chờ duyệt' },
  { id: '#JD-8292', title: 'Nhân viên Phục vụ Quán Cà phê', type: 'Thời vụ • Quận 3, HCM', company: 'The Urban Beans', companyStatus: 'ID: NTD-0921', date: '24/10/2023', status: 'Hoạt động' },
  { id: '#JD-8285', title: 'Thực tập sinh Marketing', type: 'Làm việc tại nhà • Toàn quốc', company: 'Creative Mind Agency', companyStatus: 'ID: NTD-1102', date: '22/10/2023', status: 'Bị từ chối' },
];

export const initialPackages = [
  { 
    id: 'starter',
    name: 'Starter', 
    price: '0 VNĐ', 
    priceNum: 0,
    period: '/ tháng', 
    posts: '5 bài', 
    cvs: '50 / bài', 
    users: '1,240',
    iconName: 'User',
    badge: 'CƠ BẢN',
    color: '#6B7280'
  },
  { 
    id: 'pro',
    name: 'Pro', 
    price: '499.000 VNĐ', 
    priceNum: 499000,
    period: '/ tháng', 
    posts: '25 bài', 
    cvs: 'Không giới hạn', 
    users: '856',
    iconName: 'Star',
    badge: 'DOANH NGHIỆP',
    isPopular: true,
    color: '#0066FF'
  },
  { 
    id: 'premium',
    name: 'Premium', 
    price: '1.299.000 VNĐ', 
    priceNum: 1299000,
    period: '/ tháng', 
    posts: 'Không giới hạn', 
    cvs: 'Hỗ trợ 24/7', 
    users: '142',
    iconName: 'Award',
    badge: 'CAO CẤP',
    color: '#D97706'
  },
];

export const initialIndustries = [
  { id: 'ind-1', name: 'Công nghệ thông tin (IT)', desc: 'Lập trình viên, Kiểm thử, Quản trị hệ thống', posts: 1245, status: 'Active' },
  { id: 'ind-2', name: 'Bán lẻ / Tiêu dùng', desc: 'Nhân viên bán hàng, Thu ngân, Cửa hàng trưởng', posts: 843, status: 'Active' },
  { id: 'ind-3', name: 'Logistics / Vận tải', desc: 'Tài xế, Giao hàng, Quản lý kho', posts: 521, status: 'Active' },
  { id: 'ind-4', name: 'Du lịch / Khách sạn', desc: 'Lễ tân, Phục vụ, Buồng phòng', posts: 105, status: 'Inactive' },
];

export const initialReports = [
  { id: 1, user: 'Nguyen Van A', target: 'Công ty ABC', reason: 'Lừa đảo tiền cọc', date: '2023-10-24', status: 'Chờ xử lý' },
  { id: 2, user: 'Tran Thi B', target: 'Người dùng XYZ', reason: 'Spam tin nhắn', date: '2023-10-23', status: 'Chờ xử lý' },
];

export const initialReviews = [
  { id: 1, user: 'Le Van C', company: 'Công ty ABC', rating: 1, comment: 'Bắt đóng tiền cọc đồng phục 500k', date: '2023-10-24', status: 'Chờ duyệt' },
  { id: 2, user: 'Hoang Thi D', company: 'Công ty XYZ', rating: 5, comment: 'Môi trường tốt, lương đúng hạn', date: '2023-10-22', status: 'Đã duyệt' },
];

export const initialPaymentMethods = [
  { id: 'pm-1', type: 'Chuyển khoản Ngân hàng', name: 'Vietcombank', accountName: 'NGUYEN VAN A', accountNumber: '0071 0001 23456', branch: 'Chi nhánh Nam Sài Gòn', status: 'Đang dùng' },
  { id: 'pm-2', type: 'Ví điện tử', name: 'Ví Momo', accountName: 'NGUYEN VAN A', accountNumber: '0901234567', branch: '', status: 'Đang dùng' },
];
