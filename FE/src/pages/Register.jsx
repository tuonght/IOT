import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import PasswordInput from "../components/PasswordInput";
import "./Auth.css";
import "./Register.css";

export default function Register() {
  // State lưu nội dung các ô đăng ký và lỗi validate.
  const [Email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!Email || !username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await api.register({ email: Email, username, password });
      try {
        const user = await api.login({ email: Email, password });
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("email", user.email);
        localStorage.setItem("username", user.username);
        navigate("/dashboard");
      } catch (loginError) {
        setError(
          `Tài khoản đã được tạo nhưng đăng nhập tự động thất bại: ${loginError.message}. Vui lòng đăng nhập thủ công.`
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">Tạo tài khoản</div>
        <div className="auth-sub">Đăng ký để sử dụng hệ thống</div>

        
        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={Email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
              required
            />
          </div>
          <div className="field-group">
            <label>Họ và tên</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập họ và tên"
              required
            />
          </div>
          <div className="field-group">
            <label>Mật khẩu</label>
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              minLength={6}
              required
            />
          </div>
          <div className="field-group">
            <label>Nhập lại mật khẩu</label>
            <PasswordInput
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        {/* Class riêng để căn giữa link đăng nhập ở trang đăng ký. */}
        <div className="auth-links register-links">
          <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
