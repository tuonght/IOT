import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "../api";
import { connectStomp } from "../socket";
import "./Dashboard.css";

const EMPTY_SENSOR = { temperature: null, humidity: null, light: null, updatedAt: null };

function formatTime(value) {
  return value ? value.replace("T", " ") : "Chưa có dữ liệu";
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="dashboard-tooltip">
      <div className="dashboard-tooltip-label">{formatTime(label)}</div>
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

export default function Dashboard() {
  const [sensor, setSensor] = useState(EMPTY_SENSOR);
  const [chartData, setChartData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    const client = connectStomp((isConnected) => {
      if (mounted) setSocketConnected(isConnected);
    });
    const unsubscribeSensors = client.subscribe("/topic/sensors/live", (point) => {
      if (!mounted) return;
      setSensor({
        temperature: point.temperature,
        humidity: point.humidity,
        light: point.light,
        updatedAt: point.time,
      });
      setChartData((current) => {
        const existing = current.findIndex((item) => item.time === point.time);
        const next = existing < 0
          ? [...current, point]
          : current.map((item, index) => index === existing ? point : item);
        return next.sort((a, b) => a.time.localeCompare(b.time)).slice(-150);
      });
    });

    async function loadDashboard() {
      try {
        const [latest, chart, currentDevices] = await Promise.all([
          api.latestSensor(),
          api.chartData(),
          api.devices(),
        ]);
        if (!mounted) return;
        setSensor(latest || EMPTY_SENSOR);
        setChartData(chart || []);
        setDevices(currentDevices || []);
        currentDevices.forEach((device) => {
          client.subscribe(`/topic/devices/${device.id}/status`, (update) => {
            if (!mounted) return;
            setDevices((current) => current.map((item) =>
              item.id === update.id ? { ...item, status: update.status } : item
            ));
          });
        });
        setError("");
      } catch (requestError) {
        if (mounted) setError(requestError.message);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
      unsubscribeSensors();
      client.disconnect();
    };
  }, []);

  function showToast(type, message) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  }

  async function toggleDevice(device, action) {
    const previousStatus = device.status;
    setDevices((current) => current.map((item) =>
      item.id === device.id ? { ...item, status: "LOADING" } : item
    ));

    try {
      await api.setDeviceStatus(device.id, action);
      showToast("success", `Đã gửi lệnh ${action}; đang chờ thiết bị phản hồi.`);
    } catch (requestError) {
      setDevices((current) => current.map((item) =>
        item.id === device.id ? { ...item, status: previousStatus } : item
      ));
      showToast("error", requestError.message);
    }
  }

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      <div className="page-title">Dashboard</div>
      <div className="sensor-updated-at" aria-live="polite">
        Live updates: {socketConnected ? "Connected" : "Connecting..."}
      </div>
      {error && <div className="error-text">{error}</div>}

      <div className="metrics">
        <div className="metric-card">
          <div className="metric-label">Temperature</div>
          <div className="metric-value">
            {sensor.temperature ?? "--"}<span className="metric-unit">°C</span>
          </div>
        </div>
        <div className="metric-card humi">
          <div className="metric-label">Humidity</div>
          <div className="metric-value">
            {sensor.humidity ?? "--"}<span className="metric-unit">%</span>
          </div>
        </div>
        <div className="metric-card light">
          <div className="metric-label">Light</div>
          <div className="metric-value">
            {sensor.light ?? "--"}<span className="metric-unit">adc</span>
          </div>
        </div>
      </div>
      <div className="sensor-updated-at">
        Cập nhật lần cuối: {formatTime(sensor.updatedAt)}
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-title chart-header">
            <span>Sensor History over Time</span>
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={false} />
                <YAxis fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="temperature" stroke="#2563eb" name="Temperature" />
                <Line type="monotone" dataKey="humidity" stroke="#dc2626" name="Humidity" />
                <Line type="monotone" dataKey="light" stroke="#d97706" name="Light" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="sensor-updated-at">Chưa nhận được dữ liệu cảm biến.</div>
          )}
        </div>

        <div className="device-list">
          {devices.map((device) => (
            <div className="device-card" key={device.id}>
              <div className="device-top">
                <span className="device-name">{device.name}</span>
                <span className={`device-state ${device.status.toLowerCase()}`}>
                  {device.status}
                </span>
              </div>
              <div className="device-btns">
                {["ON", "OFF"].map((action) => (
                  <button
                    key={action}
                    className={`dbtn${device.status === action ? ` selected ${action.toLowerCase()}` : ""}`}
                    disabled={device.status === "LOADING"}
                    onClick={() => toggleDevice(device, action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!devices.length && !error && (
            <div className="sensor-updated-at">Chưa cấu hình thiết bị.</div>
          )}
        </div>
      </div>
    </div>
  );
}
