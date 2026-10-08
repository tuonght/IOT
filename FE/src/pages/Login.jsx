import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  
  const [Email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Xử lý submit đăng nhập; hiện chỉ kiểm tra rỗng và mô phỏng thành công.
  function handleSubmit(e) {
    e.preventDefault(); 

    if (!Email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", Email);

    navigate("/dashboard"); 
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">IOT CONTROL</div>
        <div className="auth-sub">Đăng nhập để tiếp tục</div>

        {error && <div className="error-text">{error}</div>}

        {/* Form gọi handleSubmit; mỗi input là controlled input do React quản lý. */}
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label>Email</label>
            <input
              type="text"
              value={Email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
            />
          </div>
          <div className="field-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button type="submit" className="btn">Đăng nhập</button>
        </form>

        {/* Link điều hướng nội bộ, không tải lại toàn bộ trang. */}
        <div className="auth-links">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          <Link to="/register">Tạo tài khoản mới</Link>
        </div>
      </div>
    </div>
  );
}
