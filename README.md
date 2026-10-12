# Hệ thống IoT

## Luồng dữ liệu

- ESP32 publish telemetry JSON tới `iot/sensors/data`; BE nhận MQTT/TCP, lưu readings và phát STOMP tới `/topic/sensors/live`.
- FE Dashboard lấy snapshot ban đầu qua REST, sau đó nhận sensor live và trạng thái thiết bị qua WebSocket/STOMP.
- FE gửi lệnh thiết bị qua `POST /api/devices/{id}/actions`; BE publish `LED1_ON`, `LED1_OFF` (tương tự LED2/LED3) tới `iot/devices/control`.
- BE nhận `iot/devices/status`, cập nhật REST history và phát trạng thái tới `/topic/devices/{deviceId}/status`.
- Endpoint STOMP handshake là `/ws`; broker chỉ bật `/topic`.

## Cấu hình chạy

BE dùng MySQL database `iot` mặc định. Có thể đổi DB bằng `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. DB cần có các bảng tương ứng với JPA entities trong `BE/src/main/java/iot/com/BE/Entity`; BE tự thêm cấu hình ba relay và ba cảm biến khi khởi động.

Đặt cấu hình broker qua biến môi trường, không ghi thông tin xác thực vào source:

- `MQTT_BROKER_URI=tcp://<broker-host>:<port>`
- `MQTT_USERNAME` và `MQTT_PASSWORD`
- Tùy chọn đổi topic: `MQTT_SENSOR_TOPIC`, `MQTT_CONTROL_TOPIC`, `MQTT_STATUS_TOPIC`
- SMTP gửi email đặt lại mật khẩu: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`. Cấu hình `APP_FRONTEND_URL` để link trong email trỏ đúng FE.

Đăng nhập tạo phiên server-side (cookie HttpOnly); đăng xuất hủy phiên tại BE. Email không tồn tại bị từ chối đăng nhập. Quên mật khẩu gửi liên kết dùng một lần, hết hạn sau 30 phút; không gửi mật khẩu dạng văn bản qua email. Nếu SMTP chưa cấu hình, API trả lỗi và FE không báo gửi thành công.

BE mặc định chấp nhận FE ở `http://localhost:5173`; đổi bằng `APP_WEB_ALLOWED_ORIGIN` nếu FE chạy ở origin khác. FE nhận URL qua `VITE_API_URL` (mặc định `http://localhost:8080/api`) và `VITE_WS_URL` (mặc định `ws://localhost:8080/ws`).

## Khởi chạy trên PowerShell

Trong cửa sổ BE, đặt biến MQTT/DB phù hợp môi trường trước khi khởi động:

```powershell
$env:MQTT_BROKER_URI = "tcp://<broker-host>:<port>"
$env:MQTT_USERNAME = "<broker-user>"
$env:MQTT_PASSWORD = "<broker-password>"
Set-Location .\BE
.\mvnw.cmd spring-boot:run
```

Trong cửa sổ FE riêng:

```powershell
Set-Location .\FE
npm run dev
```
