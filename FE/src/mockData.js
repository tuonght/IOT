

export const mockSensorLatest = {
  temperature: 28.5,
  humidity: 72,
  light: 650,
  updatedAt: "2026-08-19 10:30:12",
};

export const mockChartData = [
  { time: "2026-08-07 08:00:00", temperature: 26, humidity: 75, light: 400 },
  { time: "2026-08-08 10:07:32", temperature: 27, humidity: 73, light: 550 },
  { time: "2026-08-08 12:56:36", temperature: 29, humidity: 70, light: 700 },
  { time: "2026-08-08 14:36:36", temperature: 30, humidity: 68, light: 750 },
  { time: "2026-08-08 16:02:15", temperature: 29, humidity: 71, light: 600 },
  { time: "2026-08-08 18:00:00", temperature: 27, humidity: 74, light: 450 },
  { time: "2026-08-08 20:00:05", temperature: 26, humidity: 76, light: 300 },
  { time: "2026-08-08 21:02:15", temperature: 29, humidity: 71, light: 600 },
  { time: "2026-08-08 21:08:35", temperature: 27, humidity: 74, light: 450 },
  { time: "2026-08-08 22:00:05", temperature: 26, humidity: 76, light: 300 },
];

export const mockDevices = [
  { id: 1, name: "Điều hòa", status: "OFF" },
  { id: 2, name: "Đèn", status: "ON" },
  { id: 3, name: "Quạt", status: "OFF" },
];

export const mockSensorData = [
  { id: 102, type: "Nhiệt độ", value: "28.5 °C", time: "2026-08-19 10:30:12" },
  { id: 101, type: "Độ ẩm", value: "72 %", time: "2026-08-19 10:30:09" },
  { id: 100, type: "Ánh sáng", value: "650 adc", time: "2026-08-19 10:30:06" },
  { id: 99, type: "Nhiệt độ", value: "28.3 °C", time: "2026-08-19 10:30:03" },
  { id: 98, type: "Độ ẩm", value: "73 %", time: "2026-08-19 10:30:00" },
  { id: 97, type: "Ánh sáng", value: "639 adc", time: "2026-08-19 10:29:57" },
  { id: 96, type: "Nhiệt độ", value: "28.1 °C", time: "2026-08-19 10:29:54" },
  { id: 95, type: "Độ ẩm", value: "74 %", time: "2026-08-19 10:29:51" },
  { id: 94, type: "Ánh sáng", value: "631 adc", time: "2026-08-19 10:29:48" },
  { id: 93, type: "Nhiệt độ", value: "27.9 °C", time: "2026-08-19 10:29:45" },
  { id: 92, type: "Độ ẩm", value: "75 %", time: "2026-08-19 10:29:42" },
];

export const mockHistory = [
  { id: 1, device: "Điều hòa", performedBy: "Nguyễn Tường", action: "ON", status: "Success", time: "2026-08-19 09:44:14" },
  { id: 2, device: "Điều hòa", performedBy: "Nguyễn Tường", action: "OFF", status: "Failed", time: "2026-08-19 09:44:35" },
  { id: 3, device: "Đèn", performedBy: "Nguyễn Tường", action: "ON", status: "Loading", time: "2026-08-19 10:05:42" },
  { id: 4, device: "Quạt", performedBy: "Nguyễn Tường", action: "ON", status: "Success", time: "2026-08-19 10:05:45" },
  { id: 5, device: "Quạt", performedBy: "Nguyễn Tường", action: "OFF", status: "Loading", time: "2026-08-19 10:05:57" },
  { id: 6, device: "Điều hòa", performedBy: "Nguyễn Tường", action: "ON", status: "Success", time: "2026-08-19 09:44:14" },
  { id: 7, device: "Điều hòa", performedBy: "Nguyễn Tường", action: "OFF", status: "Failed", time: "2026-08-19 09:44:35" },
  { id: 8, device: "Đèn", performedBy: "Nguyễn Tường", action: "ON", status: "Loading", time: "2026-08-19 10:05:42" },
  { id: 9, device: "Quạt", performedBy: "Nguyễn Tường", action: "ON", status: "Success", time: "2026-08-19 10:05:45" },
  { id: 10, device: "Quạt", performedBy: "Nguyễn Tường", action: "OFF", status: "Loading", time: "2026-08-19 10:05:57" },
  { id: 11, device: "Điều hòa", performedBy: "Nguyễn Tường", action: "ON", status: "Success", time: "2026-08-19 09:44:14" },
  { id: 12, device: "Điều hòa", performedBy: "Nguyễn Tường", action: "OFF", status: "Failed", time: "2026-08-19 09:44:35" },
  { id: 13, device: "Đèn", performedBy: "Nguyễn Tường", action: "ON", status: "Loading", time: "2026-08-19 10:05:42" },
  { id: 14, device: "Quạt", performedBy: "Nguyễn Tường", action: "ON", status: "Success", time: "2026-08-19 10:05:45" },
  { id: 15, device: "Quạt", performedBy: "Nguyễn Tường", action: "OFF", status: "Loading", time: "2026-08-19 10:05:57" },
];

export const mockProfile = {
  username: "Nguyễn Tường",
  email: "nguyentuong@example.com",
  studentId: "B21DCCNxxx",
  className: "IOT Class 05",
  github: "https://github.com/xxx",
  pdfLink: "bhfndkfjd",
  apiDocs: "Postman Document",
  figma: "https://www.figma.com/design/kcg6SGlk2uZsxIzrXiivF4/Untitled?node-id=0-1&p=f&t=lRiyIXqmU7hfGTkG-0",
};
