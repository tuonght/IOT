import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import { DEVICE_ALERT_CONFIG } from "../utils/deviceAlerts";
import "./DeviceAlertSettings.css";

export default function DeviceAlertSettings({ rule, onSaved }) {
  const [open, setOpen] = useState(false);
  const [threshold, setThreshold] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape" && !saving) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, saving]);

  function edit() {
    setThreshold(String(rule.threshold));
    setError("");
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateDeviceAlert(rule.deviceCode, {
        threshold: Number(threshold),
      });
      onSaved(updated);
      setOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (!rule) return null;
  const configured = DEVICE_ALERT_CONFIG[rule.deviceCode];

  return (
    <div className="device-alert-settings">
      <div className="device-alert-rule">
        <span>{configured.sensorLabel} &gt; {Number(rule.threshold)} {configured.unit}</span>
        <button type="button" onClick={edit} aria-label={`Cài đặt cảnh báo ${rule.deviceName}`}>
          Cài đặt
        </button>
      </div>
      {open && createPortal(
        <div className="alert-dialog-backdrop">
          <section className="alert-dialog" role="dialog" aria-modal="true" aria-label={`Ngưỡng cảnh báo ${rule.deviceName}`}>
            <form onSubmit={save}>
              <label htmlFor={`${id}-threshold`}>Ngưỡng ({configured.unit})</label>
              <input id={`${id}-threshold`} type="number" required step="0.01"
                min={configured.min} max={configured.max} value={threshold} disabled={saving}
                onChange={(event) => setThreshold(event.target.value)} />
              {error && <div className="alert-dialog-error" role="alert">{error}</div>}
              <div className="alert-dialog-actions">
                <button type="button" onClick={() => setOpen(false)} disabled={saving}>Hủy</button>
                <button type="submit" disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</button>
              </div>
            </form>
          </section>
        </div>, document.body,
      )}
    </div>
  );
}
