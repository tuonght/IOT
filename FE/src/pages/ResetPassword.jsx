import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import "./Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) {
      setError("Liên kết đặt lại mật khẩu thiếu token.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await api.resetPassword({ token, newPassword: password });
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Đặt lại mật khẩu</div>
        <div className="auth-sub">Tạo mật khẩu mới cho tài khoản của bạn</div>
        {error && <div className="error-text">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="field-group">
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
