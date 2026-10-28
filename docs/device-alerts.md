# Cảnh báo trên giao diện cho LED1–LED3

ESP32 giữ nguyên firmware: gửi `temperature`, `humidity`, `light`, `timestamp`
qua MQTT như hiện tại, khoảng mỗi 5 giây. Cảnh báo không publish lệnh điều khiển
và không thay đổi trạng thái ON/OFF của đèn phần cứng.

## Cấu hình mặc định

| Đèn | Cảm biến | Điều kiện cảnh báo |
| --- | --- | --- |
| LED1 | Độ ẩm | `humidity > 50.5` |
| LED2 | Ánh sáng | `light > 3500` |
| LED3 | Nhiệt độ | `temperature > 28` |

Mỗi ô đèn có nút **Cài đặt** chỉ để đổi ngưỡng. Cảm biến được cố định trong code:
LED1 theo độ ẩm, LED2 theo ánh sáng, LED3 theo nhiệt độ; giao diện và API đều
không cho đổi cảm biến của đèn.
Cấu hình dùng chung cho các tài khoản vì đây là ba thiết bị dùng chung.
Thay đổi được lưu trong MySQL và áp dụng từ mẫu cảm biến tiếp theo.
Ánh sáng là giá trị ADC đảo chiều 0–4095 mà ESP đang gửi.

Mỗi mẫu mới vượt ngưỡng tính **1 lần cảnh báo cho đèn tương ứng**. Hai mẫu
liên tiếp cách nhau 5 giây đều vượt ngưỡng sẽ tính 2 lần. Nhịp nhấp nháy CSS
không tăng bộ đếm. Mẫu có cùng timestamp hoặc cũ hơn mẫu đã xử lý không được
đếm lại. Bằng ngưỡng hoặc thấp hơn thì ngừng nhấp nháy viền.
Mỗi mẫu vượt ngưỡng chỉ nhấp nháy trong 5 giây tính từ thời gian đo (giờ Việt Nam).
Không có mẫu mới thì viền tự tắt; tải lại cùng mẫu cũ không gia hạn cảnh báo.

Việc đánh giá và đếm chạy ở backend, kể cả khi không mở Dashboard. Bắt đầu
ghi nhận từ lúc bổ sung tính năng; không tính lại dữ liệu cảm biến trước đó.

## API (cần Authorization: Bearer token)

- `GET /api/device-alerts`: lấy cấu hình và trạng thái hiện tại của ba đèn.
- `PATCH /api/device-alerts/LED1`: đổi cấu hình, JSON ví dụ:

  ```json
  { "threshold": 50.5 }
  ```

  API tự xác định cảm biến từ mã đèn; ngưỡng tối đa 2 số thập phân.
  Giới hạn: độ ẩm 0–100, ánh sáng 0–4095, nhiệt độ -40–125.
- `GET /api/device-alerts/statistics?days=7`: nhận `days=1`, `7`, `30`.
  Tính theo ngày lịch Việt Nam, gồm hôm nay và `days - 1` ngày trước.
  Response có `today`, `total`, `averagePerDay`, tổng từng đèn trong `devices`
  và từng ngày trong `daily`. Ngày không có cảnh báo có giá trị 0.
- WebSocket `/topic/device-alerts`: danh sách cấu hình/trạng thái sau khi
  transaction cập nhật hoàn tất. Frontend có tải lại định kỳ và khi kết nối lại.

## Database và kiểm tra

Migration V4 tạo hai bảng mới `device_alert_rules`, `device_alert_events`.
Không lưu cảnh báo vào bảng `History`. Cấu hình ban đầu chỉ thêm nếu chưa có,
không ghi đè ngưỡng đã chỉnh khi restart backend.

Thống kê lưu giá trị và ngưỡng tại thời điểm cảnh báo, nên thay đổi ngưỡng
không làm thay đổi số đếm cũ. Các phép ghi cảnh báo chạy sau khi dữ liệu cảm
biến commit, trong transaction riêng.

```sql
SELECT * FROM device_alert_rules ORDER BY device_code;
SELECT * FROM device_alert_events ORDER BY measured_at DESC LIMIT 20;
```

Frontend: `npm run lint`, `npm run build`.
Backend: `mvn test`. `DeviceAlertDatabaseTests` kiểm tra trên MySQL và rollback
các dữ liệu mẫu; khởi động Spring vẫn áp dụng migration và thêm cấu hình mặc định.

## Các chỗ đọc logic chính

- `BE/src/main/java/iot/com/BE/Service/DeviceAlertService.java`: cảm biến cố định theo đèn,
  ngưỡng mặc định, cập nhật ngưỡng, so sánh mẫu mới và thống kê.
- `BE/src/main/java/iot/com/BE/Service/DeviceAlertListener.java`: chờ transaction commit
  rồi xét cảnh báo hoặc gửi WebSocket. Giữ riêng listener để lời gọi
  `REQUIRES_NEW` đi qua Spring proxy.
- `FE/src/utils/deviceAlerts.js`: thông tin hiển thị dùng chung của ba đèn và thời hạn 5 giây.
- `FE/src/hooks/useDeviceAlerts.js`: tải cấu hình, nhận realtime, hẹn giờ tắt viền.
- `FE/src/components/DeviceAlertSettings.jsx`: nhập/lưu ngưỡng.
- `FE/src/pages/AlertStatistics.jsx`: chọn 1/7/30 ngày và vẽ biểu đồ.
