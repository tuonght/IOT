import { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "../api";
import { connectStomp } from "../socket";
import DeviceAlertSettings from "../components/DeviceAlertSettings";
import { useDeviceAlerts } from "../hooks/useDeviceAlerts";
import "./Dashboard.css";

const EMPTY_SENSOR = { temperature: null, humidity: null, light: null, updatedAt: null };
const MIN_DEVICE_LOADING_MS = 1500;

function formatTime(value) {
  return value ? value.replace("T", " ") : "Chưa có dữ liệu";
}

function getYAxisTicks(maximum, baseStep) {
  const safeMaximum = Math.max(0, Number(maximum) || 0);
  const step = Math.max(
    baseStep,
    Math.ceil((safeMaximum / 6) / baseStep) * baseStep,
  );
  const upperBound = Math.max(
    step * 4,
    Math.ceil(safeMaximum / step) * step,
  );

  return Array.from(
    { length: upperBound / step + 1 },
    (_, index) => index * step,
  );
}

function getChartMaxima(readings) {
  return readings.reduce((maxima, reading) => {
    ["temperature", "humidity", "light"].forEach((sensorType) => {
      const value = Number(reading[sensorType]);
      if (Number.isFinite(value)) {
        maxima[sensorType] = Math.max(maxima[sensorType], value);
      }
    });
    return maxima;
  }, { temperature: 0, humidity: 0, light: 0 });
}

function includeLatestReading(readings, latest) {
  if (!latest?.updatedAt) return readings;

  const latestPoint = {
    time: latest.updatedAt,
  };
  ["temperature", "humidity", "light"].forEach((sensorType) => {
    if (latest[sensorType] !== null && latest[sensorType] !== undefined) {
      latestPoint[sensorType] = latest[sensorType];
    }
  });
  if (Object.keys(latestPoint).length === 1) return readings;

  const existingIndex = readings.findIndex((reading) => reading.time === latestPoint.time);
  const merged = existingIndex < 0
    ? [...readings, latestPoint]
    : readings.map((reading, index) =>
        index === existingIndex ? { ...reading, ...latestPoint } : reading
      );

  return merged.sort((a, b) => a.time.localeCompare(b.time)).slice(-15);
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
  const { rules: alertRules, error: alertError, onRuleSaved } = useDeviceAlerts();
  const [sensor, setSensor] = useState(EMPTY_SENSOR);
  const [chartData, setChartData] = useState([]);
  const [chartError, setChartError] = useState("");
  const [chartLoading, setChartLoading] = useState(true);
  const [selectedChartSensor, setSelectedChartSensor] = useState("all");
  const [devices, setDevices] = useState([]);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const sensorMaxima = getChartMaxima(chartData);
  const lightAxisTicks = getYAxisTicks(sensorMaxima.light, 500);
  const environmentAxisTicks = getYAxisTicks(
    Math.max(sensorMaxima.temperature, sensorMaxima.humidity),
    10,
  );
  const selectedSensorTicks = getYAxisTicks(
    sensorMaxima[selectedChartSensor],
    selectedChartSensor === "light" ? 500 : 10,
  );
  const deviceActionMinimumLoading = useRef(new Map());
  const chartRequestVersion = useRef(0);
  const selectedChartSensorRef = useRef("all");

  function showToast(type, message) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  }

  function changeChartSensor(sensorType) {
    selectedChartSensorRef.current = sensorType;
    setSelectedChartSensor(sensorType);
    setChartLoading(true);
    setChartError("");
    const requestVersion = ++chartRequestVersion.current;

    api.chartData(sensorType)
      .then((data) => {
        if (requestVersion === chartRequestVersion.current) {
          const readings = data || [];
          setChartData(readings);
        }
      })
      .catch((requestError) => {
        if (requestVersion === chartRequestVersion.current) {
          setChartError(requestError.message);
        }
      })
      .finally(() => {
        if (requestVersion === chartRequestVersion.current) {
          setChartLoading(false);
        }
      });
  }

  useEffect(() => {
    let mounted = true;
    const initialChartRequestVersion = ++chartRequestVersion.current;
    const client = connectStomp(() => {});
    const unsubscribeSensors = client.subscribe("/topic/sensors/live", (point) => {
      if (!mounted) return;
      setSensor({
        temperature: point.temperature,
        humidity: point.humidity,
        light: point.light,
        updatedAt: point.time,
      });
      setChartData((current) => {
        const selectedSensor = selectedChartSensorRef.current;
        const chartPoint = selectedSensor === "all"
          ? point
          : { time: point.time, [selectedSensor]: point[selectedSensor] };
        const existing = current.findIndex((item) => item.time === chartPoint.time);
        const next = existing < 0
          ? [...current, chartPoint]
          : current.map((item, index) => index === existing ? chartPoint : item);
        return next.sort((a, b) => a.time.localeCompare(b.time)).slice(-15);
      });
    });

    async function loadDashboard() {
      const [latestResult, chartResult, devicesResult] = await Promise.allSettled([
        api.latestSensor(),
        api.chartData("all"),
        api.devices(),
      ]);
      if (!mounted) return;

      const errors = [];
      if (latestResult.status === "fulfilled") {
        setSensor(latestResult.value || EMPTY_SENSOR);
      } else {
        errors.push(`Dữ liệu cảm biến mới nhất: ${latestResult.reason.message}`);
      }

      if (initialChartRequestVersion === chartRequestVersion.current) {
        if (chartResult.status === "fulfilled") {
          const readings = chartResult.value || [];
          const latestReading = latestResult.status === "fulfilled"
            ? latestResult.value
            : null;
          setChartData(includeLatestReading(readings, latestReading));
        } else {
          setChartError(chartResult.reason.message);
        }
        setChartLoading(false);
      }

      if (devicesResult.status === "fulfilled") {
        const currentDevices = devicesResult.value || [];
        setDevices(currentDevices);
        currentDevices.forEach((device) => {
          client.subscribe(`/topic/devices/${device.id}/status`, async (update) => {
            const minimumLoading = deviceActionMinimumLoading.current.get(update.id);
            if (minimumLoading) {
              await minimumLoading;
              deviceActionMinimumLoading.current.delete(update.id);
            }
            if (!mounted) return;
            setDevices((current) => current.map((item) =>
              item.id === update.id
                ? { ...item, status: String(update.status || "OFF").toUpperCase() }
                : item
            ));
            if (update.commandSucceeded === true) {
              const actionText = update.commandAction === "ON" ? "bật" : "tắt";
              showToast("success", `${device.name} đã ${actionText} thành công.`);
            } else if (update.commandSucceeded === false) {
              const actionText = update.commandAction === "ON" ? "bật" : "tắt";
              showToast("error", `${device.name} đã ${actionText} thất bại.`);
            }
          });
        });
      } else {
        errors.push(`Danh sách thiết bị: ${devicesResult.reason.message}`);
      }

      setError(errors.join(" • "));
    }

    loadDashboard();
    return () => {
      mounted = false;
      chartRequestVersion.current += 1;
      unsubscribeSensors();
      client.disconnect();
    };
  }, []);

  async function toggleDevice(device, action) {
    const previousStatus = device.status;
    const minimumLoading = new Promise((resolve) =>
      window.setTimeout(resolve, MIN_DEVICE_LOADING_MS)
    );
    deviceActionMinimumLoading.current.set(device.id, minimumLoading);
    setDevices((current) => current.map((item) =>
      item.id === device.id ? { ...item, status: "LOADING" } : item
    ));

    try {
      await api.setDeviceStatus(device.id, action);
    } catch (requestError) {
      await minimumLoading;
      deviceActionMinimumLoading.current.delete(device.id);
      setDevices((current) => current.map((item) =>
        item.id === device.id ? { ...item, status: previousStatus } : item
      ));
      const actionText = action === "ON" ? "bật" : "tắt";
      showToast("error", `${device.name} đã ${actionText} thất bại. ${requestError.message}`);
    }
  }

  return (
    <div className="dashboard-page">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      <div className="page-title">Dashboard</div>
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
            {sensor.light ?? "--"}<span className="metric-unit">lux</span>
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
            <select
              className="chart-sensor-select"
              aria-label="Chọn loại cảm biến trên biểu đồ"
              value={selectedChartSensor}
              onChange={(event) => changeChartSensor(event.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="temperature">Nhiệt độ</option>
              <option value="humidity">Độ ẩm</option>
              <option value="light">Ánh sáng</option>
            </select>
          </div>
          {chartLoading ? (
            <div className="sensor-updated-at">Đang tải dữ liệu biểu đồ...</div>
          ) : chartError ? (
            <div className="error-text">Không thể tải biểu đồ: {chartError}</div>
          ) : chartData.length ? (
            <div className="chart-with-axis-units">
              <span className={`chart-axis-unit chart-axis-unit-left chart-axis-unit-${selectedChartSensor}`}>
                {selectedChartSensor === "all" || selectedChartSensor === "light"
                  ? "lux"
                  : selectedChartSensor === "temperature" ? "°C" : "%"}
              </span>
              {selectedChartSensor === "all" ? (
                <span className="chart-axis-units-right">
                  <span className="chart-axis-unit chart-axis-unit-temperature">°C</span>
                  <span className="chart-axis-unit chart-axis-unit-humidity">%</span>
                </span>
              ) : null}
              <ResponsiveContainer width="100%" height={360}>
                <LineChart
                  data={chartData}
                  margin={{ top: 32, right: 10, left: 10, bottom: 10 }}
                >
                <CartesianGrid stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={false} />
                {selectedChartSensor === "all" ? (
                  <>
                    <YAxis
                      yAxisId="light"
                      domain={[0, lightAxisTicks[lightAxisTicks.length - 1]]}
                      ticks={lightAxisTicks}
                      fontSize={11}
                    />
                    <YAxis
                      yAxisId="environment"
                      orientation="right"
                      domain={[0, environmentAxisTicks[environmentAxisTicks.length - 1]]}
                      ticks={environmentAxisTicks}
                      fontSize={11}
                    />
                  </>
                ) : (
                  <YAxis
                    domain={[0, selectedSensorTicks[selectedSensorTicks.length - 1]]}
                    ticks={selectedSensorTicks}
                    fontSize={11}
                  />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "16px",
                    fontWeight: 800,
                    paddingTop: "10px",
                  }}
                  formatter={(value) => (
                    <span className={`chart-legend-${value.toLowerCase()}`}>
                      {value}
                    </span>
                  )}
                />
                {(selectedChartSensor === "all" || selectedChartSensor === "temperature") && (
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    yAxisId={selectedChartSensor === "all" ? "environment" : undefined}
                    stroke="#2563eb"
                    name="Temperature"
                    dot={{ r: 3 }}
                  />
                )}
                {(selectedChartSensor === "all" || selectedChartSensor === "humidity") && (
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    yAxisId={selectedChartSensor === "all" ? "environment" : undefined}
                    stroke="#dc2626"
                    name="Humidity"
                    dot={{ r: 3 }}
                  />
                )}
                {(selectedChartSensor === "all" || selectedChartSensor === "light") && (
                  <Line
                    type="monotone"
                    dataKey="light"
                    yAxisId={selectedChartSensor === "all" ? "light" : undefined}
                    stroke="#d97706"
                    name="Light"
                    dot={{ r: 3 }}
                  />
                )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="sensor-updated-at">Chưa nhận được dữ liệu cảm biến.</div>
          )}
        </div>

        <div className="device-list">
          <div className="panel-title">Thiết bị</div>
          {alertError && <div className="device-alert-error">Cảnh báo: {alertError}</div>}
          {devices.filter((device) => device.code !== "LED4").map((device) => {
            const alertRule = alertRules.find((rule) => rule.deviceCode === device.code);
            return (
              <div className={`device-card${alertRule?.active ? " device-alert-active" : ""}`} key={device.id}>
                <div className="device-top">
                  <span className="device-name">{device.name}</span>
                  <span
                    className={`device-state ${String(device.status || "OFF").toLowerCase()}`}
                    aria-live="polite"
                  >
                    {String(device.status || "OFF").toUpperCase()}
                  </span>
                </div>
                <div className="device-btns">
                  {["ON", "OFF"].map((action) => (
                    <button
                      key={action}
                      className={`dbtn ${
                        String(device.status).toUpperCase() === "OFF" && action === "ON"
                          ? "available-on"
                          : String(device.status).toUpperCase() === "ON" && action === "OFF"
                            ? "available-off"
                            : ""
                      }`}
                      disabled={String(device.status).toUpperCase() === "LOADING"}
                      onClick={() => toggleDevice(device, action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
                <DeviceAlertSettings rule={alertRule} onSaved={onRuleSaved} />
              </div>
            );
          })}
          {!devices.length && !error && (
            <div className="sensor-updated-at">Chưa cấu hình thiết bị.</div>
          )}
        </div>
      </div>
    </div>
  );
}
