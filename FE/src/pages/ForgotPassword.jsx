import { useState } from "react";
import { Link } from "react-router-dom";

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
    // TẠM THỜI: chưa có Backend gửi email thật.
    // Sau này thay bằng: axios.post("/api/auth/forgot-password", { email })
    setSent(true);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Quên mật khẩu</div>
        <div className="auth-sub">Nhập tài khoản/email để nhận hướng dẫn đặt lại mật khẩu</div>

        {sent ? (
          <div style={{ fontSize: 13, color: "#16a34a", marginBottom: 16 }}>
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

        <div className="auth-links" style={{ justifyContent: "center" }}>
          <Link to="/login">Quay lại Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
