# Giải Thích Chi Tiết Logic Code Dự Án BybitJobs

Tài liệu này được soạn thảo nhằm giúp bạn **hiểu sâu về mặt logic và kiến trúc** của toàn bộ hệ thống BybitJobs. Bạn có thể sử dụng tài liệu này như một **"phao cứu sinh" (cheat sheet)** để trả lời khi có người (giảng viên, nhà tuyển dụng, đồng nghiệp) hỏi về cách dự án hoạt động.

---

## 1. Kiến Trúc Tổng Thể (System Architecture)

Hệ thống BybitJobs hoạt động dựa trên mô hình **Client-Server** với các thành phần:

1. **Client 1 (Mobile App)**: Viết bằng **React Native (Expo)**. Giao diện dành cho 2 đối tượng là Ứng viên (Candidate) và Nhà tuyển dụng (Recruiter).
2. **Client 2 (Web Admin)**: Viết bằng **ReactJS (Vite)**. Dành cho Quản trị viên (Admin) để kiểm duyệt, quản lý dữ liệu, xem thống kê.
3. **Backend Server**: Viết bằng **Node.js + Express**. Đóng vai trò là trung tâm xử lý mọi logic nghiệp vụ (Business Logic).
4. **Cơ sở dữ liệu (Database)**: Sử dụng **Firebase Firestore** (NoSQL Database).
5. **Dịch vụ bên thứ ba (Third-party Services)**:
   - **PayOS**: Cổng thanh toán quét mã QR.
   - **Nodemailer**: Gửi Email OTP và thông báo.
   - **Google Gemini API**: Xử lý các tính năng AI (Phân tích CV, Tạo JD, Match Score).

---

## 2. Giải Thích Logic Của Backend API (`bybitjobs-api/src/server.ts`)

Bởi vì toàn bộ Backend được viết tập trung trong một file `server.ts` (kiểu kiến trúc Monolithic - Nguyên khối), bạn cần giải thích theo các khối logic sau:

### 2.1. Logic Kết Nối & Khởi Tạo
- **Khởi tạo Express**: Dùng để tạo Web Server, lắng nghe các HTTP Requests từ Mobile và Web.
- **Kết nối Firebase Admin**: Backend sử dụng Service Account Key (`serviceAccountKey.json`) để có toàn quyền đọc/ghi vào Firestore Database bỏ qua mọi rule bảo mật của Client.
- **Cấu hình CORS & Body Parser**: Cho phép Mobile App và Web Admin gọi API mà không bị chặn lỗi nguồn gốc chéo (CORS).

### 2.2. Logic Xác Thực & Người Dùng (Authentication)
- **Đăng ký / Đăng nhập**: User thường sẽ đăng nhập qua Firebase Auth ở phía Client (Mobile). Sau đó Client sẽ gửi UID hoặc Token xuống Backend.
- **Lưu trữ User**: Khi có user mới, Backend lưu thông tin chi tiết vào collection `users` trên Firestore. Phân loại theo `role` (candidate, recruiter, admin).
- **Quên mật khẩu / Xác thực Email**: Sử dụng **Nodemailer** cấu hình SMTP (thường là Gmail) để tạo mã OTP ngẫu nhiên (6 số), lưu mã này vào Firestore với thời hạn sống (TTL), đồng thời gửi qua email cho user. Nếu user nhập đúng mã, API `/verify` sẽ đổi trạng thái tài khoản.

### 2.3. Logic Tuyển Dụng (Job & Application Flow)
- **Đăng Job (Nhà tuyển dụng)**: Gửi request lên `/api/jobs`. Backend kiểm tra xem Nhà tuyển dụng có còn lượt đăng tin (gói dịch vụ) hay không. Nếu hợp lệ, lưu vào collection `jobs`.
- **Nộp CV (Ứng viên)**: Gọi `/api/applications`. Backend sẽ tạo một bản ghi mới trong collection `applications`, liên kết giữa `jobId` và `candidateId`.
- **Trạng thái Application**: Nhà tuyển dụng có thể đổi trạng thái hồ sơ (Chờ duyệt -> Phỏng vấn -> Chấp nhận/Từ chối) thông qua API `/api/applications/:id/status`.

### 2.4. Logic Trí Tuệ Nhân Tạo (AI Features bằng Gemini)
Đây là phần logic rất hay để "khoe" khi báo cáo:
- **Xoay vòng API Key (Multi-Key Rotation)**: Trong code `server.ts` có viết hàm `getGeminiApiKeys()` để chứa nhiều API Key của Gemini. Khi một Key bị hết lượt gọi (Rate limit), Backend sẽ **tự động chuyển sang Key dự phòng**. Điều này giúp ứng dụng không bao giờ bị sập tính năng AI do quá tải.
- **Phân Tích CV (`/api/users/:uid/cv-analyze`)**: API sẽ đọc nội dung text của CV, gộp chung với một "Prompt" (Câu lệnh hướng dẫn) được thiết kế sẵn. Gửi sang Gemini API để AI phân tích điểm mạnh, điểm yếu và trả về dạng JSON chuẩn hóa.
- **AI Matching (Chấm điểm phù hợp)**: Đưa text của CV và text của Job Description (JD) vào Gemini. Yêu cầu Gemini đánh giá xem CV đáp ứng được bao nhiêu % yêu cầu của JD, và trả ra con số điểm cùng với lý do.

