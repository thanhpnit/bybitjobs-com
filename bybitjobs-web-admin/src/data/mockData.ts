export const initialUsers = [
  { id: '#US-9021', name: 'Nguyễn Văn An', job: 'Thợ điện bậc 4', email: 'an.nguyen@email.com', phone: '090 123 4567', status: 'Đã xác thực', date: '19/06/2026' },
  { id: '#US-8942', name: 'Trần Thị Bình', job: 'Giúp việc gia đình', email: 'binh.tt@email.com', phone: '091 888 9999', status: 'Chờ xác thực', date: '18/06/2026' },
  { id: '#US-8811', name: 'Lê Minh Cường', job: 'Giao hàng nhanh', email: 'cuong.le@email.com', phone: '098 765 4321', status: 'Bị khóa', date: '17/06/2026' },
];

export const initialEmployers = [
  { id: '#EM-5321', company: 'Logistics Toàn Cầu', industry: 'Logistics', email: 'hr@logistics.com', phone: '098 765 4321', status: 'Chờ duyệt', postsLimit: '5/5', isVerified: false, package: 'free', packageName: 'Gói STARTER' },
  { id: '#EM-5322', company: 'TechAsia Solutions', industry: 'IT', email: 'hr@techasia.vn', phone: '090 111 2222', status: 'Đang hoạt động', postsLimit: ' Không giới hạn', isVerified: true, package: 'premium', packageId: 'premium', packageName: 'Gói PREMIUM (VIP 👑)', date: '10/08/2026' },
];

export const initialJobPosts = [
  { id: '#JD-8291', title: 'Nhân viên Giao hàng Nội thành', type: 'Bán thời gian • Quận 1, HCM', company: 'LogiExpress Co.', companyStatus: 'Đối tác tin cậy', date: '19/06/2026', status: 'Chờ duyệt' },
  { id: '#JD-8292', title: 'Nhân viên Phục vụ Quán Cà phê', type: 'Thời vụ • Quận 3, HCM', company: 'The Urban Beans', companyStatus: 'ID: NTD-0921', date: '18/06/2026', status: 'Hoạt động' },
  { id: '#JD-8285', title: 'Thực tập sinh Marketing', type: 'Làm việc tại nhà • Toàn quốc', company: 'Creative Mind Agency', companyStatus: 'ID: NTD-1102', date: '16/06/2026', status: 'Bị từ chối' },
];

export const initialPackages = [
  {
    id: 'free',
    name: 'Gói MIỄN PHÍ',
    price: '0 VNĐ',
    priceNum: 0,
    period: '/ vĩnh viễn',
    posts: '5 tin tuyển dụng',
    cvs: '10 CV ứng viên',
    users: '1,240',
    iconName: 'User',
    badge: 'CƠ BẢN',
    color: '#6B7280'
  },
  {
    id: 'pro',
    name: 'Gói PRO (Phổ Biến ⭐)',
    price: '499.000 VNĐ',
    priceNum: 499000,
    period: '/ 30 ngày',
    posts: '25 tin tuyển dụng',
    cvs: 'Không giới hạn CV',
    users: '856',
    iconName: 'Star',
    badge: 'BÁN CHẠY NHẤT ⭐',
    isPopular: true,
    color: '#0066FF'
  },
  {
    id: 'premium',
    name: 'Gói PREMIUM (VIP 👑)',
    price: '799.000 VNĐ',
    priceNum: 799000,
    period: '/ 30 ngày',
    posts: 'Không giới hạn',
    cvs: 'Không giới hạn CV',
    users: '142',
    iconName: 'Award',
    badge: 'ĐỘC QUYỀN TOP 1 👑',
    isVip: true,
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
  { id: 1, user: 'Nguyen Van A', target: 'Công ty ABC', reason: 'Lừa đảo tiền cọc', date: '2026-06-19', status: 'Chờ xử lý' },
  { id: 2, user: 'Tran Thi B', target: 'Người dùng XYZ', reason: 'Spam tin nhắn', date: '2026-06-18', status: 'Chờ xử lý' },
];

export const initialReviews = [
  { id: 1, user: 'Le Van C', company: 'Công ty ABC', rating: 1, comment: 'Bắt đóng tiền cọc đồng phục 500k', date: '2026-06-19', status: 'Chờ duyệt' },
  { id: 2, user: 'Hoang Thi D', company: 'Công ty XYZ', rating: 5, comment: 'Môi trường tốt, lương đúng hạn', date: '2026-06-17', status: 'Đã duyệt' },
];

export const initialPaymentMethods = [
  { id: 'pm-1', type: 'Chuyển khoản Ngân hàng', name: 'Vietcombank', accountName: 'NGUYEN VAN A', accountNumber: '0071 0001 23456', branch: 'Chi nhánh Nam Sài Gòn', status: 'Đang dùng' },
  { id: 'pm-2', type: 'Ví điện tử', name: 'Ví Momo', accountName: 'NGUYEN VAN A', accountNumber: '0901234567', branch: '', status: 'Đang dùng' },
];

export const initialSkills = [
  { id: 'sk-1', name: 'React Native', desc: 'Lập trình ứng dụng di động đa nền tảng', category: 'Công nghệ', posts: 15, status: 'Active' },
  { id: 'sk-2', name: 'UI/UX Design', desc: 'Thiết kế giao diện và trải nghiệm người dùng', category: 'Thiết kế', posts: 12, status: 'Active' },
  { id: 'sk-3', name: 'Digital Marketing', desc: 'Quản trị thương hiệu & SEO/SEM', category: 'Marketing', posts: 20, status: 'Active' },
  { id: 'sk-4', name: 'Barista / Pha chế', desc: 'Kỹ năng pha chế cà phê và thức uống', category: 'Dịch vụ', posts: 8, status: 'Active' },
  { id: 'sk-5', name: 'Thu ngân / Bán hàng', desc: 'Quản lý quầy thu ngân và chăm sóc khách hàng', category: 'Bán lẻ', posts: 25, status: 'Active' },
];
