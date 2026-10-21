import { useEffect, useRef, useState } from "react";
import { copyText } from "../utils/clipboard";
import "./CopyableTime.css";

export default function CopyableText({ value, label = "nội dung" }) {
  const [copyStatus, setCopyStatus] = useState("");
  const statusTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(statusTimer.current), []);

  async function copyValue() {
    try {
      await copyText(value);
      setCopyStatus("Đã copy");
    } catch {
      setCopyStatus("Không thể copy");
    }
    window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setCopyStatus(""), 1800);
  }

  return (
    <span className="copyable-time copyable-text">
      <span className="copyable-text-value">{value}</span>
      <button
        className="copyable-time-button"
        type="button"
        aria-label={`Sao chép ${label}`}
        title={`Sao chép ${label}`}
        onClick={copyValue}
      >
        ⧉
      </button>
      {copyStatus && (
        <span className="copyable-time-status" role="status">
          {copyStatus}
        </span>
      )}
    </span>
  );
}
