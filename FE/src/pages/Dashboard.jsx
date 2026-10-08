import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { mockSensorLatest, mockChartData, mockDevices } from "../mockData";
import "./Dashboard.css";

export default function Dashboard() {
  const [devices, setDevices] = useState(mockDevices);
  const [chartDevice, setChartDevice] = useState("");
  // Toast là thông báo ngắn sau thao tác thiết bị.
  const [toast, setToast] = useState(null); 

  
  const chartData = chartDevice
    ? mockChartData.filter((item) => item.device === chartDevice)
    : mockChartData;


  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2000);
  }

  
  function toggleDevice(id, newStatus) {
    const previousStatus = devices.find((d) => d.id === id)?.status;

    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "loading" } : d))
    );

    
    setTimeout(() => {
      const isSuccess = Math.random() > 0.15; 

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

 
    function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="dashboard-tooltip">
        <div className="dashboard-tooltip-label">{label}</div>
        {payload.map((entry) => (
          <div
            className={`dashboard-tooltip-entry dashboard-tooltip-${entry.dataKey}`}
            key={entry.name}
          >
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
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

      {/* Khu vực biểu đồ lịch sử và thẻ điều khiển thiết bị. */}
      <div className="dash-grid">
        <div className="panel">
          <div className="panel-title chart-header">
            <span>Sensor History over Time</span>

          </div>
          {/* ResponsiveContainer co giãn theo panel; LineChart nhận mảng chartData. */}
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={false} />
              <YAxis fontSize={11} />
              {/* Tooltip và Legend giúp đọc giá trị/tên từng đường. */}
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" />
              
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
              {/* Nút bị khóa khi thao tác đang ở trạng thái loading. */}
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

      {/* Chỉ render toast khi đã có thông báo. */}
      {toast && (
        <div className={"toast " + toast.type}>
          {toast.message}
        </div>
      )}
    </div>
  );
}