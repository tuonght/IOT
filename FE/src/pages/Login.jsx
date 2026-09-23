import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [Email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault(); // chặn form load lại trang (hành vi mặc định của HTML form)

    if (!Email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    // TẠM THỜI: chưa có Backend, giả lập đăng nhập luôn thành công.
    // Sau này thay đoạn này bằng: axios.post("/api/auth/login", { username, password })
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", Email);

    navigate("/dashboard"); // điều hướng sang Dashboard sau khi "đăng nhập"
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">IOT CONTROL</div>
        <div className="auth-sub">Đăng nhập để tiếp tục</div>

        {error && <div className="error-text">{error}</div>}

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

        <div className="auth-links">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          <Link to="/register">Tạo tài khoản mới</Link>
        </div>
      </div>
    </div>
  );
}
