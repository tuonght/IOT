const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === "string" ? body : body.message || body.detail;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return body;
}

export const api = {
  login: (data) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  currentSession: () => apiRequest("/auth/session"),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  register: (data) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  forgotPassword: (data) => apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify(data) }),
  resetPassword: (data) => apiRequest("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
  changePassword: (data) => apiRequest("/auth/change-password", { method: "POST", body: JSON.stringify(data) }),
  latestSensor: () => apiRequest("/dashboard/sensor-latest"),
  chartData: () => apiRequest("/dashboard/chart"),
  devices: () => apiRequest("/devices"),
  setDeviceStatus: (id, action) => apiRequest(`/devices/${id}/actions`, { method: "POST", body: JSON.stringify({ action }) }),
  sensorData: () => apiRequest("/sensors"),
  history: () => apiRequest("/history"),
  profile: () => apiRequest("/profile"),
  updateProfile: (data) => apiRequest("/profile", { method: "PATCH", body: JSON.stringify(data) }),
};
