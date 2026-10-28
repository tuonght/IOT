const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export function apiAssetUrl(path) {
  return new URL(path, API_URL).toString();
}

export async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = localStorage.getItem("authToken");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "omit",
    headers,
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

function withQuery(path, params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export const api = {
  login: async (data) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    localStorage.setItem("authToken", response.token);
    return response;
  },
  currentUser: () => apiRequest("/auth/me"),
  logout: async () => {
    try {
      return await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("authToken");
    }
  },
  register: (data) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  forgotPassword: (data) => apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify(data) }),
  resetPassword: (data) => apiRequest("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
  changePassword: (data) => apiRequest("/auth/change-password", { method: "POST", body: JSON.stringify(data) }),
  latestSensor: () => apiRequest("/dashboard/sensor-latest"),
  chartData: (sensor = "all") => apiRequest(withQuery("/dashboard/chart", { sensor })),
  devices: () => apiRequest("/devices"),
  deviceAlerts: () => apiRequest("/device-alerts"),
  updateDeviceAlert: (code, data) => apiRequest(`/device-alerts/${code}`, {
    method: "PATCH", body: JSON.stringify(data),
  }),
  deviceAlertStatistics: (days = 7) => apiRequest(withQuery("/device-alerts/statistics", { days })),
  setDeviceStatus: (id, action) => apiRequest(`/devices/${id}/actions`, { method: "POST", body: JSON.stringify({ action }) }),
  sensorData: (params) => apiRequest(withQuery("/sensors", params)),
  history: (params) => apiRequest(withQuery("/history", params)),
  historyDevices: () => apiRequest("/history/devices"),
  profile: () => apiRequest("/profile"),
  updateProfile: (data) => apiRequest("/profile", { method: "PATCH", body: JSON.stringify(data) }),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest("/profile/avatar", { method: "POST", body: formData });
  },
};
