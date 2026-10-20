import { useEffect, useRef, useState } from "react";
import "./CopyableTime.css";

function formatTime(value) {
  return value
    ? value.trim().replace("T", " ").replace(/\s+/g, " ").slice(0, 19).trim()
    : "Chưa có dữ liệu";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    try {
      input.select();
      if (!document.execCommand("copy")) {
        throw new Error("Clipboard write failed");
      }
    } finally {
      input.remove();
    }
  }
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
