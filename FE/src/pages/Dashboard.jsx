import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { mockSensorLatest, mockChartData, mockDevices } from "../mockData";

export default function Dashboard() {
  const [devices, setDevices] = useState(mockDevices);
  const [chartDevice, setChartDevice] = useState("");
  const [toast, setToast] = useState(null); // { type: "success" | "error", message: "..." }

  const chartData = chartDevice
    ? mockChartData.filter((item) => item.device === chartDevice)
    : mockChartData;

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2000); // tự ẩn sau 2 giây
  }

  function toggleDevice(id, newStatus) {
    const previousStatus = devices.find((d) => d.id === id)?.status;

    // Bước 1: chuyển ngay sang "loading" để người dùng thấy đang xử lý
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "loading" } : d))
    );

    // Bước 2: giả lập độ trễ gọi API (setTimeout thay cho lời gọi axios thật sau này)
    // Sau này thay TOÀN BỘ đoạn setTimeout này bằng:
    // axios.post(`/api/devices/${id}/actions`, { action: newStatus })
    //   .then(() => { set status = newStatus; showToast("success", ...) })
    //   .catch(() => { set status = previousStatus; showToast("error", ...) })
    setTimeout(() => {
      const isSuccess = Math.random() > 0.15; // giả lập 85% thành công, 15% thất bại

      if (isSuccess) {
        setDevices((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
        );
        showToast("success", "Đổi trạng thái thành công!");
      } else {
        setDevices((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: previousStatus } : d))
        );
        showToast("error", "Thất bại — thiết bị không phản hồi.");
      }
    }, 1200);
  }

  // Tooltip tùy chỉnh — hiện khi rê/nhấn vào 1 điểm trên biểu đồ.
  // "label" chính là giá trị time của điểm đó (recharts tự truyền vào).
  // "payload" là mảng chứa cả 3 giá trị (temperature/humidity/light) tại điểm đó.
    function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;

    const deviceName = payload[0]?.payload?.device;

    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {deviceName && (
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Thiết bị: {deviceName}</div>
        )}
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {payload.map((entry) => (
          <div key={entry.name} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Dashboard</div>

      <div className="metrics">
        <div className="metric-card">
          <div className="metric-label">Temperature</div>
          <div className="metric-value">
            {mockSensorLatest.temperature}
            <span className="metric-unit">°C</span>
          </div>
        </div>
        <div className="metric-card humi">
          <div className="metric-label">Humidity</div>
          <div className="metric-value">
            {mockSensorLatest.humidity}
            <span className="metric-unit">%</span>
          </div>
        </div>
        <div className="metric-card light">
          <div className="metric-label">Light</div>
          <div className="metric-value">
            {mockSensorLatest.light}
            <span className="metric-unit">adc</span>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-title chart-header">
            <span>Sensor History over Time</span>

          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={false} />
              <YAxis fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#2563eb" name="Temperature" />
              <Line type="monotone" dataKey="humidity" stroke="#dc2626" name="Humidity" />
              <Line type="monotone" dataKey="light" stroke="#d97706" name="Light" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="device-list">
          {devices.map((d) => (
            <div className="device-card" key={d.id}>
              <div className="device-top">
                <span className="device-name">{d.name}</span>
                <span
                  className={
                    "device-state " +
                    (d.status === "ON" ? "on" : d.status === "loading" ? "loading" : "off")
                  }
                >
                  {d.status}
                </span>
              </div>
              <div className="device-btns">
                <button
                  className={"dbtn" + (d.status === "ON" ? " selected on" : "")}
                  disabled={d.status === "loading"}
                  onClick={() => toggleDevice(d.id, "ON")}
                >
                  ON
                </button>
                <button
                  className={"dbtn" + (d.status === "OFF" ? " selected off" : "")}
                  disabled={d.status === "loading"}
                  onClick={() => toggleDevice(d.id, "OFF")}
                >
                  OFF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className={"toast " + toast.type}>
          {toast.message}
        </div>
      )}
    </div>
  );
}