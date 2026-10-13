import { useState } from "react";
import "./PasswordInput.css";

export default function PasswordInput({ className = "", ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className={`password-input ${className}`.trim()}
      />
      <button
        type="button"
        className="password-visibility-toggle"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.2A10.9 10.9 0 0112 5c5 0 8.3 4.1 9.5 6-.5.8-1.3 1.8-2.3 2.8M6.2 6.2C4.4 7.4 3.2 9 2.5 11c1.2 1.9 4.5 6 9.5 6 1 0 2-.2 2.9-.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
