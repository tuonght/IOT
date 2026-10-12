import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import "./Auth.css";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập email hoặc tài khoản.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await api.forgotPassword({ email });
      setSent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Quên mật khẩu</div>
        <div className="auth-sub">Nhập tài khoản/email để nhận hướng dẫn đặt lại mật khẩu</div>

        {/* Sau khi gửi thì hiện thông báo; trước đó hiện form nhập email. */}
        {sent ? (
          <div className="forgot-password-success">
            Đã gửi hướng dẫn đặt lại mật khẩu. Kiểm tra email của bạn.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-text">{error}</div>}
            <div className="field-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email hoặc tài khoản"
              />
            </div>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </form>
        )}

        <div className="auth-links forgot-password-links">
          <Link to="/login">Quay lại Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
