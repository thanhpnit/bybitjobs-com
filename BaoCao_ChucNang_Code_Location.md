# Bản Đồ Chức Năng (Codebase Feature Map) - BybitJobs

Tài liệu này tổng hợp toàn bộ các chức năng chính của hệ thống BybitJobs và vị trí mã nguồn (code) tương ứng của từng chức năng trên cả 3 nền tảng: Backend API, Web Admin và Mobile App.

---

## 1. Backend API (`bybitjobs-api`)
Toàn bộ mã nguồn API được viết trong file `bybitjobs-api/src/server.ts`. Dưới đây là các chức năng API (Endpoints) và vị trí dòng code:

| Dòng | Phương thức | Endpoint | Chức năng (Dự kiến) |
|------|-------------|----------|---------------------|
| 292 | `GET` | `/health` | Kiểm tra trạng thái hệ thống |
| 297 | `GET` | `/api/users` | Lấy danh sách người dùng |
| 397 | `GET` | `/api/candidates` | Lấy danh sách ứng viên |
| 472, 786 | `POST` | `/api/upload-avatar` | Tải ảnh đại diện lên |
| 499 | `PUT` | `/api/users/:uid/job` | Cập nhật công việc của người dùng |
| 517 | `PUT` | `/api/users/:uid/phone` | Cập nhật số điện thoại người dùng |
| 625 | `POST` | `/api/analyze-cv-job` | Phân tích CV phù hợp với Job (AI) |
| 698 | `POST` | `/api/upload-cv` | Tải CV lên |
| 737 | `PUT` | `/api/users/:uid/cv` | Cập nhật CV của người dùng |
| 761 | `PUT` | `/api/users/:uid/avatar` | Cập nhật Avatar của người dùng |
| 816 | `GET` | `/api/users/:uid` | Lấy thông tin chi tiết người dùng |
| 857 | `POST` | `/api/send-email` | Gửi email thông báo |
| 909 | `POST` | `/api/send-otp` | Gửi mã OTP xác thực |
| 956 | `DELETE`| `/api/users/:uid` | Xóa người dùng |
| 1006| `PUT` | `/api/users/:uid/status` | Cập nhật trạng thái người dùng |
| 1069| `POST` | `/api/users/:uid/send-otp` | Gửi OTP cho người dùng cụ thể |
| 1098| `POST` | `/api/users/:uid/verify` | Xác thực tài khoản người dùng |
| 1154| `POST` | `/api/auth/forgot-password/send-otp` | Gửi OTP quên mật khẩu |
| 1196| `POST` | `/api/auth/forgot-password/reset` | Đặt lại mật khẩu |
| 1245| `GET` | `/api/users/:uid/seq` | Lấy Sequence của người dùng |
| 1514| `GET` | `/api/jobs` | Lấy danh sách công việc |
| 1519| `GET` | `/api/jobs/:id` | Lấy chi tiết một công việc |
| 1528| `POST` | `/api/jobs` | Tạo công việc mới (Đăng tuyển) |
| 1550| `PUT` | `/api/jobs/:id` | Cập nhật thông tin công việc |
| 1564| `DELETE`| `/api/jobs/:id` | Xóa công việc |
| 1687| `GET` | `/api/applications` | Lấy danh sách hồ sơ ứng tuyển |
| 1692| `PUT` | `/api/applications/:id/status`| Cập nhật trạng thái ứng tuyển |
| 1725| `POST` | `/api/invitations` | Gửi lời mời ứng tuyển |
| 1815| `GET` | `/api/employers` | Lấy danh sách Nhà tuyển dụng |
| 1831| `GET` | `/api/employers/:uid` | Lấy chi tiết Nhà tuyển dụng |
| 1846| `POST` | `/api/employers/:uid` | Tạo/Cập nhật thông tin Nhà tuyển dụng |
| 1902| `DELETE`| `/api/employers/:uid` | Xóa Nhà tuyển dụng |
| 1914| `PUT` | `/api/employers/:uid/status` | Cập nhật trạng thái Nhà tuyển dụng |
| 1927| `GET` | `/api/packages` | Lấy danh sách các gói dịch vụ |
| 1987| `GET` | `/api/orders` | Lấy danh sách đơn hàng/giao dịch |
| 2027| `POST` | `/api/payment/create` | Tạo yêu cầu thanh toán mới |
| 2064| `POST` | `/api/webhooks/payos` | Webhook nhận phản hồi từ PayOS |
| 2150| `POST` | `/api/setup-webhook` | Thiết lập Webhook thanh toán |
| 2161| `POST` | `/api/jobs/:jobId/ai-match` | AI Match ứng viên cho công việc |
| 2241| `GET` | `/api/companies/suggest` | Gợi ý công ty |
| 2279| `POST` | `/api/ai/cover-letter` | AI tạo Cover Letter |
| 2326| `POST` | `/api/ai/generate-jd` | AI tạo Job Description (JD) |
| 2376| `POST` | `/api/ai/candidate-match-score` | Chấm điểm độ phù hợp của ứng viên |
| 2437| `POST` | `/api/ai/career-advisor` | Cố vấn nghề nghiệp AI (Tư vấn) |
| 2503| `POST` | `/api/users/:uid/cv-analyze` | AI Phân tích CV chi tiết |