### 2.5. Logic Thanh Toán (Payment với PayOS)
- **Tạo Link Thanh Toán (`/api/payment/create`)**: Khi Nhà tuyển dụng mua gói VIP, Backend gọi API của PayOS, truyền vào số tiền, mã đơn hàng. PayOS trả về một cái Link chứa mã QR. Trả link này về cho Mobile app hiển thị.
- **Xử lý Webhook (`/api/webhooks/payos`)**: Khi khách quét QR và chuyển khoản thành công, PayOS sẽ gọi ngược (Callback) vào đường dẫn này của Backend. Backend xác minh chữ ký (Checksum), cập nhật trạng thái đơn hàng trong Firestore thành "Đã thanh toán" và tự động cộng lượt đăng tin/VIP cho Nhà tuyển dụng.

---

## 3. Giải Thích Logic Của Mobile App (`bybitjobs-mobile-app`)

Mobile App sử dụng **Expo Router**, tức là định tuyến dựa trên file (File-based Routing).

### 3.1. Cấu trúc Routing (Phân luồng màn hình)
- **Thư mục `app/(tabs)`**: Dành riêng cho **Ứng viên**. Khi ứng viên đăng nhập thành công, app sẽ điều hướng vào luồng này, hiển thị thanh Bottom Tab Navigation (Trang chủ, Việc của tôi, Cộng đồng, Hồ sơ).
- **Thư mục `app/recruiter`**: Dành riêng cho **Nhà tuyển dụng**. Nó cung cấp một giao diện quản lý riêng biệt (Dashboard, Quản lý tin, Tìm CV, Nạp tiền).
- **Logic rẽ nhánh (Authentication Guard)**: Trong file `index.tsx` hoặc thẻ Root Layout, logic sẽ kiểm tra: Nếu chưa có Token -> Đẩy ra Login. Nếu có Token nhưng role = "candidate" -> Đẩy vào `(tabs)`. Nếu role = "recruiter" -> Đẩy vào `/recruiter/dashboard`.

### 3.2. Logic Gọi API & Quản lý State
- Ứng dụng dùng các Custom Hook (như `useAuth`) để lưu trạng thái đăng nhập.
- Dữ liệu được gọi thông qua hàm `fetch` hoặc `axios` gọi đến `URL_BACKEND/api/...`. Dữ liệu trả về (JSON) được lưu vào State của React (`useState`, `useEffect`) để render ra giao diện (như danh sách Job, danh sách CV).

---

## 4. Giải Thích Logic Của Web Admin (`bybitjobs-web-admin`)

- **Kiến trúc SPA (Single Page Application)**: Dùng Vite + ReactJS. Giúp chuyển trang mượt mà không bị reload trình duyệt.
- **Bảo mật Admin**: Mọi API gọi từ Web Admin lên Backend đều phải đính kèm Token trong Header. Backend sẽ check Token, nếu không phải Admin sẽ báo lỗi 403 Forbidden.
- **Quản lý trạng thái (State)**: Web admin thường fetch dữ liệu danh sách (Users, Jobs, Payments) và lưu vào State. Khi admin bấm nút "Khóa tài khoản" hay "Duyệt tin", một Request `PUT/DELETE` sẽ được gửi xuống API, nếu thành công thì React sẽ filter và cập nhật lại giao diện ngay lập tức (Real-time UI update).

---

## 5. Các Câu Hỏi Thường Gặp (Phòng thủ khi bị hỏi)

**Q1: Tại sao lại viết tất cả API vào một file `server.ts`?**
*Trả lời:* Vì dự án ở quy mô vừa phải và đang trong giai đoạn MVP (Minimum Viable Product). Việc viết nguyên khối giúp triển khai (deploy) nhanh, dễ debug. Tuy nhiên, nếu sau này dự án mở rộng, tôi sẽ refactor (tái cấu trúc) tách ra thành các thư mục `Routes`, `Controllers`, và `Services` riêng biệt để dễ bảo trì.

**Q2: Hệ thống AI phân tích CV hoạt động như thế nào?**
*Trả lời:* Em trích xuất text từ file CV (nếu là PDF/Word thì dùng thư viện parser như `mammoth`), sau đó ghép chung với Prompt được kỹ sư của em tinh chỉnh để yêu cầu Gemini format kết quả đầu ra theo cấu trúc JSON định sẵn. Từ JSON đó, hệ thống lưu vào Database và hiển thị lên UI thành các biểu đồ/chỉ số.

**Q3: Nhỡ Gemini API bị sập hoặc hết quota thì sao?**
*Trả lời:* Trong hệ thống em đã code logic **Multi-Key Rotation** (Xoay vòng Key dự phòng). Nếu Key A lỗi hoặc bị Rate Limit, hàm catch error sẽ tự động gọi lại (Retry) bằng Key B. Đảm bảo tính liên tục của hệ thống.

**Q4: PayOS Webhook làm sao chống giả mạo thanh toán?**
*Trả lời:* Khi PayOS gửi data về Webhook, nó kèm theo một mã HASH (Checksum). Hệ thống backend của em sẽ dùng Checksum Key bí mật (chỉ backend và PayOS biết) để băm lại data. Nếu khớp nhau thì mới xác nhận là thanh toán thật, tránh việc user gọi API ảo để hack tiền.

