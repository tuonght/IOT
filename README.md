# Hệ thống IoT

Ứng dụng gồm backend Spring Boot (`BE`) và frontend React/Vite (`FE`).

## Đăng nhập và xác thực API

API sử dụng JWT, không dùng session cookie. Mặc định backend chạy tại
`http://localhost:8080`, frontend tại `http://localhost:5173`.

1. Đăng ký bằng `POST /api/auth/register`.
2. Đăng nhập bằng `POST /api/auth/login`; response có trường `token`.
3. Với API cần đăng nhập, gửi header:

   ```text
   Authorization: Bearer <token>
   ```

   Trên Postman, chọn **Authorization → Bearer Token** và nhập token.
4. Token mặc định hết hạn sau 24 giờ. `POST /api/auth/logout` trả về `204`;
   vì JWT là stateless, client cần xóa token để đăng xuất.

Các API công khai:

| Method | Đường dẫn | Chức năng |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Tạo tài khoản |
| `POST` | `/api/auth/login` | Đăng nhập và cấp JWT |
| `POST` | `/api/auth/logout` | Đăng xuất phía client |
| `POST` | `/api/auth/forgot-password` | Gửi email đặt lại mật khẩu |
| `POST` | `/api/auth/reset-password` | Đặt mật khẩu mới bằng token email |

Các API còn lại yêu cầu JWT:

| Method | Đường dẫn | Chức năng |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Thông tin tài khoản hiện tại |
| `POST` | `/api/auth/change-password` | Đổi mật khẩu khi đã đăng nhập |
| `GET`, `PATCH` | `/api/profile` | Xem/cập nhật hồ sơ |
| `POST` | `/api/profile/avatar` | Tải ảnh đại diện (`multipart/form-data`, key `file`) |

Ảnh được đổi tên UUID và lưu trên ổ đĩa trong thư mục `uploads/avatars` (có thể
đổi bằng `APP_AVATAR_DIRECTORY`). Database chỉ lưu URL dạng `/uploads/{filename}`;
ảnh được phục vụ trực tiếp qua static resource `/uploads/**`, không cần API GET
riêng cho ảnh.
| `GET` | `/api/devices` | Danh sách thiết bị |
| `POST` | `/api/devices/{id}/actions` | Gửi lệnh `ON`/`OFF` |
| `GET` | `/api/history` | Tìm/lọc lịch sử thao tác, phân trang |
| `GET` | `/api/history/devices` | Danh sách thiết bị có lịch sử để lọc |
| `GET` | `/api/sensors` | Tìm/lọc dữ liệu cảm biến, phân trang |
| `GET` | `/api/dashboard/sensor-latest` | Số đo cảm biến mới nhất |
| `GET` | `/api/dashboard/chart` | Dữ liệu biểu đồ |

### Tham số tìm kiếm và phân trang

`GET /api/sensors` nhận `type`, `q`, `sort`, `page` và `size`.
Ví dụ: `/api/sensors?type=temperature&q=25&sort=asc&page=0&size=10`.
`type` nhận `all`, `time`, `temperature`, `humidity`, `light` hoặc nhãn tiếng Việt.
`q` tìm theo nhãn/giá trị/thời gian khi `type=all`, theo thời gian khi `type=time`,
hoặc theo giá trị và thời gian khi lọc một cảm biến cụ thể. `sort` nhận `asc` hoặc
`desc` để sắp xếp theo giá trị cảm biến.

`GET /api/history` nhận `device`, `action`, `status`, `time`, `page` và `size`.
Ví dụ: `/api/history?device=Đèn%201&action=ON&status=SUCCESS&page=0&size=10`.
`action` nhận `ON`/`OFF`; `status` nhận `LOADING`, `SUCCESS` hoặc `FAILED`.
`time` tìm chuỗi con trong thời gian yêu cầu.

`GET /api/dashboard/chart` nhận query parameter `sensor`: `all` (mặc định),
`temperature`, `humidity` hoặc `light`. Ví dụ:
`/api/dashboard/chart?sensor=temperature`. Chọn `all` trả cả ba loại số đo;
chọn một cảm biến trả tối đa 15 số đo gần nhất của cảm biến đó, mỗi điểm chỉ
gồm `time` và trường của cảm biến được chọn.

Cả hai endpoint trả kết quả theo trang với cấu trúc `content`, `page` (bắt đầu từ
0), `size`, `totalElements` và `totalPages`. `size` mặc định là 10 và tối đa 100.

JWT được ký bằng biến môi trường `JWT_SECRET` và hết hạn theo
`JWT_EXPIRATION_SECONDS` (mặc định 86400 giây). Giá trị bí mật mặc định trong
cấu hình chỉ dành cho chạy local; cần đặt secret ngẫu nhiên riêng khi triển khai.

## Chạy ứng dụng

Backend cần MySQL và cấu hình kết nối trong `BE/src/main/resources/application.properties`
(hoặc các biến môi trường tương ứng). Chạy backend từ thư mục `BE`:

```powershell
.\mvnw.cmd spring-boot:run
```

Chạy frontend từ thư mục `FE`:

```powershell
npm install
npm run dev
```

Các lệnh kiểm tra frontend:

```powershell
npm run lint
npm run build
```
