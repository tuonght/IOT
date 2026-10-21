import { useEffect, useRef, useState } from "react";
import { copyText } from "../utils/clipboard";
import "./CopyableTime.css";

function formatTime(value) {
  return value
    ? value.trim().replace("T", " ").replace(/\s+/g, " ").slice(0, 19).trim()
    : "Chưa có dữ liệu";
}

export default function CopyableTime({ value }) {
  const [copyStatus, setCopyStatus] = useState("");
  const statusTimer = useRef(null);
  const formattedTime = formatTime(value);

  useEffect(() => () => window.clearTimeout(statusTimer.current), []);

  async function copyTime() {
    try {
      await copyText(formattedTime);
      setCopyStatus("Đã copy");
      window.clearTimeout(statusTimer.current);
      statusTimer.current = window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Không thể copy");
      window.clearTimeout(statusTimer.current);
      statusTimer.current = window.setTimeout(() => setCopyStatus(""), 1800);
    }
  }

  return (
    <span className="copyable-time">
      <time>{formattedTime}</time>
      {value && (
        <button
          className="copyable-time-button"
          type="button"
          aria-label={`Sao chép thời gian ${formattedTime}`}
          title="Sao chép thời gian"
          onClick={copyTime}
        >
          ⧉
        </button>
      )}
      {copyStatus && (
        <span className="copyable-time-status" role="status">
          {copyStatus}
        </span>
      )}
    </span>
  );
}
