// Display settings shared by the threshold dialog and statistics page.
// Backend enforces the same fixed sensor assignments.
export const DEVICE_ALERT_CONFIG = {
  LED1: {
    sensorLabel: "Độ ẩm", unit: "%", min: 0, max: 100,
    label: "Đèn 1 (Độ ẩm)", color: "#2563eb",
  },
  LED2: {
    sensorLabel: "Ánh sáng", unit: "ADC", min: 0, max: 4095,
    label: "Đèn 2 (Ánh sáng)", color: "#d97706",
  },
  LED3: {
    sensorLabel: "Nhiệt độ", unit: "°C", min: -40, max: 125,
    label: "Đèn 3 (Nhiệt độ)", color: "#9333ea",
  },
};

export const ALERT_DURATION_MS = 5000;

export function deviceAlertExpiresAt(rule) {
  if (!rule?.active || typeof rule.measuredAt !== "string") return NaN;
  // ESP timestamps and backend LocalDateTime use Vietnam time.
  return Date.parse(`${rule.measuredAt}+07:00`) + ALERT_DURATION_MS;
}

export function isDeviceAlertActive(rule, now = Date.now()) {
  const expiresAt = deviceAlertExpiresAt(rule);
  return Number.isFinite(expiresAt) && now < expiresAt;
}
