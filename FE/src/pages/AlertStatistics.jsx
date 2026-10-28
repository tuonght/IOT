import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "../api";
import { connectStomp } from "../socket";
import { DEVICE_ALERT_CONFIG } from "../utils/deviceAlerts";
import "./AlertStatistics.css";

const DEVICE_CODES = Object.keys(DEVICE_ALERT_CONFIG);
const number = (value) => Number(value || 0).toLocaleString("vi-VN");
const dateLabel = (value) => `${value.slice(8, 10)}/${value.slice(5, 7)}`;

export default function AlertStatistics() {
  const [days, setDays] = useState(7);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    let requestVersion = 0;
    async function refresh() {
      const version = ++requestVersion;
      try {
        const data = await api.deviceAlertStatistics(days);
        if (mounted && version === requestVersion) {
          setStatistics(data);
          setError("");
        }
      } catch (requestError) {
        if (mounted && version === requestVersion) {
          console.error("Could not load alert statistics", requestError);
          setError("Chưa tải được thống kê. Đang thử lại…");
        }
      }
    }
    refresh();
    const client = connectStomp((connected) => { if (connected) refresh(); });
    const unsubscribe = client.subscribe("/topic/device-alerts", refresh);
    const interval = window.setInterval(refresh, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      unsubscribe();
      client.disconnect();
    };
  }, [days]);

  const data = statistics?.days === days ? statistics : null;
  const totals = Object.fromEntries((data?.devices || []).map((device) => [device.deviceCode, device.total]));

  return (
    <div className="alert-statistics-page">
      <div className="alert-statistics-heading">
        <div>
          <h1>Thống kê cảnh báo đèn</h1>
        </div>
        <label className="alert-statistics-period">
          Khoảng thời gian
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} aria-label="Khoảng thời gian thống kê">
            <option value={1}>1 ngày</option>
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
          </select>
        </label>
      </div>
      {error && <div className="alert-statistics-error" role="alert">{error}</div>}
      <div className="alert-statistics-overview">
        <div><span>Hôm nay</span><strong>{data ? number(data.today) : "—"}</strong></div>
        <div><span>Tổng {days} ngày</span><strong>{data ? number(data.total) : "—"}</strong></div>
        <div><span>Trung bình / ngày</span><strong>{data ? number(data.averagePerDay) : "—"}</strong></div>
      </div>
      <div className="alert-statistics-devices">
        {DEVICE_CODES.map((code) => (
          <div key={code} style={{ borderLeftColor: DEVICE_ALERT_CONFIG[code].color }}>
            <span>{DEVICE_ALERT_CONFIG[code].label}</span>
            <strong>{data ? number(totals[code]) : "—"}<small> lần</small></strong>
          </div>
        ))}
      </div>
      <section className="alert-statistics-chart">
        <div className="alert-statistics-chart-heading">
          <h2>Số lần cảnh báo theo ngày</h2>
          {data && <span>{dateLabel(data.from)} – {dateLabel(data.to)}</span>}
        </div>
        <div className="alert-statistics-chart-body">
          {data ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily} margin={{ top: 12, right: 12, left: 0, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" tickFormatter={dateLabel} minTickGap={22} fontSize={14} />
                <YAxis allowDecimals={false} width={44} fontSize={14} />
                <Tooltip labelFormatter={(value) => dateLabel(value)} formatter={(value, name) => [`${number(value)} lần`, name]} />
                <Legend wrapperStyle={{ fontSize: 15 }} />
                {DEVICE_CODES.map((code) => (
                  <Bar key={code} dataKey={code} name={DEVICE_ALERT_CONFIG[code].label}
                    fill={DEVICE_ALERT_CONFIG[code].color} maxBarSize={36} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="alert-statistics-placeholder">{error ? "Chưa tải được thống kê." : "Đang tải thống kê…"}</div>}
        </div>
        {data?.total === 0 && <p className="alert-statistics-empty">Chưa có cảnh báo trong khoảng thời gian này.</p>}
      </section>
    </div>
  );
}
