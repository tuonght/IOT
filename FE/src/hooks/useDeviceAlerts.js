import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { connectStomp } from "../socket";
import { deviceAlertExpiresAt, isDeviceAlertActive } from "../utils/deviceAlerts";

export function useDeviceAlerts() {
  const [rules, setRules] = useState([]);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);

  useEffect(() => {
    const active = rules.filter((rule) => rule.active);
    if (active.length === 0) return undefined;
    const now = Date.now();
    const remaining = Math.min(...active.map((rule) => {
      const expiresAt = deviceAlertExpiresAt(rule);
      return Number.isFinite(expiresAt) ? Math.max(0, expiresAt - now) : 0;
    }));
    const timer = window.setTimeout(() => {
      setRules((current) => current.map((rule) =>
        rule.active && !isDeviceAlertActive(rule) ? { ...rule, active: false } : rule
      ));
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [rules]);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      const version = ++requestVersion.current;
      try {
        const data = await api.deviceAlerts();
        if (mounted && version === requestVersion.current) {
          setRules(data);
          setError("");
        }
      } catch (requestError) {
        if (mounted && version === requestVersion.current) {
          console.error("Could not load device alerts", requestError);
          setError("Chưa kết nối được cảnh báo. Đang thử lại…");
        }
      }
    }

    refresh();
    const client = connectStomp((connected) => { if (connected) refresh(); });
    const unsubscribe = client.subscribe("/topic/device-alerts", (data) => {
      if (!mounted) return;
      requestVersion.current += 1;
      setRules(data);
      setError("");
    });
    // Recover missed messages after a connection interruption.
    const interval = window.setInterval(refresh, 5000);
    return () => {
      mounted = false;
      requestVersion.current += 1;
      window.clearInterval(interval);
      unsubscribe();
      client.disconnect();
    };
  }, []);

  function onRuleSaved(rule) {
    requestVersion.current += 1;
    setRules((current) => current.map((item) => item.deviceCode === rule.deviceCode ? rule : item));
    setError("");
  }

  // Polling the same old sample must never restart the five-second warning.
  return {
    rules: rules.map((rule) => ({ ...rule, active: isDeviceAlertActive(rule) })),
    error,
    onRuleSaved,
  };
}
