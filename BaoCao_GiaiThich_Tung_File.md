# Giải Thích Chi Tiết Từng File Code - BybitJobs

Do hệ thống có quy mô lớn, tài liệu này sẽ đi sâu vào **chức năng và cách hoạt động của từng file cụ thể** trong 3 phân hệ: Backend, Mobile App và Web Admin. Bạn có thể dùng tài liệu này để tra cứu xem "file này sinh ra để làm gì và code bên trong viết gì".

---

## 1. Backend API (`bybitjobs-api`)

| Tên File | Đường dẫn | Giải thích chi tiết logic bên trong |
|----------|-----------|-------------------------------------|
| **`server.ts`** | `src/server.ts` | **Trái tim của Backend.** Đây là file nguyên khối chứa toàn bộ cấu hình server Express, kết nối Firebase Admin, cấu hình PayOS (thanh toán), Nodemailer (gửi email), Gemini AI, và ĐỊNH NGHĨA TOÀN BỘ API ENDPOINTS (GET/POST/PUT/DELETE) của hệ thống. |
| **`serviceAccountKey.json`** | `/` | File chứa khóa bảo mật (Private Key) của Firebase. Backend dùng file này để có toàn quyền quản trị Database (Firestore) vượt qua mọi rule bảo mật. |
| **`docker-compose.yml`** | `/` | File cấu hình Docker, giúp bạn có thể chạy hoặc deploy Backend này lên server ảo (VPS) chỉ bằng 1 câu lệnh. |
| **`.env`** | `/` | File chứa các biến môi trường nhạy cảm như: API Key của Gemini, Client ID của PayOS, Email & Mật khẩu ứng dụng dùng cho Nodemailer. |

---

## 2. Mobile App (`bybitjobs-mobile-app`)

Ứng dụng dùng thư mục `app` để làm Routing. Nghĩa là mỗi file trong thư mục `app` sẽ tự động trở thành một màn hình.

### Khối Màn hình Cơ bản & Xác thực (Thư mục `app/`)
| Tên File | Giải thích chi tiết logic bên trong |
|----------|-------------------------------------|
| **`index.tsx`** | Màn hình đầu tiên khi bật app (Welcome/Splash). Chứa logic kiểm tra xem người dùng đã đăng nhập chưa (check Token). Nếu rồi sẽ tự đẩy vào màn trang chủ, nếu chưa sẽ hiện nút Đăng nhập. |
| **`login.tsx`** | Form đăng nhập. Chứa state lưu Email/Mật khẩu. Có nút gọi hàm đăng nhập của Firebase hoặc Backend. |
| **`signup.tsx`** | Form đăng ký tài khoản. Cho phép người dùng chọn Role: Ứng viên hoặc Nhà tuyển dụng. Sau khi điền xong sẽ gọi API tạo tài khoản. |
| **`apply-job.tsx`** | Màn hình popup (modal) hiện lên khi ứng viên bấm "Ứng tuyển". Code ở đây sẽ gọi API lấy danh sách CV của ứng viên đó để họ chọn, sau đó gửi request ứng tuyển lên backend. |
| **`job-details.tsx`** | Màn hình hiển thị chi tiết một công việc. Nó sẽ nhận ID công việc từ đường link, sau đó gọi API `/api/jobs/:id` để kéo dữ liệu (Lương, Yêu cầu, JD) về hiển thị. |
| **`ai-advisor.tsx`** | Màn hình chat với Cố vấn AI. Chứa giao diện nhắn tin (Chat UI), khi người dùng gõ tin nhắn, code sẽ gọi API Gemini để lấy câu trả lời và nhét vào mảng tin nhắn. |

### Khối Màn hình của Ứng viên (Thư mục `app/(tabs)/`)
Đây là các tab bên dưới màn hình dành cho Ứng viên.
| Tên File | Giải thích chi tiết logic bên trong |
|----------|-------------------------------------|
| **`_layout.tsx`** | File cấu hình thanh điều hướng dưới đáy màn hình (Bottom Navigation Bar). Quy định icon và màu sắc cho các tab. |
| **`index.tsx`** | Tab Trang chủ. Gọi API lấy danh sách việc làm mới nhất, hiển thị dưới dạng danh sách (FlatList/ScrollView). Có thanh tìm kiếm. |
| **`my-jobs.tsx`** | Tab Việc làm của tôi. Lọc và hiển thị danh sách các công việc mà ứng viên đã bấm "Lưu" hoặc đã "Ứng tuyển". |
| **`community.tsx`** | Màn hình cộng đồng. Nơi người dùng có thể post bài, thảo luận, xem tin tức (như một MXH thu nhỏ). |
| **`notifications.tsx`**| Màn hình thông báo. Gọi API kéo danh sách thông báo (ví dụ: nhà tuyển dụng đã xem hồ sơ) và hiển thị. |
| **`profile.tsx`** | Tab Hồ sơ cá nhân. Gọi API lấy thông tin User (Tên, SDT, Danh sách CV đã tải lên). Có nút để Upload CV mới. |