---

## 2. Web Admin (`bybitjobs-web-admin`)
Dự án Web Admin sử dụng React + Vite. Dưới đây là các màn hình quản trị và tính năng nằm trong thư mục `src/pages`:

| File Giao Diện | Chức năng (Giao diện Quản trị) |
|----------------|--------------------------------|
| `Dashboard.tsx` | Trang tổng quan (Thống kê số liệu, biểu đồ) |
| `Employers.tsx` | Quản lý danh sách Nhà tuyển dụng (Duyệt, khóa) |
| `Industries.tsx` | Quản lý danh mục Ngành nghề |
| `JobPosts.tsx` | Quản lý tin tuyển dụng (Duyệt tin, ẩn tin) |
| `Login.tsx` | Đăng nhập dành cho Admin |
| `Notifications.tsx`| Quản lý và gửi thông báo hệ thống |
| `Payments.tsx` | Quản lý lịch sử giao dịch và thanh toán |
| `Reports.tsx` | Quản lý báo cáo (vi phạm, lỗi) |
| `Reviews.tsx` | Quản lý đánh giá/Review công ty |
| `ServicePackages.tsx`| Quản lý các gói dịch vụ (Tạo, sửa, xóa giá tiền) |
| `Skills.tsx` | Quản lý danh mục Kỹ năng (Skills) |
| `Users.tsx` | Quản lý người dùng (Ứng viên) |

---

## 3. Mobile App (`bybitjobs-mobile-app`)
Ứng dụng di động được viết bằng React Native (Expo Router). Các màn hình nằm trong thư mục `app`:

### Các màn hình cơ bản & Xác thực (`app/`)
| File | Chức năng |
|------|-----------|
| `index.tsx` | Màn hình khởi động / Trang chủ Welcome |
| `login.tsx` | Đăng nhập tài khoản |
| `signup.tsx` | Đăng ký tài khoản mới |
| `apply-job.tsx` | Giao diện nộp hồ sơ ứng tuyển |
| `job-details.tsx` | Xem chi tiết một công việc |
| `ai-advisor.tsx` | Trò chuyện với Cố vấn nghề nghiệp AI |

### Dành cho Ứng viên (`app/(tabs)/`)
| File | Chức năng |
|------|-----------|
| `index.tsx` | Bảng tin (Feed) / Trang chủ tìm việc |
| `my-jobs.tsx` | Quản lý công việc đã lưu / đã ứng tuyển |
| `community.tsx` | Tính năng cộng đồng / Thảo luận |
| `notifications.tsx`| Thông báo của ứng viên |
| `profile.tsx` | Quản lý hồ sơ cá nhân và CV |

### Dành cho Nhà tuyển dụng (`app/recruiter/`)
| File | Chức năng |
|------|-----------|
| `dashboard.tsx` | Tổng quan tài khoản nhà tuyển dụng |
| `jobs.tsx` | Quản lý các tin tuyển dụng đã đăng |
| `edit-job.tsx` | Chỉnh sửa nội dung tin tuyển dụng |
| `candidates.tsx` | Danh sách ứng viên đã nộp hồ sơ |
| `search-candidates.tsx`| Tìm kiếm ứng viên (Database CV) |
| `cv-details.tsx` | Xem chi tiết CV của ứng viên |
| `register.tsx` | Đăng ký thông tin công ty / Nhà tuyển dụng |
| `pricing.tsx` | Bảng giá các gói dịch vụ tuyển dụng |
| `payment.tsx` | Giao diện thanh toán |
| `transactions.tsx` | Lịch sử giao dịch |
| `profile.tsx` | Hồ sơ nhà tuyển dụng / Công ty |

