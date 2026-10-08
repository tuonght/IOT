import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

 
  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập email hoặc tài khoản.");
      return;
    }

    setError("");
   
    setSent(true);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Quên mật khẩu</div>
        <div className="auth-sub">Nhập tài khoản/email để nhận hướng dẫn đặt lại mật khẩu</div>

        {/* Sau khi gửi thì hiện thông báo; trước đó hiện form nhập email. */}
        {sent ? (
          <div className="forgot-password-success">
            Đã gửi hướng dẫn đặt lại mật khẩu (dữ liệu mẫu). Kiểm tra email của bạn.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-text">{error}</div>}
            <div className="field-group">
              <label>Email / Tài khoản</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email hoặc tài khoản"
              />
            </div>
            <button type="submit" className="btn">Gửi yêu cầu</button>
          </form>
        )}

        <div className="auth-links forgot-password-links">
          <Link to="/login">Quay lại Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