### Khối Màn hình của Nhà tuyển dụng (Thư mục `app/recruiter/`)
| Tên File | Giải thích chi tiết logic bên trong |
|----------|-------------------------------------|
| **`dashboard.tsx`** | Bảng điều khiển nhà tuyển dụng. Gọi API thống kê số lượng tin đã đăng, số CV nhận được để vẽ biểu đồ và hiển thị số tổng. |
| **`jobs.tsx`** | Danh sách các tin tuyển dụng của riêng công ty đó. Có nút Xóa, Sửa, và Ẩn tin. |
| **`edit-job.tsx`** | Form điền thông tin để đăng tin mới hoặc sửa tin cũ (Chức danh, Mức lương, JD). Nút Lưu sẽ trigger gọi API POST/PUT lên Backend. |
| **`candidates.tsx`**| Danh sách những người đã nộp CV vào công ty. Chia ra các tab trạng thái (Mới nộp, Đang phỏng vấn, Đã loại). Gọi API update trạng thái nếu thao tác. |
| **`search-candidates.tsx`** | Tính năng lọc và tìm kiếm Database CV. Có kết hợp chấm điểm Matching bằng AI. |
| **`cv-details.tsx`** | Màn hình xem chi tiết CV. Nếu là file PDF, code sẽ dùng thư viện WebView/PDF Reader để render file đó ra màn hình. |
| **`pricing.tsx`** & **`payment.tsx`** | Màn hình hiển thị Bảng giá (VIP, Lượt đăng tin) và luồng thanh toán. Nút Mua sẽ gọi API PayOS để sinh mã QR và hiển thị QR đó ra màn hình `payment.tsx`. |

---

## 3. Web Admin (`bybitjobs-web-admin`)

Web admin dùng React và định tuyến (Routing) nằm trong các thư mục.

| Tên File | Đường dẫn | Giải thích chi tiết logic bên trong |
|----------|-----------|-------------------------------------|
| **`App.tsx`** / **`main.tsx`** | `src/` | Chứa cấu hình Routing tổng cho Admin. Bọc ứng dụng bằng các Context/Provider (như Theme, Auth). |
| **`AdminLayout.tsx`** | `src/layouts/` | Bộ khung giao diện của Admin. Chứa thanh Menu bên trái (Sidebar) và thanh công cụ bên trên (Header). Các trang con sẽ được nhúng vào giữa khung này. |
| **`Dashboard.tsx`** | `src/pages/` | Giao diện đầu tiên Admin thấy. Thường chứa các thư viện vẽ biểu đồ (Recharts/ChartJS) để hiển thị doanh thu, số user đăng ký mới trong tháng. |
| **`Users.tsx`** | `src/pages/` | Hiển thị dạng Bảng (Table) danh sách tất cả Ứng viên. Code có state lưu trữ mảng user. Có nút "Khóa tài khoản" -> Bấm vào sẽ gọi API `/api/users/:uid/status`. |
| **`Employers.tsx`** | `src/pages/` | Bảng quản lý Nhà tuyển dụng. Tương tự như Users nhưng có thêm nút "Duyệt công ty" (Xác minh giấy tờ doanh nghiệp). |
| **`JobPosts.tsx`** | `src/pages/` | Bảng duyệt tin tuyển dụng. Admin có thể xem nội dung tin, nếu tin rác/vi phạm thì bấm nút Xóa/Ẩn. |
| **`ServicePackages.tsx`** | `src/pages/` | Cho phép Admin tạo, cấu hình giá, số lượng lượt đăng của các gói VIP (Ví dụ: Gói Cơ bản 500k = 5 tin). Code gọi API Create/Update Packages. |
| **`Payments.tsx`** | `src/pages/` | Bảng đối soát giao dịch. Kéo lịch sử toàn bộ các lần quét mã QR PayOS để kiểm tra xem tiền đã vào thật chưa, user nào mua. |
| **`vite.config.ts`** | `/` | Cấu hình bộ build Vite, khai báo port chạy (ví dụ 3000), cấu hình đường dẫn tuyệt đối (aliases). |

---

> **💡 Lời khuyên khi bị "hỏi xoáy":** 
> Nếu ai đó mở một file (ví dụ `profile.tsx`) và hỏi *"Đoạn code gọi dữ liệu nằm ở đâu?"*
> ➡️ **Câu trả lời:** Hãy tìm đến các block code có chứa chữ `useEffect` hoặc các biến `fetch(...)`, `axios.get(...)`. Đó chính là nơi React thực hiện kết nối với Backend API để kéo dữ liệu về trước khi vẽ lên màn hình.

